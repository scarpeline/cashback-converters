/**
 * Edge Function: citycommerce-integration
 * Integração com CityCommerce (marketplace local)
 * 
 * Endpoints:
 *   POST   /citycommerce-integration/deliveries          → criar pedido de entrega/agendamento
 *   GET    /citycommerce-integration/deliveries/:id      → consultar status
 *   POST   /citycommerce-integration/deliveries/estimate → estimar preço/tempo
 *   POST   /citycommerce-integration/deliveries/:id/cancel → cancelar
 * 
 * Autenticação: Bearer Token (CITYCOMMERCE_API_KEY) + HMAC-SHA256 (SHARED_SECRET)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-signature, x-timestamp",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function hmacSHA256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Auth middleware ───────────────────────────────────────────────────────────
async function authenticate(req: Request, body: string): Promise<boolean> {
  const API_KEY      = Deno.env.get("CITYCOMMERCE_API_KEY") || "";
  const SHARED_SECRET = Deno.env.get("CITYCOMMERCE_SHARED_SECRET") || "";

  // 1. Verifica Bearer Token
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ") || auth.slice(7) !== API_KEY) return false;

  // 2. Verifica assinatura HMAC (opcional mas recomendado)
  const signature = req.headers.get("x-signature");
  const timestamp  = req.headers.get("x-timestamp");
  if (signature && timestamp && SHARED_SECRET) {
    const expected = await hmacSHA256(SHARED_SECRET, `${timestamp}.${body}`);
    if (signature !== expected) return false;
  }

  return true;
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url  = new URL(req.url);
  const path = url.pathname.replace("/citycommerce-integration", "");
  const body = req.method !== "GET" ? await req.text() : "";

  // Auth
  if (!(await authenticate(req, body))) {
    return json({ error: "Unauthorized", code: "INVALID_CREDENTIALS" }, 401);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const payload = body ? JSON.parse(body) : {};

  // ── POST /deliveries ─────────────────────────────────────────────────────
  if (req.method === "POST" && path === "/deliveries") {
    const {
      external_id,        // ID do pedido no CityCommerce
      barbershop_slug,    // slug do estabelecimento
      service_id,         // ID do serviço
      professional_id,    // ID do profissional (opcional)
      scheduled_at,       // ISO datetime
      client_name,
      client_phone,
      client_email,
      notes,
      source = "citycommerce",
    } = payload;

    if (!external_id || !barbershop_slug || !service_id || !scheduled_at || !client_name || !client_phone) {
      return json({ error: "Missing required fields", required: ["external_id","barbershop_slug","service_id","scheduled_at","client_name","client_phone"] }, 422);
    }

    // Busca barbershop
    const { data: shop } = await db.from("barbershops").select("id, name").eq("slug", barbershop_slug).maybeSingle();
    if (!shop) return json({ error: "Barbershop not found", slug: barbershop_slug }, 404);

    // Verifica conflito de horário
    const { data: conflict } = await db.from("appointments")
      .select("id")
      .eq("professional_id", professional_id || "")
      .eq("scheduled_at", scheduled_at)
      .neq("status", "cancelled")
      .maybeSingle();

    if (conflict) return json({ error: "Time slot already booked", code: "SLOT_UNAVAILABLE" }, 409);

    // Cria agendamento
    const { data: apt, error } = await db.from("appointments").insert({
      barbershop_id: shop.id,
      service_id,
      professional_id: professional_id || null,
      scheduled_at,
      client_name,
      client_whatsapp: client_phone.replace(/\D/g, ""),
      status: "scheduled",
      source,
      source_metadata: { external_id, client_email, notes, source_app: "citycommerce" },
    }).select("id, status, scheduled_at").single();

    if (error) return json({ error: error.message }, 500);

    return json({
      id: apt.id,
      external_id,
      status: "scheduled",
      scheduled_at: apt.scheduled_at,
      barbershop: shop.name,
      booking_url: `${Deno.env.get("APP_URL") || "https://seuapp.com"}/agendar/${barbershop_slug}`,
      created_at: new Date().toISOString(),
    }, 201);
  }

  // ── GET /deliveries/:id ──────────────────────────────────────────────────
  const matchGet = path.match(/^\/deliveries\/([^/]+)$/);
  if (req.method === "GET" && matchGet) {
    const id = matchGet[1];
    const { data: apt } = await db.from("appointments")
      .select("id, status, scheduled_at, client_name, source_metadata, services(name, price), professionals(name)")
      .eq("id", id)
      .maybeSingle();

    if (!apt) return json({ error: "Appointment not found" }, 404);

    return json({
      id: apt.id,
      external_id: (apt.source_metadata as any)?.external_id || null,
      status: apt.status,
      scheduled_at: apt.scheduled_at,
      client_name: apt.client_name,
      service: (apt.services as any)?.name,
      price: (apt.services as any)?.price,
      professional: (apt.professionals as any)?.name,
    });
  }

  // ── POST /deliveries/estimate ────────────────────────────────────────────
  if (req.method === "POST" && path === "/deliveries/estimate") {
    const { barbershop_slug, service_id, preferred_date } = payload;

    const { data: service } = await db.from("services").select("name, price, duration_minutes").eq("id", service_id).maybeSingle();
    if (!service) return json({ error: "Service not found" }, 404);

    // Conta slots disponíveis no dia
    const date = preferred_date || new Date().toISOString().split("T")[0];
    const { data: booked } = await db.from("appointments")
      .select("scheduled_at")
      .gte("scheduled_at", `${date}T00:00:00`)
      .lte("scheduled_at", `${date}T23:59:59`)
      .neq("status", "cancelled");

    const totalSlots = 20; // 8h-18h, 30min cada
    const available = totalSlots - (booked?.length || 0);

    return json({
      service: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes || 30,
      available_slots_today: available,
      next_available: available > 0 ? `${date}T09:00:00` : null,
      currency: "BRL",
    });
  }

  // ── POST /deliveries/:id/cancel ──────────────────────────────────────────
  const matchCancel = path.match(/^\/deliveries\/([^/]+)\/cancel$/);
  if (req.method === "POST" && matchCancel) {
    const id = matchCancel[1];
    const { reason } = payload;

    const { data: apt } = await db.from("appointments").select("id, status").eq("id", id).maybeSingle();
    if (!apt) return json({ error: "Appointment not found" }, 404);
    if (apt.status === "cancelled") return json({ error: "Already cancelled" }, 409);

    await db.from("appointments").update({
      status: "cancelled",
      source_metadata: { cancellation_reason: reason, cancelled_by: "citycommerce", cancelled_at: new Date().toISOString() },
    }).eq("id", id);

    return json({ id, status: "cancelled", cancelled_at: new Date().toISOString() });
  }

  return json({ error: "Not found", path }, 404);
});
