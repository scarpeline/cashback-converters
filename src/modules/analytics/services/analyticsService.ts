/**
 * Módulo Analytics — Service
 * Cálculo de métricas de faturamento, retenção, ticket médio, ocupação
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AnalyticsDashboardData,
  AnalyticsFilter,
  RevenueMetrics,
  RetentionMetrics,
  AppointmentMetrics,
  OccupancyMetrics,
} from '../types';

// ==================== PERÍODOS ====================

function getDateRange(filter: AnalyticsFilter): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (filter.period) {
    case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case '90d': start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    case '12m': start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    case 'custom':
      return { start: filter.start_date || end, end: filter.end_date || end };
    default: start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start: start.toISOString(), end };
}

// ==================== FATURAMENTO ====================

export async function getRevenueMetrics(filter: AnalyticsFilter): Promise<RevenueMetrics> {
  const { start, end } = getDateRange(filter);

  const { data: payments } = await (supabase as any)
    .from('payments')
    .select('amount, paid_at, appointment_id')
    .eq('barbershop_id', filter.barbershop_id)
    .eq('status', 'paid')
    .gte('paid_at', start)
    .lte('paid_at', end);

  const total = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const count = (payments || []).length;

  return {
    total,
    average_ticket: count > 0 ? total / count : 0,
    growth_percentage: 0, // Calculado comparando com período anterior
    by_service: [],
    by_professional: [],
    by_day: [],
  };
}

// ==================== RETENÇÃO ====================

export async function getRetentionMetrics(filter: AnalyticsFilter): Promise<RetentionMetrics> {
  const { start, end } = getDateRange(filter);

  // Clientes com agendamentos no período
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('client_user_id, status')
    .eq('barbershop_id', filter.barbershop_id)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end);

  const uniqueClients = new Set((appointments || []).map(a => a.client_user_id).filter(Boolean));
  const completedAppts = (appointments || []).filter(a => a.status === 'completed');
  const activeClients = new Set(completedAppts.map(a => a.client_user_id).filter(Boolean));

  // Clientes do período anterior (para churn)
  const prevStart = new Date(new Date(start).getTime() - (new Date(end).getTime() - new Date(start).getTime()));
  const { data: prevAppointments } = await (supabase as any)
    .from('appointments')
    .select('client_user_id')
    .eq('barbershop_id', filter.barbershop_id)
    .gte('scheduled_at', prevStart.toISOString())
    .lt('scheduled_at', start);

  const prevClients = new Set((prevAppointments || []).map(a => a.client_user_id).filter(Boolean));
  const churnedClients = [...prevClients].filter(c => !activeClients.has(c));

  return {
    total_clients: uniqueClients.size,
    active_clients: activeClients.size,
    inactive_clients: uniqueClients.size - activeClients.size,
    churn_rate: prevClients.size > 0 ? (churnedClients.length / prevClients.size) * 100 : 0,
    returning_rate: uniqueClients.size > 0 ? (activeClients.size / uniqueClients.size) * 100 : 0,
    new_clients_month: 0,
    average_visits_per_client: uniqueClients.size > 0 ? (appointments || []).length / uniqueClients.size : 0,
  };
}

// ==================== AGENDAMENTOS ====================

export async function getAppointmentMetrics(filter: AnalyticsFilter): Promise<AppointmentMetrics> {
  const { start, end } = getDateRange(filter);

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('status, scheduled_at')
    .eq('barbershop_id', filter.barbershop_id)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end);

  const total = (appointments || []).length;
  const completed = (appointments || []).filter(a => a.status === 'completed').length;
  const cancelled = (appointments || []).filter(a => a.status === 'cancelled').length;
  const noShow = (appointments || []).filter(a => a.status === 'no_show').length;

  // Horários de pico
  const hourCounts: Record<number, number> = {};
  (appointments || []).forEach(a => {
    const hour = new Date(a.scheduled_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => b.count - a.count);

  const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)));

  return {
    total,
    completed,
    cancelled,
    no_show: noShow,
    cancellation_rate: total > 0 ? (cancelled / total) * 100 : 0,
    average_per_day: total / days,
    peak_hours: peakHours.slice(0, 5),
  };
}

// ==================== OCUPAÇÃO ====================

export async function getOccupancyMetrics(filter: AnalyticsFilter): Promise<OccupancyMetrics> {
  const { start, end } = getDateRange(filter);

  // Profissionais ativos
  const { data: professionals } = await (supabase as any)
    .from('professionals')
    .select('id, name')
    .eq('barbershop_id', filter.barbershop_id)
    .eq('is_active', true);

  const totalPros = (professionals || []).length;
  if (totalPros === 0) {
    return {
      average_occupancy_rate: 0,
      by_professional: [],
      by_day_of_week: [],
      empty_slots_today: 0,
      empty_slots_week: 0,
    };
  }

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('professional_id, scheduled_at')
    .eq('barbershop_id', filter.barbershop_id)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .in('status', ['scheduled', 'confirmed', 'completed']);

  const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)));
  const slotsPerDay = 24; // 8h-20h, slots de 30min
  const totalPossibleSlots = days * totalPros * slotsPerDay;
  const occupiedSlots = (appointments || []).length;

  return {
    average_occupancy_rate: totalPossibleSlots > 0 ? (occupiedSlots / totalPossibleSlots) * 100 : 0,
    by_professional: [],
    by_day_of_week: [],
    empty_slots_today: Math.max(0, slotsPerDay * totalPros - (appointments || []).filter(a => {
      const d = new Date(a.scheduled_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length),
    empty_slots_week: Math.max(0, slotsPerDay * totalPros * 7 - occupiedSlots),
  };
}

// ==================== DASHBOARD COMPLETO ====================

export async function getAnalyticsDashboard(filter: AnalyticsFilter): Promise<AnalyticsDashboardData> {
  const [revenue, retention, appointments, occupancy] = await Promise.all([
    getRevenueMetrics(filter),
    getRetentionMetrics(filter),
    getAppointmentMetrics(filter),
    getOccupancyMetrics(filter),
  ]);

  return { revenue, retention, appointments, occupancy, period: filter.period };
}
