/**
 * Edge Function: meta-webhook
 * Recebe eventos do Instagram e Facebook via Meta Webhooks API
 * 
 * GET  /meta-webhook → verificação do webhook (Meta exige)
 * POST /meta-webhook → receber eventos de comentários e DMs
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };

async function sendMetaMessage(accessToken: string, recipientId: string, message: string): Promise<boolean> {
  try {
    const res = await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message } }),
    });
    return res.ok;
  } catch { return false; }
}

async function replyToComment(accessToken: string, commentId: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ message }),
    });
    return res.ok;
  } catch { return false; }
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

serve(async (req) => {
  const url = new URL(req.url);
  const VERIFY_TOKEN = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") || "salao_cashback_verify_2026";

  // ── GET: verificação do webhook pela Meta ─────────────────────────────────
  if (req.method === "GET") {
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[META_WEBHOOK] Webhook verified!");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json();

  console.log("[META_WEBHOOK] Event received:", JSON.stringify(body).slice(0, 500));

  // Processa cada entrada do webhook
  for (const entry of body.entry || []) {
    const pageId = entry.id;

    // Busca a conta Meta vinculada a esta página
    const { data: account } = await db
      .from("meta_social_accounts")
      .select("*, barbershop_id, access_token")
      .eq("page_id", pageId)
      .eq("is_active", true)
      .maybeSingle();

    if (!account) continue;

    // Busca automações ativas para esta conta
    const { data: automations } = await db
      .from("meta_comment_automations")
      .select("*")
      .eq("account_id", account.id)
      .eq("is_active", true);

    if (!automations || automations.length === 0) continue;

    // Processa comentários em posts/reels
    for (const change of entry.changes || []) {
      if (change.field !== "feed" && change.field !== "comments") continue;

      const value = change.value;
      if (value.item !== "comment") continue;

      const commentId   = value.comment_id;
      const commentText = value.message || "";
      const commenterId = value.from?.id;
      const commenterName = value.from?.name || "Usuário";
      const postId      = value.post_id;

      for (const automation of automations) {
        // Verifica se deve processar
        const shouldTrigger = automation.trigger_all_comments ||
          matchesKeywords(commentText, automation.trigger_keywords || []);

        if (!shouldTrigger) continue;

        let actionTaken = "ignored";
        let responseText = "";

        // Responde no comentário
        if (automation.reply_comment_enabled && automation.reply_comment_text) {
          let replyText = automation.reply_comment_text;
          if (automation.reply_comment_include_link && automation.reply_comment_link) {
            replyText += `\n${automation.reply_comment_link}`;
          }
          const replied = await replyToComment(account.access_token, commentId, replyText);
          if (replied) { actionTaken = "replied_comment"; responseText = replyText; }
        }

        // Envia DM
        if (automation.send_dm_enabled && automation.dm_text && commenterId) {
          let dmText = automation.dm_text;
          if (automation.dm_include_booking_link) {
            const { data: shop } = await db.from("barbershops").select("slug").eq("id", account.barbershop_id).single();
            if (shop?.slug) {
              dmText += `\n\n📅 Agende aqui: ${Deno.env.get("APP_URL") || "https://seuapp.com"}/agendar/${shop.slug}`;
            }
          }
          const sent = await sendMetaMessage(account.access_token, commenterId, dmText);
          if (sent) { actionTaken = actionTaken === "replied_comment" ? "replied_and_dm" : "sent_dm"; }
        }

        // Log do evento
        await db.from("meta_webhook_events").insert({
          barbershop_id: account.barbershop_id,
          platform: account.platform,
          event_type: "comment",
          post_id: postId,
          comment_id: commentId,
          commenter_id: commenterId,
          commenter_name: commenterName,
          comment_text: commentText,
          automation_id: automation.id,
          action_taken: actionTaken,
          response_text: responseText,
        });

        // Atualiza contadores
        await db.from("meta_comment_automations").update({
          total_triggered: (automation.total_triggered || 0) + 1,
          total_replies_sent: actionTaken.includes("replied") ? (automation.total_replies_sent || 0) + 1 : automation.total_replies_sent,
          total_dms_sent: actionTaken.includes("dm") ? (automation.total_dms_sent || 0) + 1 : automation.total_dms_sent,
        }).eq("id", automation.id);

        break; // Só aplica a primeira automação que bater
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
});
