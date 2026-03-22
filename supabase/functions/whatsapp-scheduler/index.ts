import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Configuração do Twilio (variáveis de ambiente)
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

// Inicializa o cliente Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

async function handleIncomingWhatsappMessage(
  barbershopId: string,
  clientWhatsapp: string,
  messageBody: string
): Promise<string> {
  // Buscar serviços disponíveis
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration, price")
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true);

  // Buscar profissionais disponíveis
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name")
    .eq("barbershop_id", barbershopId)
    .eq("is_active", true);

  const lowerMsg = messageBody.toLowerCase().trim();

  if (lowerMsg === "agendar" || lowerMsg === "1") {
    const serviceList = services?.map((s: any, i: number) => `${i + 1}. ${s.name} - R$${s.price}`).join("\n") || "Nenhum serviço disponível";
    return `📋 *Serviços disponíveis:*\n\n${serviceList}\n\nResponda com o número do serviço desejado.`;
  }

  if (lowerMsg === "horarios" || lowerMsg === "2") {
    return "📅 Para ver horários disponíveis, primeiro escolha um serviço respondendo 'agendar'.";
  }

  if (lowerMsg === "cancelar" || lowerMsg === "3") {
    return "❌ Para cancelar um agendamento, entre em contato diretamente com o estabelecimento.";
  }

  return `👋 Olá! Bem-vindo ao nosso sistema de agendamento!\n\nEscolha uma opção:\n1️⃣ Agendar\n2️⃣ Ver horários\n3️⃣ Cancelar agendamento\n\nOu digite sua mensagem para falar com a gente.`;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const barbershopId = formData.get("barbershopId") as string;

    if (!from || !body || !barbershopId) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const clientWhatsapp = from.replace("whatsapp:", "");

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
    return new Response(`Internal Server Error: ${(error as Error).message}`, { status: 500 });
  }
});
