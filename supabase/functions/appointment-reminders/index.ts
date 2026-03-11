import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Appointment Reminders - Envia lembretes 12h, 5h e 1h antes do agendamento
 * 
 * Deve ser chamado via cron job a cada 15 minutos.
 * Para cada agendamento futuro, verifica se está dentro da janela de lembrete
 * e enfileira jobs na job_queue para envio via WhatsApp/SMS/notificação.
 */

interface Appointment {
  id: string;
  scheduled_at: string;
  client_user_id: string | null;
  client_name: string | null;
  client_whatsapp: string | null;
  barbershop_id: string;
  professional_id: string;
  service_id: string;
  status: string;
}

// Janelas de lembrete em horas (push/app)
const REMINDER_WINDOWS = [
  { hours: 24, label: "24h", key: "reminder_24h" },
  { hours: 12, label: "12h", key: "reminder_12h" },
  { hours: 7, label: "7h", key: "reminder_7h" },
  { hours: 5, label: "5h", key: "reminder_5h" },
  { hours: 2, label: "2h", key: "reminder_2h" },
  { hours: 1, label: "1h", key: "reminder_1h" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const results: Array<{ appointment_id: string; reminder: string; status: string }> = [];

  try {
    // Buscar agendamentos nas próximas 25 horas (cobre janela 24h + margem)
    const maxWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: appointments, error: fetchError } = await supabase
      .from("appointments")
      .select("id, scheduled_at, client_user_id, client_name, client_whatsapp, barbershop_id, professional_id, service_id, status")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", maxWindow)
      .not("client_user_id", "is", null);

    if (fetchError) {
      throw new Error(`Fetch appointments error: ${fetchError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      console.log("[REMINDERS] No upcoming appointments found");
      return new Response(
        JSON.stringify({ processed: 0, message: "No appointments to remind" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[REMINDERS] Found ${appointments.length} upcoming appointments`);

    for (const appt of appointments as Appointment[]) {
      const scheduledTime = new Date(appt.scheduled_at).getTime();
      const diffMs = scheduledTime - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      for (const window of REMINDER_WINDOWS) {
        // Verificar se estamos na janela certa (margem de ±15 minutos)
        const marginHours = 0.25; // 15 min
        if (diffHours <= window.hours + marginHours && diffHours >= window.hours - marginHours) {
          
          // Verificar se já enviamos este lembrete (evitar duplicatas)
          const jobKey = `${appt.id}_${window.key}`;
          const { data: existingJob } = await supabase
            .from("job_queue")
            .select("id")
            .eq("job_type", "process_notification")
            .contains("payload", { reminder_key: jobKey })
            .limit(1);

          if (existingJob && existingJob.length > 0) {
            console.log(`[REMINDERS] Already sent ${window.key} for appointment ${appt.id}`);
            continue;
          }

          // Buscar dados do serviço e profissional para a mensagem
          const [{ data: service }, { data: professional }, { data: barbershop }] = await Promise.all([
            supabase.from("services").select("name").eq("id", appt.service_id).single(),
            supabase.from("professionals").select("name").eq("id", appt.professional_id).single(),
            supabase.from("barbershops").select("name, phone").eq("id", appt.barbershop_id).single(),
          ]);

          const scheduledDate = new Date(appt.scheduled_at);
          const timeStr = scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
          const dateStr = scheduledDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

          const title = `⏰ Lembrete: Agendamento em ${window.label}`;
          const message = `Olá ${appt.client_name || "Cliente"}! Seu agendamento está chegando:\n\n` +
            `📅 ${dateStr} às ${timeStr}\n` +
            `✂️ ${service?.name || "Serviço"}\n` +
            `💈 ${professional?.name || "Profissional"}\n` +
            `🏪 ${barbershop?.name || "Barbearia"}\n\n` +
            `Estamos te esperando! 😊`;

          // Enfileirar notificação in-app
          const jobs: any[] = [{
            job_type: "process_notification",
            payload: {
              user_id: appt.client_user_id,
              title,
              message,
              type: "reminder",
              priority: window.hours <= 1 ? "high" : "normal",
              reminder_key: jobKey,
            },
            status: "pending",
            priority: window.hours <= 1 ? 2 : 1,
          }];

          // Enfileirar WhatsApp se tiver número
          if (appt.client_whatsapp) {
            jobs.push({
              job_type: "send_whatsapp",
              payload: {
                to: appt.client_whatsapp,
                body: message,
                reminder_key: jobKey,
              },
              status: "pending",
              priority: window.hours <= 1 ? 2 : 1,
            });
          }

          const { error: insertError } = await supabase.from("job_queue").insert(jobs);
          
          if (insertError) {
            console.error(`[REMINDERS] Failed to queue reminder for ${appt.id}: ${insertError.message}`);
            results.push({ appointment_id: appt.id, reminder: window.key, status: "error" });
          } else {
            console.log(`[REMINDERS] Queued ${window.key} for appointment ${appt.id} (${jobs.length} jobs)`);
            results.push({ appointment_id: appt.id, reminder: window.key, status: "queued" });
          }
        }
      }
    }

    // Disparar o queue-worker para processar os jobs
    if (results.some(r => r.status === "queued")) {
      await supabase.functions.invoke("queue-worker", { body: { batch_size: 50 } }).catch((err: Error) => {
        console.error("[REMINDERS] Failed to invoke queue-worker:", err.message);
      });
    }

    console.log(`[REMINDERS] Processed: ${results.length} reminders`);

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[REMINDERS] Fatal error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
