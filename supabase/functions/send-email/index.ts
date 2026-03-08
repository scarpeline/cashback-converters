import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Send Email Edge Function
 * 
 * Modes:
 * - sync: Envia email imediatamente via Resend
 * - queue: Adiciona job na fila para processamento assíncrono
 * 
 * Inclui rate limiting por remetente
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, from, mode } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'subject'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limit: max 20 emails per minute per recipient
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _identifier: Array.isArray(to) ? to[0] : to,
      _action_type: "send_email",
      _max_requests: 20,
      _window_seconds: 60,
    });

    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Queue mode: add to job_queue for async processing
    if (mode === "queue") {
      const { error: insertError } = await supabase.from("job_queue").insert({
        job_type: "send_email",
        payload: { to, subject, html, text, from },
      });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to enqueue email", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, mode: "queued" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sync mode: send immediately
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || "SalãoCashBack <noreply@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[SEND_EMAIL] Resend error:", result);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log to integration_logs
    await supabase.from("integration_logs").insert({
      event_type: "email.sent",
      service: "resend",
      environment: Deno.env.get("APP_ENV") || "sandbox",
      status: "success",
      request_data: { to, subject },
      response_data: result,
    });

    console.log("[SEND_EMAIL] Email sent:", result.id);
    return new Response(
      JSON.stringify({ success: true, id: result.id, mode: "sync" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SEND_EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
