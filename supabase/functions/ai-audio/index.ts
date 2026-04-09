import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const personalityPrompts: Record<string, string> = {
  formal: "Você é um assistente profissional e formal. Use linguagem educada e direta.",
  friendly: "Você é um assistente simpático e amigável. Use emojis moderadamente e seja caloroso.",
  premium: "Você é um concierge premium. Trate o cliente com exclusividade e sofisticação.",
};

async function aiChat(apiKey: string, systemPrompt: string, userContent: string, maxTokens = 500) {
  const resp = await fetch("https://ai.lovable.dev/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!resp.ok) {
    const status = resp.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("CREDITS_EXHAUSTED");
    const err = await resp.text();
    throw new Error(`AI error (${status}): ${err}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "Desculpe, não consegui processar.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, text, personality, barbershop_id, client_phone, messages, barbershop_context } = body;

    // Load AI config
    let aiConfig: any = null;
    if (barbershop_id) {
      const { data } = await supabase.from("ai_config").select("*").eq("barbershop_id", barbershop_id).maybeSingle();
      aiConfig = data;
    }

    const effectivePersonality = personality || aiConfig?.personality || "friendly";
    const baseSystem = personalityPrompts[effectivePersonality] || personalityPrompts.friendly;

    // ── ACTION: chat ──
    if (action === "chat") {
      if (!text && !messages?.length) {
        return new Response(JSON.stringify({ error: "text or messages required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemPrompt = `${baseSystem}
Você é o assistente virtual de um estabelecimento.
${barbershop_context ? `Contexto do negócio: ${JSON.stringify(barbershop_context)}` : ""}
Suas funções: agendar serviços, consultar horários, consultar preços, cadastrar clientes, enviar cobranças e reativar clientes inativos.
Responda sempre em português brasileiro de forma concisa.`;

      const reply = await aiChat(LOVABLE_API_KEY, systemPrompt, text || messages[messages.length - 1].content);

      return new Response(JSON.stringify({ reply, personality: effectivePersonality }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: process-whatsapp (full flow: AI chat + auto-queue reply) ──
    if (action === "process-whatsapp") {
      const messageText = text || "";

      const systemPrompt = `${baseSystem}
Você é o assistente virtual de um estabelecimento via WhatsApp.
Cliente: ${client_phone || "desconhecido"}
Funcionalidades: agendamento, cancelamento, informações, cashback.

Regras:
- Se o cliente quer agendar, pergunte: data, horário e serviço desejado.
- Se o cliente quer cancelar, peça o ID ou data do agendamento.
- Se o cliente pergunta sobre cashback, informe o saldo.
- Seja conciso (máx. 3 frases).`;

      const reply = await aiChat(LOVABLE_API_KEY, systemPrompt, messageText, 300);

      // Queue WhatsApp response
      if (client_phone && barbershop_id) {
        await supabase.from("job_queue").insert({
          job_type: "send_whatsapp",
          payload: { phone: client_phone, message: reply, barbershop_id },
          priority: 8,
          status: "pending",
          scheduled_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({ reply, personality: effectivePersonality }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: get-config ──
    if (action === "get-config") {
      return new Response(JSON.stringify({ config: aiConfig }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = msg === "RATE_LIMIT" ? 429 : msg === "CREDITS_EXHAUSTED" ? 402 : 500;
    console.error("ai-audio error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
