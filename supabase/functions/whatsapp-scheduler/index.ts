import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { handleIncomingWhatsappMessage } from "../services/whatsappSchedulingService.ts";

// Configuração do Twilio (variáveis de ambiente)
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER"); // Seu número Twilio para enviar mensagens

// Inicializa o cliente Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const from = formData.get("From") as string; // Número do cliente (ex: whatsapp:+5511999999999)
    const body = formData.get("Body") as string; // Conteúdo da mensagem
    const barbershopId = formData.get("barbershopId") as string; // ID da barbearia (precisa ser enviado pelo Twilio ou inferido)

    if (!from || !body || !barbershopId) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const clientWhatsapp = from.replace("whatsapp:", ""); // Limpar o prefixo "whatsapp:"

    // Processar a mensagem usando o serviço de agendamento
    const responseText = await handleIncomingWhatsappMessage(
      barbershopId,
      clientWhatsapp,
      body
    );

    // Enviar a resposta de volta via Twilio
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
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
      return new Response("Failed to send message via Twilio", { status: 500 });
    }

    return new Response("Message processed", { status: 200 });
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
});
