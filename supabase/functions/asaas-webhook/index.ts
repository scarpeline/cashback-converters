import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    billingType: string;
    confirmedDate?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    status: string;
  };
}

/**
 * Verifica assinatura do webhook (quando configurado)
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string | null
): boolean {
  // Secret é OBRIGATÓRIO - rejeita se não configurado
  if (!secret) {
    console.error("[WEBHOOK] No webhook secret configured - rejecting request");
    return false;
  }

  // Se há secret mas não há assinatura, rejeita
  if (!signature) {
    console.error("[WEBHOOK] Missing signature header");
    return false;
  }

  // TODO: Implementar verificação HMAC quando Asaas fornecer documentação
  // Por enquanto, aceita se o token bater
  return signature === secret;
}

/**
 * Log do evento no banco
 */
async function logWebhookEvent(
  supabase: any,
  service: string,
  environment: string,
  eventType: string,
  status: string,
  data: Record<string, unknown>,
  error?: string
) {
  try {
    await supabase.from("integration_logs").insert({
      service,
      environment,
      event_type: "WEBHOOK",
      status,
      request_data: { event: eventType },
      response_data: data,
      error_message: error,
    });
  } catch (err) {
    console.error("[WEBHOOK] Failed to log event:", err);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apenas POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ASAAS_WEBHOOK_SECRET = Deno.env.get("ASAAS_WEBHOOK_SECRET");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[WEBHOOK] Missing Supabase configuration");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.text();
    const signature = req.headers.get("asaas-access-token");

    // Verificar assinatura
    if (!verifyWebhookSignature(body, signature, ASAAS_WEBHOOK_SECRET || null)) {
      console.error("[WEBHOOK] Invalid signature");
      await logWebhookEvent(
        supabase,
        "asaas",
        "unknown",
        "verification_failed",
        "error",
        {},
        "Invalid webhook signature"
      );
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event: AsaasWebhookEvent = JSON.parse(body);
    console.log(`[WEBHOOK] Received event: ${event.event}`);

    // Detectar ambiente baseado no payment ID ou configuração
    const environment = ASAAS_WEBHOOK_SECRET?.includes("test") ? "sandbox" : "production";

    // Processar evento
    switch (event.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        if (event.payment) {
          const extRef = event.payment.externalReference || "";
          if (extRef.startsWith("msgpkg:")) {
            const parts = extRef.split(":");
            const packageId = parts[1];
            const barbershopId = parts[2];
            if (packageId && barbershopId) {
              const { data: pkg } = await supabase.from("messaging_packages").select("quantity, channel").eq("id", packageId).single();
              if (pkg) {
                const { data: existing } = await supabase.from("messaging_credits").select("id, remaining, total_purchased").eq("barbershop_id", barbershopId).eq("channel", pkg.channel).maybeSingle();
                const addQty = pkg.quantity;
                if (existing) {
                  await supabase.from("messaging_credits").update({
                    remaining: (existing.remaining || 0) + addQty,
                    total_purchased: (existing.total_purchased || 0) + addQty,
                    updated_at: new Date().toISOString(),
                  }).eq("id", existing.id);
                } else {
                  await supabase.from("messaging_credits").insert({
                    barbershop_id: barbershopId,
                    channel: pkg.channel,
                    remaining: addQty,
                    total_purchased: addQty,
                  });
                }
                console.log(`[WEBHOOK] Credited ${addQty} ${pkg.channel} to barbershop ${barbershopId}`);
              }
            }
          }
          // Validar que o pagamento pertence a um contexto comercial válido
          const { data: paymentRecord, error: fetchError } = await supabase
            .from("payments")
            .select("id, barbershop_id, client_id, amount, status")
            .eq("asaas_payment_id", event.payment.id)
            .single();
          
          if (fetchError || !paymentRecord) {
            console.error(`[WEBHOOK] Payment ${event.payment.id} not found in database`);
            await logWebhookEvent(
              supabase,
              "asaas",
              environment,
              "payment_not_found",
              "error",
              { payment_id: event.payment.id },
              "Payment not found in database"
            );
            return new Response(JSON.stringify({ error: "Payment not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Validar valor do pagamento para evitar manipulação
          const paymentValue = Number(event.payment.value);
          const expectedValue = Number(paymentRecord.amount);
          if (Math.abs(paymentValue - expectedValue) > 0.01) {
            console.error(`[WEBHOOK] Payment value mismatch: expected ${expectedValue}, got ${paymentValue}`);
            await logWebhookEvent(
              supabase,
              "asaas",
              environment,
              "value_mismatch",
              "error",
              { payment_id: event.payment.id, expected: expectedValue, received: paymentValue },
              "Payment value mismatch"
            );
            return new Response(JSON.stringify({ error: "Payment value mismatch" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Validar que o pagamento não está em estado final
          if (paymentRecord.status === "paid" || paymentRecord.status === "refunded") {
            console.log(`[WEBHOOK] Payment ${event.payment.id} already in final state: ${paymentRecord.status}`);
            return new Response(JSON.stringify({ already_processed: true }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: event.payment.confirmedDate || new Date().toISOString(),
            })
            .eq("id", paymentRecord.id);
          if (updateError) console.error("[WEBHOOK] Failed to update payment:", updateError);
          else console.log(`[WEBHOOK] Payment ${event.payment.id} confirmed`);

          // ========== GERAR COMISSÕES DE PARCEIROS ==========
          if (!updateError && paymentRecord.status !== "paid") {
            try {
              // 1. Verificar se cliente foi indicado por um parceiro
              const { data: referral } = await supabase
                .from("partner_referrals")
                .select("referrer_id")
                .eq("referred_user_id", paymentRecord.client_id)
                .eq("status", "completed")
                .maybeSingle();

              if (referral?.referrer_id) {
                const commissionAmount = paymentRecord.amount * 0.10;
                await supabase.from("partner_commissions").insert({
                  partner_id: referral.referrer_id,
                  type: "referral",
                  amount: commissionAmount,
                  description: `Comissão de indicação - Cliente ${paymentRecord.client_id.substring(0, 8)}`,
                  source_id: event.payment.id,
                  source_type: "payment",
                  status: "pending",
                });
                // Notificar parceiro
                await supabase.from("partner_notifications").insert({
                  partner_id: referral.referrer_id,
                  type: "commission_generated",
                  title: "Nova comissão gerada",
                  message: `Você ganhou R$ ${commissionAmount.toFixed(2)} de comissão por indicação`,
                  data: { amount: commissionAmount, type: "referral" },
                  read: false,
                });
                console.log(`[WEBHOOK] Created referral commission: ${commissionAmount} for partner ${referral.referrer_id}`);
              }

              // 2. Verificar se barbershop é franqueado
              const { data: franchise } = await supabase
                .from("partners")
                .select("id, parent_id")
                .eq("barbershop_id", paymentRecord.barbershop_id)
                .eq("type", "franqueado")
                .eq("status", "ativo")
                .maybeSingle();

              if (franchise?.id) {
                const commissionAmount = paymentRecord.amount * 0.30;
                await supabase.from("partner_commissions").insert({
                  partner_id: franchise.id,
                  type: "franchise_revenue",
                  amount: commissionAmount,
                  description: `Comissão sobre faturamento da unidade`,
                  source_id: event.payment.id,
                  source_type: "payment",
                  status: "pending",
                });
                // Notificar franqueado
                await supabase.from("partner_notifications").insert({
                  partner_id: franchise.id,
                  type: "commission_generated",
                  title: "Nova comissão gerada",
                  message: `Você ganhou R$ ${commissionAmount.toFixed(2)} de comissão sobre faturamento`,
                  data: { amount: commissionAmount, type: "franchise_revenue" },
                  read: false,
                });
                console.log(`[WEBHOOK] Created franchise commission: ${commissionAmount} for partner ${franchise.id}`);

                // 3. Se franqueado tem diretor, gerar comissão de rede
                if (franchise.parent_id) {
                  const { data: director } = await supabase
                    .from("partners")
                    .select("id")
                    .eq("id", franchise.parent_id)
                    .eq("type", "diretor")
                    .eq("status", "ativo")
                    .maybeSingle();

                  if (director?.id) {
                    const networkCommissionAmount = paymentRecord.amount * 0.05;
                    await supabase.from("partner_commissions").insert({
                      partner_id: director.id,
                      type: "network_revenue",
                      amount: networkCommissionAmount,
                      description: `Comissão sobre faturamento da rede`,
                      source_id: event.payment.id,
                      source_type: "payment",
                      status: "pending",
                    });
                    // Notificar diretor
                    await supabase.from("partner_notifications").insert({
                      partner_id: director.id,
                      type: "commission_generated",
                      title: "Nova comissão de rede",
                      message: `Você ganhou R$ ${networkCommissionAmount.toFixed(2)} de comissão sobre a rede`,
                      data: { amount: networkCommissionAmount, type: "network_revenue" },
                      read: false,
                    });
                    console.log(`[WEBHOOK] Created network commission: ${networkCommissionAmount} for director ${director.id}`);
                  }
                }
              }
            } catch (commissionError) {
              console.error("[WEBHOOK] Error generating commissions:", commissionError);
              // Não falha o webhook se comissão falhar
            }
          }
        }
        break;
      }

      case "PAYMENT_OVERDUE": {
        if (event.payment) {
          await supabase
            .from("payments")
            .update({ status: "overdue" })
            .eq("asaas_payment_id", event.payment.id);
        }
        break;
      }

      case "PAYMENT_REFUNDED": {
        if (event.payment) {
          await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("asaas_payment_id", event.payment.id);
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.event}`);
    }

    // Log do evento
    await logWebhookEvent(
      supabase,
      "asaas",
      environment,
      event.event,
      "success",
      { payment_id: event.payment?.id, subscription_id: event.subscription?.id }
    );

    return new Response(
      JSON.stringify({ received: true, event: event.event }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: "Failed to process webhook", details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
