import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // 1. Expire entries notified more than 20 min ago without confirmation
    const { data: timedOut } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("status", "notified")
      .lt("notified_at", twentyMinutesAgo);

    if (timedOut && timedOut.length > 0) {
      const ids = timedOut.map((w: any) => w.id);
      await supabase.from("waiting_list")
        .update({ status: "expired", expired_at: new Date().toISOString() })
        .in("id", ids);
      console.log(`Expired ${ids.length} waitlist entries`);
    }

    // 2. Find entries still waiting, ordered by priority + creation
    const { data: waiting } = await supabase
      .from("waiting_list")
      .select("*, clients(name, whatsapp)")
      .eq("status", "waiting")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(20);

    if (!waiting || waiting.length === 0) {
      return new Response(JSON.stringify({ message: "No waiting entries", expired: timedOut?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check for available slots and notify first in queue
    const notified: string[] = [];

    for (const entry of waiting) {
      // Check if the preferred time slot now has a cancellation
      const dateStr = entry.preferred_date;
      const timeStart = entry.preferred_time_start || "00:00";

      // Build datetime for the preferred slot
      const slotStart = new Date(`${dateStr}T${timeStart}:00`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour window

      // Count active appointments in that slot for the same professional
      const query = supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", entry.barbershop_id)
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_at", slotStart.toISOString())
        .lt("scheduled_at", slotEnd.toISOString());

      if (entry.professional_id) {
        query.eq("professional_id", entry.professional_id);
      }

      const { count } = await query;

      // If there's room (simplified: < 1 appointment means slot is free)
      if ((count || 0) < 1) {
        // Mark as notified
        await supabase.from("waiting_list")
          .update({ status: "notified", notified_at: new Date().toISOString() })
          .eq("id", entry.id);

        // Get client phone
        const clientPhone = entry.clients?.whatsapp;
        const clientName = entry.clients?.name || "Cliente";

        if (clientPhone) {
          await supabase.from("job_queue").insert({
            job_type: "send_whatsapp",
            payload: {
              phone: clientPhone,
              message: `Olá ${clientName}! 🎉 Um horário ficou disponível para você no dia ${dateStr} às ${timeStart}! Responda SIM em até 20 minutos para confirmar. Caso contrário, passaremos para o próximo da fila.`,
              barbershop_id: entry.barbershop_id,
            },
            priority: 10,
            status: "pending",
            scheduled_at: new Date().toISOString(),
          });
        }

        notified.push(entry.id);
      }
    }

    return new Response(
      JSON.stringify({ expired: timedOut?.length || 0, notified: notified.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("waitlist-notify error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
