import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (!apiKey) throw new Error("ASAAS API key not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || `Asaas error: ${response.status}`);
  }
  return data;
}

// Plan definitions matching the landing page
const PLANS = [
  {
    name: "SalãoCashBack - Mensal",
    description: "Plano mensal com 14 dias grátis. R$29,90/mês.",
    value: 29.90,
    cycle: "MONTHLY",
    externalReference: "plan_mensal",
  },
  {
    name: "SalãoCashBack - Semestral",
    description: "Plano semestral - Economize 5%. R$169,90 a cada 6 meses.",
    value: 169.90,
    cycle: "SEMESTERLY",
    externalReference: "plan_semestral",
  },
  {
    name: "SalãoCashBack - Anual",
    description: "Plano anual - Economize 16%. R$299,90/ano.",
    value: 299.90,
    cycle: "YEARLY",
    externalReference: "plan_anual",
  },
];

/**
 * Create a customer in ASAAS if not exists
 */
async function ensureCustomer(userId: string, name: string, email: string, cpfCnpj?: string) {
  // Check if customer already exists
  const existing = await asaasFetch(`/customers?externalReference=${userId}`);
  if (existing.data && existing.data.length > 0) {
    return existing.data[0];
  }

  // Create customer
  const customer = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      cpfCnpj: cpfCnpj?.replace(/\D/g, "") || undefined,
      externalReference: userId,
      notificationDisabled: false,
    }),
  });
  return customer;
}

/**
 * Create subscription with payment link
 */
async function createSubscription(customerId: string, planIndex: number, userId: string) {
  const plan = PLANS[planIndex];
  if (!plan) throw new Error("Invalid plan index");

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 14); // 14 dias grátis
  const dueDateStr = nextDueDate.toISOString().split("T")[0];

  const subscription = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED", // Allows PIX, card, boleto
      value: plan.value,
      nextDueDate: dueDateStr,
      cycle: plan.cycle,
      description: plan.description,
      externalReference: `${plan.externalReference}_${userId}`,
    }),
  });

  return {
    subscription_id: subscription.id,
    status: subscription.status,
    next_due_date: subscription.nextDueDate,
    payment_link: subscription.paymentLink || null,
  };
}

/**
 * Generate a standalone payment link for a plan
 */
async function createPaymentLink(planIndex: number) {
  const plan = PLANS[planIndex];
  if (!plan) throw new Error("Invalid plan index");

  const link = await asaasFetch("/paymentLinks", {
    method: "POST",
    body: JSON.stringify({
      name: plan.name,
      description: plan.description,
      endDate: null,
      value: plan.value,
      billingType: "UNDEFINED",
      chargeType: "RECURRENT",
      subscriptionCycle: plan.cycle,
      dueDateLimitDays: 10,
      maxInstallmentCount: 1,
      notificationEnabled: true,
    }),
  });

  return {
    id: link.id,
    name: link.name,
    url: link.url,
    value: link.value,
  };
}

/**
 * List existing payment links
 */
async function listPaymentLinks() {
  const links = await asaasFetch("/paymentLinks?limit=20");
  return links.data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let result: unknown;

    switch (action) {
      case "create_payment_links": {
        // Create payment links for all plans
        const links = [];
        for (let i = 0; i < PLANS.length; i++) {
          try {
            const link = await createPaymentLink(i);
            links.push({ plan: PLANS[i].externalReference, ...link });
          } catch (err) {
            links.push({
              plan: PLANS[i].externalReference,
              error: err instanceof Error ? err.message : "Failed",
            });
          }
        }
        result = { links };
        break;
      }

      case "list_payment_links": {
        result = await listPaymentLinks();
        break;
      }

      case "subscribe": {
        // Requires auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: userErr } = await anonClient.auth.getUser();
        if (userErr || !user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get profile
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("name, email, cpf_cnpj")
          .eq("user_id", user.id)
          .single();

        const customerName = profile?.name || user.email || "Cliente";
        const customerEmail = profile?.email || user.email || "";
        const cpfCnpj = profile?.cpf_cnpj || undefined;

        // Ensure ASAAS customer
        const customer = await ensureCustomer(user.id, customerName, customerEmail, cpfCnpj);

        // Update barbershop with asaas_customer_id
        await serviceClient
          .from("barbershops")
          .update({ asaas_customer_id: customer.id })
          .eq("owner_user_id", user.id);

        // Create subscription
        const subscription = await createSubscription(customer.id, body.plan_index, user.id);
        result = subscription;
        break;
      }

      case "get_checkout_url": {
        // Get or create payment link for a specific plan
        const planIndex = body.plan_index ?? 0;
        const plan = PLANS[planIndex];
        if (!plan) throw new Error("Invalid plan");

        // Try to find existing link
        const existing = await listPaymentLinks();
        const found = existing.find((l: any) => l.name === plan.name);
        if (found) {
          result = { url: found.url, id: found.id };
        } else {
          const link = await createPaymentLink(planIndex);
          result = { url: link.url, id: link.id };
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log
    const { environment } = getAsaasConfig();
    await serviceClient.from("integration_logs").insert({
      service: "asaas",
      environment,
      event_type: "API_CALL",
      status: "success",
      request_data: { action },
      response_data: result as any,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SUBSCRIPTIONS] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
