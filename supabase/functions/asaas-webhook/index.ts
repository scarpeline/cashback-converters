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
          // Atualizar pagamento no banco
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: event.payment.confirmedDate || new Date().toISOString(),
            })
            .eq("asaas_payment_id", event.payment.id);

          if (updateError) {
            console.error("[WEBHOOK] Failed to update payment:", updateError);
          } else {
            console.log(`[WEBHOOK] Payment ${event.payment.id} confirmed`);
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
