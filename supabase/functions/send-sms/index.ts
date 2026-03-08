import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("[SEND_SMS] Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, to, body, code, template, expiration_minutes, channel } = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // RATE LIMITING
    // ============================================
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const actionType = action === "whatsapp" ? "send_whatsapp" : "send_sms";
    // Max 5 SMS/WhatsApp per number per minute
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _identifier: to,
      _action_type: actionType,
      _max_requests: 5,
      _window_seconds: 60,
    });

    if (allowed === false) {
      console.warn(`[SEND_SMS] Rate limit exceeded for ${to}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number to E.164
    let phone = to.replace(/\D/g, "");
    if (!phone.startsWith("55")) phone = "55" + phone;
    phone = "+" + phone;

    let messageBody = "";

    if (action === "otp") {
      const otpCode = code || Math.floor(100000 + Math.random() * 900000).toString();
      const expMin = expiration_minutes || 5;
      const tmpl = template || "default";
      
      if (tmpl === "default") {
        messageBody = `SalãoCashBack: Seu código de verificação é ${otpCode}. Válido por ${expMin} minutos. Não compartilhe este código.`;
      } else {
        messageBody = `SalãoCashBack: ${otpCode} - Código de verificação (${expMin}min)`;
      }
    } else if (action === "whatsapp") {
      messageBody = body || "Mensagem do SalãoCashBack";
      
      const whatsappFrom = `whatsapp:${TWILIO_PHONE_NUMBER}`;
      const whatsappTo = `whatsapp:${phone}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const formData = new URLSearchParams();
      formData.append("To", whatsappTo);
      formData.append("From", whatsappFrom);
      formData.append("Body", messageBody);

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("[SEND_SMS] Twilio WhatsApp error:", result);
        return new Response(
          JSON.stringify({ error: "WhatsApp send failed", details: result }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[SEND_SMS] WhatsApp sent:", result.sid);
      return new Response(
        JSON.stringify({ success: true, sid: result.sid, channel: "whatsapp" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      messageBody = body || "Mensagem do SalãoCashBack";
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const formData = new URLSearchParams();
    formData.append("To", phone);
    formData.append("From", TWILIO_PHONE_NUMBER);
    formData.append("Body", messageBody);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[SEND_SMS] Twilio error:", result);
      return new Response(
        JSON.stringify({ error: "SMS send failed", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[SEND_SMS] SMS sent:", result.sid);
    return new Response(
      JSON.stringify({ success: true, sid: result.sid, channel: action || "sms" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SEND_SMS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
