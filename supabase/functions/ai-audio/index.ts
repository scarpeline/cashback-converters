import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI API key configured");
    }

    const contentType = req.headers.get("content-type") || "";

    // === SPEECH-TO-TEXT (audio file in) ===
    if (contentType.includes("multipart/form-data")) {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY required for speech-to-text");

      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      const language = formData.get("language") as string || "pt";

      if (!audioFile) throw new Error("No audio file provided");

      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, "audio.ogg");
      whisperForm.append("model", "whisper-1");
      whisperForm.append("language", language);

      const sttResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: whisperForm,
      });

      if (!sttResponse.ok) {
        const err = await sttResponse.text();
        console.error("Whisper error:", err);
        throw new Error("Speech-to-text failed");
      }

      const { text } = await sttResponse.json();
      return new Response(JSON.stringify({ text, source: "whisper" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === TEXT-TO-SPEECH or AI CHAT ===
    const body = await req.json();
    const { action, text, voice, messages, personality, barbershop_context } = body;

    // --- Text-to-Speech ---
    if (action === "tts") {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY required for text-to-speech");

      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice || "nova",
          response_format: "opus",
        }),
      });

      if (!ttsResponse.ok) {
        const err = await ttsResponse.text();
        console.error("TTS error:", err);
        throw new Error("Text-to-speech failed");
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/opus",
          "Content-Disposition": 'attachment; filename="response.opus"',
        },
      });
    }

    // --- AI Chat (process text with personality) ---
    if (action === "chat") {
      const personalityPrompts: Record<string, string> = {
        formal: "Você é um assistente profissional e formal. Use linguagem educada e direta.",
        friendly: "Você é um assistente simpático e amigável. Use emojis moderadamente e seja caloroso.",
        premium: "Você é um concierge premium. Trate o cliente com exclusividade e sofisticação.",
      };

      const systemPrompt = `${personalityPrompts[personality || "friendly"]}
Você é o assistente virtual de um estabelecimento.
${barbershop_context ? `Contexto do negócio: ${JSON.stringify(barbershop_context)}` : ""}
Suas funções: agendar serviços, consultar horários, consultar preços, cadastrar clientes, enviar cobranças e reativar clientes inativos.
Responda sempre em português brasileiro de forma concisa.`;

      const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
      const apiUrl = OPENAI_API_KEY
        ? "https://api.openai.com/v1/chat/completions"
        : "https://ai.gateway.lovable.dev/v1/chat/completions";

      const chatResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_API_KEY ? "gpt-4o-mini" : "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...(messages || [{ role: "user", content: text }]),
          ],
          max_tokens: 500,
        }),
      });

      if (!chatResponse.ok) {
        const status = chatResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const err = await chatResponse.text();
        console.error("Chat error:", err);
        throw new Error("AI chat failed");
      }

      const chatData = await chatResponse.json();
      const reply = chatData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

      return new Response(JSON.stringify({ reply, model: chatData.model }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("ai-audio error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
