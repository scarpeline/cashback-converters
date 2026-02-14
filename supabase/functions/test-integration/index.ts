import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Testa conectividade com um endpoint ou serviço
 */
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

  // Verify super_admin
  const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isAdmin } = await serviceClient.rpc("is_super_admin", { _user_id: claims.claims.sub });
  
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { test_type, config } = body;

    let result: Record<string, unknown> = {};

    switch (test_type) {
      case "ping": {
        // Test URL connectivity
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const start = Date.now();
          const response = await fetch(config.url, {
            method: "HEAD",
            signal: controller.signal,
          });
          const latency = Date.now() - start;
          result = {
            success: true,
            status: response.status,
            latency_ms: latency,
            message: `Endpoint respondeu em ${latency}ms (HTTP ${response.status})`,
          };
        } catch (err) {
          result = {
            success: false,
            message: err instanceof Error ? err.message : "Falha na conexão",
          };
        } finally {
          clearTimeout(timeout);
        }
        break;
      }

      case "asaas_auth": {
        // Test Asaas API key
        const env = config.environment || "sandbox";
        const apiKey = env === "sandbox"
          ? Deno.env.get("ASAAS_API_KEY_SANDBOX")
          : Deno.env.get("ASAAS_API_KEY_PRODUCTION");
        const baseUrl = env === "sandbox"
          ? "https://sandbox.asaas.com/api/v3"
          : "https://api.asaas.com/api/v3";

        if (!apiKey) {
          result = { success: false, message: `API key para ${env} não configurada` };
          break;
        }

        try {
          const response = await fetch(`${baseUrl}/finance/balance`, {
            headers: { "access_token": apiKey },
          });
          const data = await response.json();
          if (response.ok) {
            result = {
              success: true,
              message: `Conectado ao Asaas (${env}). Saldo: R$ ${data.totalBalance || 0}`,
              balance: data.totalBalance,
            };
          } else {
            result = { success: false, message: data.errors?.[0]?.description || "Autenticação falhou" };
          }
        } catch (err) {
          result = { success: false, message: "Falha ao conectar com Asaas" };
        }
        break;
      }

      case "webhook_test": {
        // Send test webhook
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const start = Date.now();
          const response = await fetch(config.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(config.headers || {}),
            },
            body: JSON.stringify({
              event: "test.ping",
              timestamp: new Date().toISOString(),
              data: { message: "Test from Salão Cashback" },
            }),
            signal: controller.signal,
          });
          const latency = Date.now() - start;
          const responseBody = await response.text();
          result = {
            success: response.ok,
            status: response.status,
            latency_ms: latency,
            response_body: responseBody.slice(0, 500),
            message: response.ok
              ? `Webhook entregue em ${latency}ms`
              : `Webhook falhou (HTTP ${response.status})`,
          };
        } catch (err) {
          result = {
            success: false,
            message: err instanceof Error ? err.message : "Timeout ou erro de conexão",
          };
        } finally {
          clearTimeout(timeout);
        }
        break;
      }

      default:
        result = { success: false, message: "Tipo de teste inválido" };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
