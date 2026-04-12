/**
 * Edge Function: integration-token
 * Gera e valida tokens de integração para apps externos
 * 
 * POST /integration-token
 * Actions: generate | validate | list | revoke
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-integration-token",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json();
    const { action } = body;

    // ── Validate token (public — no auth needed) ──────────────────────────────
    if (action === "validate") {
      const { token } = body;
      if (!token) return json({ error: "Token required" }, 400);

      const { data, error } = await db
        .from("integration_tokens")
        .select("*, barbershops(id, name, slug)")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return json({ error: "Invalid or expired token" }, 401);
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return json({ error: "Token expired" }, 401);
      }

      // Log usage
      await db.from("integration_token_logs").insert({
        token_id: data.id,
        action: "validate",
        metadata: { barbershop_id: data.barbershop_id, service_id: body.service_id },
      });

      return json({
        valid: true,
        barbershop_id: data.barbershop_id,
        barbershop_name: data.barbershops?.name,
        barbershop_slug: data.barbershops?.slug,
        permissions: data.permissions,
      });
    }

    // ── Auth required for all other actions ───────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Get barbershop
    const { data: shop } = await db
      .from("barbershops")
      .select("id, name, slug")
      .eq("owner_user_id", user.id)
      .single();

    if (!shop) return json({ error: "Barbershop not found" }, 404);

    // ── Generate token ────────────────────────────────────────────────────────
    if (action === "generate") {
      const { name, expires_days, permissions } = body;
      const token = generateToken();
      const expiresAt = expires_days
        ? new Date(Date.now() + expires_days * 86400000).toISOString()
        : null;

      const { data, error } = await db.from("integration_tokens").insert({
        barbershop_id: shop.id,
        token,
        name: name || "Token de Integração",
        permissions: permissions || ["booking:create", "booking:read", "services:read"],
        expires_at: expiresAt,
        is_active: true,
        created_by: user.id,
      }).select().single();

      if (error) return json({ error: error.message }, 500);
      return json({ token: data.token, id: data.id, name: data.name, expires_at: data.expires_at });
    }

    // ── List tokens ───────────────────────────────────────────────────────────
    if (action === "list") {
      const { data } = await db
        .from("integration_tokens")
        .select("id, name, token, permissions, expires_at, is_active, created_at")
        .eq("barbershop_id", shop.id)
        .order("created_at", { ascending: false });

      return json({ tokens: data || [] });
    }

    // ── Revoke token ──────────────────────────────────────────────────────────
    if (action === "revoke") {
      const { token_id } = body;
      await db.from("integration_tokens")
        .update({ is_active: false })
        .eq("id", token_id)
        .eq("barbershop_id", shop.id);

      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
