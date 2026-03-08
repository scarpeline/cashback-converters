import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Queue Worker - Processa jobs pendentes da tabela job_queue
 * 
 * Job types suportados:
 * - send_email: Envia email via Resend
 * - send_sms: Envia SMS via Twilio
 * - send_whatsapp: Envia WhatsApp via Twilio
 * - dispatch_webhook: Dispara webhook para endpoints externos
 * - process_notification: Cria notificação no banco
 */

interface Job {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

// ============================================
// JOB HANDLERS
// ============================================

async function handleSendEmail(payload: Record<string, unknown>): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const { to, subject, html, text, from } = payload as {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  };

  if (!to || !subject) throw new Error("Missing 'to' or 'subject'");

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

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend API error ${response.status}: ${err}`);
  }

  console.log(`[QUEUE_WORKER] Email sent to ${to}`);
}

async function handleSendSms(payload: Record<string, unknown>): Promise<void> {
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const { to, body } = payload as { to: string; body: string };
  if (!to || !body) throw new Error("Missing 'to' or 'body'");

  let phone = to.replace(/\D/g, "");
  if (!phone.startsWith("55")) phone = "55" + phone;
  phone = "+" + phone;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const formData = new URLSearchParams();
  formData.append("To", phone);
  formData.append("From", TWILIO_PHONE_NUMBER);
  formData.append("Body", body);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio SMS error ${response.status}: ${err}`);
  }

  console.log(`[QUEUE_WORKER] SMS sent to ${phone}`);
}

async function handleSendWhatsapp(payload: Record<string, unknown>): Promise<void> {
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const { to, body } = payload as { to: string; body: string };
  if (!to || !body) throw new Error("Missing 'to' or 'body'");

  let phone = to.replace(/\D/g, "");
  if (!phone.startsWith("55")) phone = "55" + phone;
  phone = "+" + phone;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const formData = new URLSearchParams();
  formData.append("To", `whatsapp:${phone}`);
  formData.append("From", `whatsapp:${TWILIO_PHONE_NUMBER}`);
  formData.append("Body", body);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio WhatsApp error ${response.status}: ${err}`);
  }

  console.log(`[QUEUE_WORKER] WhatsApp sent to ${phone}`);
}

async function handleDispatchWebhook(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const { event, data } = payload as { event: string; data: Record<string, unknown> };
  if (!event) throw new Error("Missing 'event'");

  // Fetch active endpoints for this event
  const { data: endpoints, error } = await supabase
    .from("integration_endpoints")
    .select("*")
    .eq("event_name", event)
    .eq("active", true);

  if (error) throw new Error(`Failed to fetch endpoints: ${error.message}`);
  if (!endpoints?.length) {
    console.log(`[QUEUE_WORKER] No endpoints for event: ${event}`);
    return;
  }

  for (const ep of endpoints) {
    const headers = (ep.headers_json || {}) as Record<string, string>;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(ep.endpoint_url, {
        method: ep.method || "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), data }),
        signal: controller.signal,
      });

      const responseBody = await response.text();
      const success = response.status >= 200 && response.status < 300;

      await supabase.from("webhooks_log").insert({
        event,
        target_url: ep.endpoint_url,
        payload_json: { event, data },
        response_code: response.status,
        response_body: responseBody.slice(0, 1000),
        success,
        integration_id: ep.integration_id,
      });
    } catch (err) {
      await supabase.from("webhooks_log").insert({
        event,
        target_url: ep.endpoint_url,
        payload_json: { event, data },
        response_code: 0,
        response_body: err instanceof Error ? err.message : "Unknown error",
        success: false,
        integration_id: ep.integration_id,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function handleProcessNotification(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const { user_id, title, message, type, priority, data } = payload as {
    user_id: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
    data?: Record<string, unknown>;
  };

  if (!user_id || !title || !message) throw new Error("Missing required notification fields");

  const { error } = await supabase.from("notifications").insert({
    user_id,
    title,
    message,
    type: type || "info",
    priority: priority || "normal",
    data: data || null,
  });

  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  console.log(`[QUEUE_WORKER] Notification created for user ${user_id}`);
}

// ============================================
// MAIN HANDLER
// ============================================

const JOB_HANDLERS: Record<string, (payload: Record<string, unknown>, supabase: ReturnType<typeof createClient>) => Promise<void>> = {
  send_email: (p) => handleSendEmail(p),
  send_sms: (p) => handleSendSms(p),
  send_whatsapp: (p) => handleSendWhatsapp(p),
  dispatch_webhook: handleDispatchWebhook,
  process_notification: handleProcessNotification,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Parse optional batch_size from body
  let batchSize = 10;
  try {
    const body = await req.json();
    if (body?.batch_size) batchSize = Math.min(body.batch_size, 50);
  } catch {
    // No body, use defaults
  }

  const processed: Array<{ id: string; job_type: string; status: string }> = [];

  for (let i = 0; i < batchSize; i++) {
    // Atomically claim next job
    const { data: jobs, error: claimError } = await supabase.rpc("claim_next_job");

    if (claimError || !jobs?.length) break;

    const job = jobs[0] as Job;
    console.log(`[QUEUE_WORKER] Processing job ${job.id} (${job.job_type}) attempt ${job.attempts}/${job.max_attempts}`);

    const handler = JOB_HANDLERS[job.job_type];
    if (!handler) {
      await supabase
        .from("job_queue")
        .update({ status: "failed", last_error: `Unknown job type: ${job.job_type}`, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", job.id);
      processed.push({ id: job.id, job_type: job.job_type, status: "failed" });
      continue;
    }

    try {
      await handler(job.payload, supabase);

      await supabase
        .from("job_queue")
        .update({ status: "done", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", job.id);
      processed.push({ id: job.id, job_type: job.job_type, status: "done" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const shouldRetry = job.attempts < job.max_attempts;

      await supabase
        .from("job_queue")
        .update({
          status: shouldRetry ? "retry" : "failed",
          last_error: errorMsg,
          // Exponential backoff: 30s, 60s, 120s
          scheduled_at: shouldRetry
            ? new Date(Date.now() + Math.pow(2, job.attempts) * 30000).toISOString()
            : undefined,
          completed_at: shouldRetry ? undefined : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      processed.push({ id: job.id, job_type: job.job_type, status: shouldRetry ? "retry" : "failed" });
      console.error(`[QUEUE_WORKER] Job ${job.id} failed: ${errorMsg}`);
    }
  }

  console.log(`[QUEUE_WORKER] Processed ${processed.length} jobs`);

  return new Response(
    JSON.stringify({ processed: processed.length, jobs: processed }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
