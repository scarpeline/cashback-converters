import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 5000;

interface DispatchRequest {
  event: string;
  payload: Record<string, unknown>;
}

interface Endpoint {
  id: string;
  integration_id: string;
  event_name: string;
  endpoint_url: string;
  method: string;
  headers_json: Record<string, string> | null;
  retry_enabled: boolean;
  retry_count: number;
  active: boolean;
}

/**
 * Envia POST com timeout de 5s
 */
async function sendWebhook(
  url: string,
  method: string,
  headers: Record<string, string>,
  payload: Record<string, unknown>
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.text();
    return { status: response.status, body: body.slice(0, 1000) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: 0, body: message };
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Parse request
  let body: DispatchRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { event, payload } = body;
  if (!event || !payload) {
    return new Response(JSON.stringify({ error: "Missing event or payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[WEBHOOK_DISPATCHER] Dispatching event: ${event}`);

  // 1. Buscar webhooks ativos do evento
  const { data: endpoints, error: fetchError } = await supabase
    .from("integration_endpoints")
    .select("*")
    .eq("event_name", event)
    .eq("active", true);

  if (fetchError) {
    console.error("[WEBHOOK_DISPATCHER] Failed to fetch endpoints:", fetchError);
    return new Response(JSON.stringify({ error: "Failed to fetch endpoints" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!endpoints || endpoints.length === 0) {
    console.log(`[WEBHOOK_DISPATCHER] No active endpoints for event: ${event}`);
    return new Response(
      JSON.stringify({ dispatched: 0, event }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: Array<{ endpoint_id: string; success: boolean; status: number }> = [];

  // 2. Disparar para cada endpoint
  for (const ep of endpoints as Endpoint[]) {
    const headers = (ep.headers_json || {}) as Record<string, string>;
    const maxAttempts = ep.retry_enabled ? (ep.retry_count || 3) + 1 : 1;
    let lastResult = { status: 0, body: "" };
    let success = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[WEBHOOK_DISPATCHER] Attempt ${attempt}/${maxAttempts} → ${ep.endpoint_url}`);
      
      lastResult = await sendWebhook(ep.endpoint_url, ep.method || "POST", headers, {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      if (lastResult.status >= 200 && lastResult.status < 300) {
        success = true;
        break;
      }

      // Wait before retry (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
      }
    }

    // 6. Salvar no webhooks_log
    await supabase.from("webhooks_log").insert({
      event,
      target_url: ep.endpoint_url,
      payload_json: { event, data: payload },
      response_code: lastResult.status || null,
      response_body: lastResult.body || null,
      success,
      integration_id: ep.integration_id,
    });

    results.push({ endpoint_id: ep.id, success, status: lastResult.status });
  }

  console.log(`[WEBHOOK_DISPATCHER] Done. ${results.filter((r) => r.success).length}/${results.length} succeeded`);

  return new Response(
    JSON.stringify({ dispatched: results.length, event, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
