/**
 * Módulo CRM Inteligente — Tipos + Service
 * Histórico, ranking, VIP, inativos, frequência, segmentação
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TIPOS ====================

export type ClientTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
export type ClientStatus = 'active' | 'at_risk' | 'inactive' | 'lost' | 'new';

export interface ClientProfile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  tier: ClientTier;
  status: ClientStatus;
  total_visits: number;
  total_spent: number;
  average_ticket: number;
  last_visit?: string;
  first_visit?: string;
  favorite_service?: string;
  favorite_professional?: string;
  days_since_last_visit: number;
  visit_frequency_days: number;
  birthday?: string;
  notes?: string;
}

export interface ClientSegment {
  id: string;
  name: string;
  description: string;
  filter_criteria: SegmentCriteria;
  client_count: number;
}

export interface SegmentCriteria {
  min_visits?: number;
  max_visits?: number;
  min_spent?: number;
  max_spent?: number;
  status?: ClientStatus[];
  tier?: ClientTier[];
  last_visit_days_ago?: { min?: number; max?: number };
  services?: string[];
}

// ==================== CLASSIFICAÇÃO ====================

function calculateTier(totalSpent: number, totalVisits: number): ClientTier {
  if (totalSpent >= 5000 || totalVisits >= 50) return 'vip';
  if (totalSpent >= 2000 || totalVisits >= 30) return 'platinum';
  if (totalSpent >= 1000 || totalVisits >= 15) return 'gold';
  if (totalSpent >= 300 || totalVisits >= 5) return 'silver';
  return 'bronze';
}

function calculateStatus(daysSinceLastVisit: number, avgFrequencyDays: number): ClientStatus {
  if (daysSinceLastVisit <= 7) return 'new'; // ou ativo se já tem histórico
  if (daysSinceLastVisit <= avgFrequencyDays * 1.5) return 'active';
  if (daysSinceLastVisit <= avgFrequencyDays * 3) return 'at_risk';
  if (daysSinceLastVisit <= 90) return 'inactive';
  return 'lost';
}

// ==================== PERFIL DE CLIENTES ====================

export async function getClientProfiles(barbershopId: string): Promise<ClientProfile[]> {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('client_user_id, client_name, client_whatsapp, scheduled_at, status, service_id, professional_id')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false });

  if (!appointments?.length) return [];

  // Buscar pagamentos
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, appointment_id')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'paid');

  const paymentMap = new Map<string, number>();
  (payments || []).forEach(p => {
    paymentMap.set(p.appointment_id, Number(p.amount));
  });

  // Agrupar por cliente
  const clientMap = new Map<string, {
    name: string; phone?: string; visits: { date: string; amount: number; service: string; professional: string }[]
  }>();

  for (const appt of appointments) {
    const clientId = appt.client_user_id || appt.client_whatsapp || 'unknown';
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: appt.client_name || '', phone: appt.client_whatsapp, visits: [] });
    }
    clientMap.get(clientId)!.visits.push({
      date: appt.scheduled_at,
      amount: paymentMap.get(appt.service_id) || 0,
      service: appt.service_id,
      professional: appt.professional_id,
    });
  }

  const profiles: ClientProfile[] = [];
  const now = Date.now();

  for (const [clientId, data] of clientMap) {
    const visits = data.visits;
    const totalSpent = visits.reduce((s, v) => s + v.amount, 0);
    const totalVisits = visits.length;
    const lastVisit = visits[0]?.date;
    const firstVisit = visits[visits.length - 1]?.date;
    const daysSinceLastVisit = lastVisit ? Math.floor((now - new Date(lastVisit).getTime()) / (24 * 60 * 60 * 1000)) : 999;

    // Frequência média (dias entre visitas)
    let avgFrequency = 30;
    if (visits.length >= 2) {
      const firstTime = new Date(firstVisit!).getTime();
      const lastTime = new Date(lastVisit!).getTime();
      avgFrequency = Math.max(1, Math.floor((lastTime - firstTime) / (visits.length - 1) / (24 * 60 * 60 * 1000)));
    }

    // Serviço e profissional favoritos
    const serviceCount: Record<string, number> = {};
    const proCount: Record<string, number> = {};
    visits.forEach(v => {
      serviceCount[v.service] = (serviceCount[v.service] || 0) + 1;
      proCount[v.professional] = (proCount[v.professional] || 0) + 1;
    });

    profiles.push({
      id: clientId,
      user_id: clientId,
      name: data.name,
      phone: data.phone,
      tier: calculateTier(totalSpent, totalVisits),
      status: totalVisits === 1 && daysSinceLastVisit <= 7 ? 'new' : calculateStatus(daysSinceLastVisit, avgFrequency),
      total_visits: totalVisits,
      total_spent: totalSpent,
      average_ticket: totalVisits > 0 ? totalSpent / totalVisits : 0,
      last_visit: lastVisit,
      first_visit: firstVisit,
      favorite_service: Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0],
      favorite_professional: Object.entries(proCount).sort((a, b) => b[1] - a[1])[0]?.[0],
      days_since_last_visit: daysSinceLastVisit,
      visit_frequency_days: avgFrequency,
    });
  }

  return profiles.sort((a, b) => b.total_spent - a.total_spent);
}

// ==================== SEGMENTAÇÃO ====================

export function segmentClients(profiles: ClientProfile[], criteria: SegmentCriteria): ClientProfile[] {
  return profiles.filter(p => {
    if (criteria.min_visits && p.total_visits < criteria.min_visits) return false;
    if (criteria.max_visits && p.total_visits > criteria.max_visits) return false;
    if (criteria.min_spent && p.total_spent < criteria.min_spent) return false;
    if (criteria.max_spent && p.total_spent > criteria.max_spent) return false;
    if (criteria.status?.length && !criteria.status.includes(p.status)) return false;
    if (criteria.tier?.length && !criteria.tier.includes(p.tier)) return false;
    if (criteria.last_visit_days_ago?.min && p.days_since_last_visit < criteria.last_visit_days_ago.min) return false;
    if (criteria.last_visit_days_ago?.max && p.days_since_last_visit > criteria.last_visit_days_ago.max) return false;
    return true;
  });
}

// ==================== RESUMO CRM ====================

export interface CRMSummary {
  total_clients: number;
  by_tier: Record<ClientTier, number>;
  by_status: Record<ClientStatus, number>;
  top_spenders: ClientProfile[];
  at_risk: ClientProfile[];
  birthdays_this_week: ClientProfile[];
}

export async function getCRMSummary(barbershopId: string): Promise<CRMSummary> {
  const profiles = await getClientProfiles(barbershopId);

  const byTier: Record<ClientTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, vip: 0 };
  const byStatus: Record<ClientStatus, number> = { active: 0, at_risk: 0, inactive: 0, lost: 0, new: 0 };

  profiles.forEach(p => {
    byTier[p.tier]++;
    byStatus[p.status]++;
  });

  return {
    total_clients: profiles.length,
    by_tier: byTier,
    by_status: byStatus,
    top_spenders: profiles.slice(0, 10),
    at_risk: profiles.filter(p => p.status === 'at_risk').slice(0, 20),
    birthdays_this_week: [], // Requer campo birthday no perfil
  };
}
