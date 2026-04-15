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

async function callAI(
  providers: string[],
  userMessage: string,
  context: string,
  subscriberKey?: string
): Promise<string | null> {
  const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  for (const provider of providers) {
    try {
      if ((provider === "gemini" || provider === "plataforma_gemini") && GOOGLE_AI_KEY) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${context}\n\nCliente: ${userMessage}` }] }],
              generationConfig: { maxOutputTokens: 300 }
            })
          }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }

      if ((provider === "groq" || provider === "plataforma_groq") && GROQ_API_KEY) {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              { role: "system", content: context },
              { role: "user", content: userMessage }
            ],
            max_tokens: 300
          })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (e) {
      console.error(`Erro no provedor ${provider}:`, e);
      continue;
    }
  }
  return null;
}

async function handleIncomingWhatsappMessage(
  barbershopId: string,
  clientWhatsapp: string,
  messageBody: string
): Promise<string> {
  // 1. Carregar Contexto da Barbearia
  const { data: shop } = await supabase.from("barbershops").select("name, address").eq("id", barbershopId).single();
  const { data: services } = await supabase.from("services").select("name, price").eq("barbershop_id", barbershopId).eq("is_active", true);
  const { data: professionals } = await supabase.from("professionals").select("name").eq("barbershop_id", barbershopId).eq("is_active", true);

  const contextPrompt = `Você é um assistente virtual da ${shop?.name || "nossa barbearia"}.
Localização: ${shop?.address || "Não informada"}.
Serviços: ${services?.map(s => `${s.name} (R$ ${s.price})`).join(", ")}.
Profissionais: ${professionals?.map(p => p.name).join(", ")}.
Data/Hora: ${new Date().toLocaleString("pt-BR")}.

Objetivo: Ajudar o cliente a agendar. Seja cordial, breve e use emojis. Escolha entre serviços disponíveis.
Se o cliente quiser marcar, peça o nome, o serviço e o horário.
Responda sempre em Português do Brasil.`;

  // 2. Bloco de Inteligência Artificial (Mensageria 2.0)
  const { data: aiSettings } = await supabase
    .from("barbershop_ai_settings")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .maybeSingle();

  if (aiSettings?.ai_enabled) {
    const providers = Array.isArray(aiSettings.ai_providers_cascade) 
      ? aiSettings.ai_providers_cascade 
      : ["gemini", "groq"];

    let aiResponse: string | null = null;

    try {
      if (aiSettings.use_platform_ai && aiSettings.ai_credits_balance >= aiSettings.ai_cost_per_message) {
        aiResponse = await callAI(providers, messageBody, contextPrompt);
        
        if (aiResponse) {
          // Desconta da carteira de IA
          await supabase
            .from("barbershop_ai_settings")
            .update({ ai_credits_balance: aiSettings.ai_credits_balance - aiSettings.ai_cost_per_message })
            .eq("barbershop_id", barbershopId);
            
          return aiResponse;
        }
      } else if (aiSettings.ai_subscriber_key) {
        aiResponse = await callAI(["gemini", "openai"], messageBody, contextPrompt, aiSettings.ai_subscriber_key);
        if (aiResponse) return aiResponse;
      }
    } catch (e) {
      console.error("[Fallback Acionado] Erro crítico na IA:", e);
    }
  }

  // ==========================================
  // MODO DE SEGURANÇA SUPREMO (Menu Convencional)
  // ==========================================
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
