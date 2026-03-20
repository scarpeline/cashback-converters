/**
 * activityTracker.ts
 * Registra atividade do usuário e detecta inatividade para remarketing
 * Usa tabela notifications como log (sem criar tabela nova)
 */
import { supabase } from "@/integrations/supabase/client";

export type InactivityTrigger = "1d" | "3d" | "7d";

/**
 * Registra uma ação do usuário (silencioso, não bloqueia UI)
 */
export async function trackActivity(userId: string, action: string): Promise<void> {
  try {
    await (supabase as any).from("notifications").insert({
      user_id: userId,
      title: "activity",
      message: action,
      type: "info",
      read: true,
    });
  } catch {
    // silencioso
  }
}

/**
 * Retorna quantos dias desde a última atividade do usuário
 */
export async function getDaysSinceLastActivity(userId: string): Promise<number> {
  try {
    const { data } = await (supabase as any)
      .from("notifications")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return 999;
    const diff = Date.now() - new Date(data.created_at).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Retorna o trigger de inatividade (1d, 3d, 7d) ou null se ativo
 */
export async function getInactivityTrigger(userId: string): Promise<InactivityTrigger | null> {
  const days = await getDaysSinceLastActivity(userId);
  if (days >= 7) return "7d";
  if (days >= 3) return "3d";
  if (days >= 1) return "1d";
  return null;
}
