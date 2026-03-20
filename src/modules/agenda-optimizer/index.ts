/**
 * Módulo Otimização de Agenda com IA
 * Detectar horários vazios, sugerir promoções, prever cancelamentos
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TIPOS ====================

export interface OccupancyGap {
  professional_id: string;
  professional_name: string;
  date: string;
  start_time: string;
  end_time: string;
  gap_minutes: number;
  suggestion: GapSuggestion;
}

export type GapSuggestion =
  | 'offer_discount'
  | 'send_promo_to_inactive'
  | 'extend_break'
  | 'no_action';

export interface CancellationPrediction {
  appointment_id: string;
  client_name: string;
  scheduled_at: string;
  risk_score: number; // 0–100
  risk_factors: string[];
  recommendation: string;
}

export interface AgendaOptimizationReport {
  barbershop_id: string;
  date: string;
  occupancy_rate: number;
  gaps: OccupancyGap[];
  cancellation_risks: CancellationPrediction[];
  revenue_opportunity: number;
  recommendations: string[];
}

// ==================== DETECÇÃO DE GAPS ====================

export async function detectOccupancyGaps(barbershopId: string, date?: string): Promise<OccupancyGap[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const { data: professionals } = await (supabase as any)
    .from('professionals')
    .select('id, name')
    .eq('barbershop_id', barbershopId)
    .eq('is_active', true);

  if (!professionals?.length) return [];

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('professional_id, scheduled_at, service_id')
    .eq('barbershop_id', barbershopId)
    .gte('scheduled_at', `${targetDate}T08:00:00`)
    .lte('scheduled_at', `${targetDate}T20:00:00`)
    .in('status', ['scheduled', 'confirmed', 'completed'])
    .order('scheduled_at', { ascending: true });

  const gaps: OccupancyGap[] = [];
  const SLOT_DURATION = 30; // minutos

  for (const pro of professionals) {
    const proAppts = (appointments || [])
      .filter(a => a.professional_id === pro.id)
      .map(a => new Date(a.scheduled_at))
      .sort((a, b) => a.getTime() - b.getTime());

    // Encontrar buracos na agenda (gaps > 1 hora)
    const workStart = new Date(`${targetDate}T08:00:00`);
    const workEnd = new Date(`${targetDate}T20:00:00`);

    let prev = workStart;
    for (const apptTime of proAppts) {
      const gapMinutes = (apptTime.getTime() - prev.getTime()) / 60000;
      if (gapMinutes >= 60) {
        gaps.push({
          professional_id: pro.id,
          professional_name: pro.name,
          date: targetDate,
          start_time: prev.toTimeString().slice(0, 5),
          end_time: apptTime.toTimeString().slice(0, 5),
          gap_minutes: gapMinutes,
          suggestion: gapMinutes >= 180 ? 'send_promo_to_inactive'
                    : gapMinutes >= 120 ? 'offer_discount'
                    : 'no_action',
        });
      }
      prev = new Date(apptTime.getTime() + SLOT_DURATION * 60000);
    }

    // Gap final do dia
    const finalGap = (workEnd.getTime() - prev.getTime()) / 60000;
    if (finalGap >= 60) {
      gaps.push({
        professional_id: pro.id,
        professional_name: pro.name,
        date: targetDate,
        start_time: prev.toTimeString().slice(0, 5),
        end_time: '20:00',
        gap_minutes: finalGap,
        suggestion: finalGap >= 180 ? 'send_promo_to_inactive' : 'offer_discount',
      });
    }
  }

  return gaps;
}

// ==================== PREVISÃO DE CANCELAMENTO ====================

export async function predictCancellations(barbershopId: string): Promise<CancellationPrediction[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('id, client_user_id, client_name, scheduled_at, service_id')
    .eq('barbershop_id', barbershopId)
    .gte('scheduled_at', `${tomorrowStr}T00:00:00`)
    .lte('scheduled_at', `${tomorrowStr}T23:59:59`)
    .in('status', ['scheduled']);

  if (!appointments?.length) return [];

  const predictions: CancellationPrediction[] = [];

  for (const appt of appointments) {
    // Buscar histórico de cancelamentos do cliente
    const { data: history } = await (supabase as any)
      .from('appointments')
      .select('status')
      .eq('client_user_id', appt.client_user_id)
      .eq('barbershop_id', barbershopId);

    const total = (history || []).length;
    const cancelled = (history || []).filter(h => h.status === 'cancelled').length;
    const noShow = (history || []).filter(h => h.status === 'no_show').length;

    const cancelRate = total > 0 ? ((cancelled + noShow) / total) * 100 : 0;

    // Fatores de risco
    const factors: string[] = [];
    if (cancelRate > 30) factors.push(`Taxa de cancelamento alta: ${cancelRate.toFixed(0)}%`);
    if (noShow > 0) factors.push(`${noShow} faltas anteriores`);

    // Horário cedo ou tarde = maior risco
    const hour = new Date(appt.scheduled_at).getHours();
    if (hour <= 8 || hour >= 19) factors.push('Horário extremo (risco maior)');

    // Score
    let score = cancelRate;
    if (hour <= 8 || hour >= 19) score += 10;
    if (noShow > 2) score += 20;
    score = Math.min(100, Math.max(0, score));

    if (score > 20) {
      predictions.push({
        appointment_id: appt.id,
        client_name: appt.client_name || 'Cliente',
        scheduled_at: appt.scheduled_at,
        risk_score: Math.round(score),
        risk_factors: factors,
        recommendation: score > 60
          ? 'Enviar confirmação urgente + oferecer reagendamento'
          : score > 40
            ? 'Enviar lembrete com confirmação'
            : 'Monitorar',
      });
    }
  }

  return predictions.sort((a, b) => b.risk_score - a.risk_score);
}

// ==================== RELATÓRIO DE OTIMIZAÇÃO ====================

export async function generateOptimizationReport(barbershopId: string): Promise<AgendaOptimizationReport> {
  const today = new Date().toISOString().split('T')[0];

  const [gaps, risks] = await Promise.all([
    detectOccupancyGaps(barbershopId, today),
    predictCancellations(barbershopId),
  ]);

  const avgTicket = 50; // valor médio estimado
  const revenueOpportunity = gaps.reduce((sum, g) => sum + Math.floor(g.gap_minutes / 30) * avgTicket, 0);

  const recommendations: string[] = [];

  if (gaps.length > 3) {
    recommendations.push('⚠️ Muitos horários vazios. Considere enviar promoção de última hora.');
  }
  if (risks.filter(r => r.risk_score > 50).length > 0) {
    recommendations.push('🔴 Agendamentos com alta probabilidade de cancelamento detectados.');
  }
  if (revenueOpportunity > 500) {
    recommendations.push(`💰 Oportunidade de faturamento não capturada: R$ ${revenueOpportunity.toFixed(0)}`);
  }
  if (gaps.length === 0 && risks.length === 0) {
    recommendations.push('✅ Agenda otimizada! Sem ações necessárias.');
  }

  // Taxa de ocupação
  const totalSlots = 24 * (await (supabase as any).from('professionals').select('id').eq('barbershop_id', barbershopId).eq('is_active', true)).data?.length || 1;
  const occupiedSlots = totalSlots - gaps.reduce((sum, g) => sum + Math.floor(g.gap_minutes / 30), 0);
  const occupancyRate = Math.max(0, Math.min(100, (occupiedSlots / totalSlots) * 100));

  return {
    barbershop_id: barbershopId,
    date: today,
    occupancy_rate: Math.round(occupancyRate),
    gaps,
    cancellation_risks: risks,
    revenue_opportunity: revenueOpportunity,
    recommendations,
  };
}
