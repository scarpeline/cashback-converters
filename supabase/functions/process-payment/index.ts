import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChargeBody {
  action: "charge" | "get" | "refund" | "create-professional-account";
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
  // create-professional-account fields
  professional_id?: string;
  cpf_cnpj?: string;
  name?: string;
  email?: string;
  pix_key?: string;
}

function getAsaasConfig() {
  // Check if we have sandbox key - if yes, use sandbox
  const sandboxKey = Deno.env.get("ASAAS_API_KEY_SANDBOX");
  const prodKey = Deno.env.get("ASAAS_API_KEY_PRODUCTION");
  
  // Prefer sandbox if available, unless explicitly set to production
  const explicitEnv = Deno.env.get("APP_ENVIRONMENT");
  const isSandbox = explicitEnv === "production" ? false : !!sandboxKey;
  
  const apiKey = isSandbox ? sandboxKey : prodKey;
  
  const baseUrl = isSandbox
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/api/v3";

  return { apiKey, baseUrl, environment: isSandbox ? "sandbox" : "production" };
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

function onlyDigits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(cpf[10]);
}

function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (base: string, factors: number[]) => {
    let sum = 0;
    for (let i = 0; i < factors.length; i++) sum += Number(base[i]) * factors[i];
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== Number(cnpj[12])) return false;

  const d2 = calc(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === Number(cnpj[13]);
}

function isValidCpfCnpj(doc: string): boolean {
  if (doc.length === 11) return isValidCPF(doc);
  if (doc.length === 14) return isValidCNPJ(doc);
  return false;
}

async function getOrCreateCustomer(supabaseAdmin: any, userId: string): Promise<string> {
  // Try to get barbershop's asaas_customer_id first
  const { data: barbershop } = await supabaseAdmin
    .from("barbershops")
    .select("asaas_customer_id, name, phone")
    .eq("owner_user_id", userId)
    .limit(1)
    .single();

  if (barbershop?.asaas_customer_id) {
    return barbershop.asaas_customer_id;
  }

  // Get profile info to create customer
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name, email, whatsapp, cpf_cnpj")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!profile) throw new Error("Perfil do usuário não encontrado.");

  // Validate or use test CPF for sandbox
  const { environment } = getAsaasConfig();
  const docDigits = onlyDigits(profile.cpf_cnpj);

  // ASAAS requires a valid CPF/CNPJ.
  // In sandbox, we allow running with a built-in valid test CPF when profile is invalid.
  const sandboxTestCPF = "11144477735";

  const cpfCnpjDigits = isValidCpfCnpj(docDigits)
    ? docDigits
    : (environment === "sandbox" ? sandboxTestCPF : "");

  if (!cpfCnpjDigits) {
    throw new Error("CPF/CNPJ inválido. Atualize seu perfil antes de receber pagamentos.");
  }

  // Create customer in ASAAS
  const customerData = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: profile.name || "Cliente",
      email: profile.email,
      phone: onlyDigits(profile.whatsapp) || undefined,
      cpfCnpj: cpfCnpjDigits,
      externalReference: userId,
    }),
  });

  // Save asaas_customer_id back to barbershop
  if (barbershop) {
    await supabaseAdmin
      .from("barbershops")
      .update({ asaas_customer_id: customerData.id })
      .eq("owner_user_id", userId);
  }

  return customerData.id;
}

async function handleCharge(body: ChargeBody, customerId: string) {
  const amount = Number(body.amount);
  if (!amount || amount <= 0) throw new Error("Valor inválido.");

  const dueDate = body.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const chargePayload: Record<string, unknown> = {
    customer: customerId,
    billingType: body.billing_type || "PIX",
    value: amount,
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;
  const serviceRoleClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body: ChargeBody = await req.json();
    const { environment } = getAsaasConfig();

    let result;
    switch (body.action) {
      case "charge":
        // Auto-resolve customer_id if not provided
        const customerId = body.customer_id || await getOrCreateCustomer(serviceRoleClient, userId);
        result = await handleCharge(body, customerId);
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
