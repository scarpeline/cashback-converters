import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChargeBody {
  action: "charge" | "get" | "refund";
  // charge fields
  customer_id?: string;
  amount?: number;
  description?: string;
  billing_type?: string;
  due_date?: string;
  external_reference?: string;
  split?: Array<{ wallet_id: string; fixed_value?: number; percentage_value?: number }>;
  // get/refund fields
  payment_id?: string;
}

function getAsaasConfig() {
  const env = Deno.env.get("APP_ENVIRONMENT") || "sandbox";
  const isSandbox = env === "sandbox";
  
  const apiKey = isSandbox
    ? Deno.env.get("ASAAS_API_KEY_SANDBOX")
    : Deno.env.get("ASAAS_API_KEY_PRODUCTION");
  
  const baseUrl = isSandbox
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/api/v3";

  return { apiKey, baseUrl, environment: env };
}

async function asaasFetch(path: string, options: RequestInit = {}) {
  const { apiKey, baseUrl } = getAsaasConfig();
  
  if (!apiKey) {
    throw new Error("ASAAS API key not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || `Asaas error: ${response.status}`);
  }

  return data;
}

async function handleCharge(body: ChargeBody) {
  const dueDate = body.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const chargePayload: Record<string, unknown> = {
    customer: body.customer_id,
    billingType: body.billing_type || "PIX",
    value: body.amount,
    dueDate,
    description: body.description || "Pagamento Salão Cashback",
    externalReference: body.external_reference || undefined,
  };

  // Split rules
  if (body.split && body.split.length > 0) {
    chargePayload.split = body.split.map((s) => ({
      walletId: s.wallet_id,
      fixedValue: s.fixed_value,
      percentualValue: s.percentage_value,
    }));
  }

  const payment = await asaasFetch("/payments", {
    method: "POST",
    body: JSON.stringify(chargePayload),
  });

  // Get PIX QR code if billing type is PIX
  let pixQrCode = null;
  let pixCopyPaste = null;

  if ((body.billing_type || "PIX") === "PIX" && payment.id) {
    try {
      const pixData = await asaasFetch(`/payments/${payment.id}/pixQrCode`);
      pixQrCode = pixData.encodedImage;
      pixCopyPaste = pixData.payload;
    } catch (err) {
      console.error("[PAYMENT] Failed to get PIX QR:", err);
    }
  }

  return {
    payment_id: payment.id,
    status: payment.status,
    pix_qr_code: pixQrCode,
    pix_copy_paste: pixCopyPaste,
    payment_link: payment.invoiceUrl,
    invoice_url: payment.invoiceUrl,
  };
}

async function handleGet(paymentId: string) {
  const payment = await asaasFetch(`/payments/${paymentId}`);
  return {
    payment_id: payment.id,
    status: payment.status,
    payment_link: payment.invoiceUrl,
    invoice_url: payment.invoiceUrl,
  };
}

async function handleRefund(paymentId: string, amount?: number) {
  const refundPayload = amount ? { value: amount } : {};
  await asaasFetch(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(refundPayload),
  });
  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claims, error: claimsError } = await supabase.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  
  if (claimsError || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: ChargeBody = await req.json();
    const { environment } = getAsaasConfig();

    let result;
    switch (body.action) {
      case "charge":
        result = await handleCharge(body);
        break;
      case "get":
        if (!body.payment_id) throw new Error("payment_id required");
        result = await handleGet(body.payment_id);
        break;
      case "refund":
        if (!body.payment_id) throw new Error("payment_id required");
        result = await handleRefund(body.payment_id, body.amount);
        break;
      default:
        throw new Error("Invalid action");
    }

    // Log integration
    const serviceRoleClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await serviceRoleClient.from("integration_logs").insert({
      service: "asaas",
      environment,
      event_type: "API_CALL",
      status: "success",
      request_data: { action: body.action, billing_type: body.billing_type },
      response_data: { payment_id: (result as any).payment_id },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PAYMENT] Error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
