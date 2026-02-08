import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return atob(padded);
}

function getAuthUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization");
  const jwtUserId = getAuthUserIdFromJwt(authHeader);

  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.user_id === "string" ? body.user_id : null;
    const email = typeof body?.email === "string" ? body.email : null;

    if (!userId || !jwtUserId || userId !== jwtUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Super Admin (por lista autorizada)
    if (email) {
      const { data: authorized } = await admin
        .from("authorized_super_admins")
        .select("email")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (authorized?.email) {
        await ensureRole(admin, userId, "super_admin");
        return json({ role_assigned: "super_admin" });
      }
    }

    // 2) Contador
    const { data: accountant } = await admin
      .from("accountants")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (accountant?.id) {
      await ensureRole(admin, userId, "contador");
      return json({ role_assigned: "contador" });
    }

    // 3) Afiliado
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("type")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (affiliate?.type) {
      const role = affiliate.type === "afiliado_saas" ? "afiliado_saas" : "afiliado_barbearia";
      await ensureRole(admin, userId, role);
      return json({ role_assigned: role });
    }

    // 4) Dono (barbearia)
    const { data: barbershop } = await admin
      .from("barbershops")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (barbershop?.id) {
      await ensureRole(admin, userId, "dono");
      return json({ role_assigned: "dono" });
    }

    // 5) Profissional
    const { data: professional } = await admin
      .from("professionals")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (professional?.id) {
      await ensureRole(admin, userId, "profissional");
      return json({ role_assigned: "profissional" });
    }

    return json({ role_assigned: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Failed to bootstrap role", details: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureRole(
  admin: ReturnType<typeof createClient>,
  userId: string,
  role: "cliente" | "dono" | "profissional" | "afiliado_barbearia" | "afiliado_saas" | "contador" | "super_admin",
) {
  const { data: existing } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  await admin.from("user_roles").insert({ user_id: userId, role });
}
