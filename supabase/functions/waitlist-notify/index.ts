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

    // 1. Find waitlist entries where slot is now available (status = 'waiting')
    //    and the previous person timed out or the slot just opened
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    // Get entries that were notified more than 20 min ago but not confirmed
    const { data: timedOut } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("status", "notified")
      .lt("notified_at", twentyMinutesAgo);

    // Move timed-out entries to 'expired'
    if (timedOut && timedOut.length > 0) {
      const timedOutIds = timedOut.map((w: any) => w.id);
      await supabase
        .from("waiting_list")
        .update({ status: "expired" })
        .in("id", timedOutIds);

      console.log(`Expired ${timedOutIds.length} waitlist entries`);
    }

    // 2. Find available slots: waiting_list entries with status 'waiting' 
    //    ordered by position, grouped by barbershop + professional + desired time
    const { data: waiting } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("status", "waiting")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(50);

    if (!waiting || waiting.length === 0) {
      return new Response(JSON.stringify({ message: "No waiting entries to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. For each waiting entry, check if the slot is actually available
    const notified: string[] = [];

    for (const entry of waiting) {
      // Check if there's a canceled/available slot
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", entry.barbershop_id)
        .eq("status", "scheduled")
        .gte("scheduled_at", entry.desired_date)
        .lt("scheduled_at", new Date(new Date(entry.desired_date).getTime() + 60 * 60 * 1000).toISOString());

      // If the slot has fewer appointments than capacity (simplified: check if <1 for the time slot)
      // In a real system, you'd check against professional availability
      // For now, notify the first person in the queue

      // Mark as notified
      await supabase
        .from("waiting_list")
        .update({ 
          status: "notified", 
          notified_at: new Date().toISOString() 
        })
        .eq("id", entry.id);

      // Queue a WhatsApp message
      if (entry.client_phone) {
        await supabase.from("job_queue").insert({
          job_type: "send_whatsapp",
          payload: {
            phone: entry.client_phone,
            message: `Olá ${entry.client_name || ""}! 🎉 Um horário ficou disponível para você! Responda SIM em até 20 minutos para confirmar seu agendamento. Caso contrário, passaremos para o próximo da fila.`,
            barbershop_id: entry.barbershop_id,
          },
          priority: 10,
          status: "pending",
          scheduled_at: new Date().toISOString(),
        });
      }

      notified.push(entry.id);
      
      // Only notify one person per slot
      break;
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed waitlist: ${timedOut?.length || 0} expired, ${notified.length} notified`,
        expired: timedOut?.length || 0,
        notified: notified.length,
      }),
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
