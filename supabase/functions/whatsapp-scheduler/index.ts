import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const barbershopId = formData.get("barbershopId") as string;

    if (!from || !body || !barbershopId) {
      return new Response("Missing required parameters", { status: 400, headers: corsHeaders });
    }

    const clientWhatsapp = from.replace("whatsapp:", "");

    // Simple echo response - full scheduling logic is in the frontend service
    const responseText = `Recebemos sua mensagem: "${body}". Em breve retornaremos.`;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          },
          body: new URLSearchParams({
            To: from,
            From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
            Body: responseText,
          }).toString(),
        }
      );

      if (!twilioResponse.ok) {
        const errorBody = await twilioResponse.text();
        console.error("Erro ao enviar mensagem via Twilio:", errorBody);
        return new Response("Failed to send message via Twilio", { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(`Internal Server Error: ${(error as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
