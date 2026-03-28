// Analytics Service — Métricas reais para dashboards
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  revenue: { today: number; week: number; month: number; comparison: number };
  appointments: { today: number; week: number; month: number; completed: number; cancelled: number; noShow: number };
  clients: { total: number; newThisMonth: number; active: number; inactive: number; retention: number };
  occupation: { average: number; peak: number; weak: number };
  financials: { averageTicket: number; totalRevenue: number; totalCost: number; profit: number; margin: number };
}

export interface ClientMetrics {
  totalClients: number; newClients: number; returningClients: number;
  vipClients: number; inactiveClients: number; averageVisits: number; averageSpent: number;
}

export interface RevenueMetrics {
  total: number;
  byPayment: { method: string; amount: number }[];
  byService: { service: string; amount: number }[];
  byProfessional: { professional: string; amount: number }[];
  daily: { date: string; amount: number }[];
  monthly: { month: string; amount: number }[];
}

// Helpers de data
const toISO = (d: Date) => d.toISOString();
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const startOfDay = (d: Date) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };
const endOfDay = (d: Date) => { const c = new Date(d); c.setHours(23, 59, 59, 999); return c; };

const EMPTY_METRICS: DashboardMetrics = {
  revenue: { today: 0, week: 0, month: 0, comparison: 0 },
  appointments: { today: 0, week: 0, month: 0, completed: 0, cancelled: 0, noShow: 0 },
  clients: { total: 0, newThisMonth: 0, active: 0, inactive: 0, retention: 0 },
  occupation: { average: 0, peak: 0, weak: 0 },
  financials: { averageTicket: 0, totalRevenue: 0, totalCost: 0, profit: 0, margin: 0 },
};

export async function getDashboardMetrics(barbershopId: string): Promise<DashboardMetrics> {
  try {
    const now = new Date();
    const todayStart = toISO(startOfDay(now));
    const todayEnd = toISO(endOfDay(now));
    const weekStart = toISO(daysAgo(7));
    const monthStart = toISO(daysAgo(30));
    const lastMonthStart = toISO(daysAgo(60));

    // Buscar agendamentos do mês atual e anterior em paralelo
    const [monthRes, lastMonthRes, clientsRes, paymentsRes] = await Promise.all([
      (supabase as any).from('appointments').select('id, status, total_price, scheduled_at')
        .eq('barbershop_id', barbershopId).gte('scheduled_at', monthStart),
      (supabase as any).from('appointments').select('id, total_price, status')
        .eq('barbershop_id', barbershopId).gte('scheduled_at', lastMonthStart).lt('scheduled_at', monthStart),
      (supabase as any).from('clients').select('id, created_at, last_visit_at')
        .eq('barbershop_id', barbershopId),
      (supabase as any).from('payments').select('amount, status, method')
        .eq('barbershop_id', barbershopId).eq('status', 'paid').gte('created_at', monthStart),
    ]);

    const monthAppts = monthRes.data || [];
    const lastMonthAppts = lastMonthRes.data || [];
    const clients = clientsRes.data || [];

    // Contagens de agendamentos
    const todayAppts = monthAppts.filter((a: any) => a.scheduled_at >= todayStart && a.scheduled_at <= todayEnd);
    const weekAppts = monthAppts.filter((a: any) => a.scheduled_at >= weekStart);
    const completed = monthAppts.filter((a: any) => a.status === 'completed');
    const cancelled = monthAppts.filter((a: any) => a.status === 'cancelled').length;
    const noShow = monthAppts.filter((a: any) => a.status === 'no_show').length;

    // Receita
    const monthRevenue = completed.reduce((s: number, a: any) => s + (a.total_price || 0), 0);
    const todayRevenue = todayAppts.filter((a: any) => a.status === 'completed').reduce((s: number, a: any) => s + (a.total_price || 0), 0);
    const weekRevenue = weekAppts.filter((a: any) => a.status === 'completed').reduce((s: number, a: any) => s + (a.total_price || 0), 0);
    const lastMonthRevenue = lastMonthAppts.filter((a: any) => a.status === 'completed').reduce((s: number, a: any) => s + (a.total_price || 0), 0);
    const comparison = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Clientes
    const monthAgoDate = daysAgo(30);
    const sixtyDaysAgo = daysAgo(60);
    const newThisMonth = clients.filter((c: any) => new Date(c.created_at) > monthAgoDate).length;
    const activeClients = clients.filter((c: any) => c.last_visit_at && new Date(c.last_visit_at) > sixtyDaysAgo).length;
    const inactiveClients = clients.length - activeClients;

    // Retenção: clientes que voltaram no mês atual vs mês anterior
    const lastMonthClientIds = new Set(lastMonthAppts.map((a: any) => a.client_user_id).filter(Boolean));
    const currentClientIds = new Set(monthAppts.map((a: any) => a.client_user_id).filter(Boolean));
    let retained = 0;
    lastMonthClientIds.forEach((id: string) => { if (currentClientIds.has(id)) retained++; });
    const retention = lastMonthClientIds.size > 0 ? Math.round((retained / lastMonthClientIds.size) * 100) : 0;

    // Ocupação (estimativa: 12h de trabalho/dia, 26 dias úteis)
    const totalSlots = 26 * 12;
    const avgOccupancy = totalSlots > 0 ? Math.round((monthAppts.length / totalSlots) * 100) : 0;

    // Horários de pico
    const hourCounts: Record<number, number> = {};
    monthAppts.forEach((a: any) => {
      const h = new Date(a.scheduled_at).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const hours = Object.entries(hourCounts).map(([h, c]) => ({ hour: +h, count: c }));
    hours.sort((a, b) => b.count - a.count);
    const peakHour = hours[0]?.hour ?? 0;
    const weakHour = hours[hours.length - 1]?.hour ?? 0;

    const avgTicket = completed.length > 0 ? monthRevenue / completed.length : 0;

    return {
      revenue: { today: todayRevenue, week: weekRevenue, month: monthRevenue, comparison: Math.round(comparison * 100) / 100 },
      appointments: { today: todayAppts.length, week: weekAppts.length, month: monthAppts.length, completed: completed.length, cancelled, noShow },
      clients: { total: clients.length, newThisMonth, active: activeClients, inactive: inactiveClients, retention },
      occupation: { average: avgOccupancy, peak: peakHour, weak: weakHour },
      financials: { averageTicket: Math.round(avgTicket * 100) / 100, totalRevenue: monthRevenue, totalCost: 0, profit: monthRevenue, margin: monthRevenue > 0 ? 100 : 0 },
    };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return EMPTY_METRICS;
  }
}

export async function getRevenueMetrics(barbershopId: string, days: number = 30): Promise<RevenueMetrics> {
  try {
    const start = toISO(daysAgo(days));
    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('total_price, scheduled_at, status, payment_method, services(name), professionals(name)')
      .eq('barbershop_id', barbershopId).eq('status', 'completed').gte('scheduled_at', start);

    const items = appointments || [];
    const total = items.reduce((s: number, a: any) => s + (a.total_price || 0), 0);

    const byServiceMap: Record<string, number> = {};
    const byProfMap: Record<string, number> = {};
    const byDayMap: Record<string, number> = {};
    const byMonthMap: Record<string, number> = {};
    const byPaymentMap: Record<string, number> = {};

    items.forEach((a: any) => {
      const price = a.total_price || 0;
      const svc = a.services?.name || 'Outro';
      const prof = a.professionals?.name || 'Não definido';
      const day = a.scheduled_at?.split('T')[0] || '';
      const month = day.substring(0, 7);
      const method = a.payment_method || 'não informado';

      byServiceMap[svc] = (byServiceMap[svc] || 0) + price;
      byProfMap[prof] = (byProfMap[prof] || 0) + price;
      if (day) byDayMap[day] = (byDayMap[day] || 0) + price;
      if (month) byMonthMap[month] = (byMonthMap[month] || 0) + price;
      byPaymentMap[method] = (byPaymentMap[method] || 0) + price;
    });

    const toSorted = (map: Record<string, number>, key: string) =>
      Object.entries(map).map(([k, v]) => ({ [key]: k, amount: v })).sort((a, b) => b.amount - a.amount) as any[];

    return {
      total,
      byPayment: toSorted(byPaymentMap, 'method'),
      byService: toSorted(byServiceMap, 'service'),
      byProfessional: toSorted(byProfMap, 'professional'),
      daily: Object.entries(byDayMap).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
      monthly: Object.entries(byMonthMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month)),
    };
  } catch (error) {
    console.error('Erro ao buscar métricas de receita:', error);
    return { total: 0, byPayment: [], byService: [], byProfessional: [], daily: [], monthly: [] };
  }
}

export async function getClientMetrics(barbershopId: string): Promise<ClientMetrics> {
  try {
    const monthAgo = daysAgo(30);
    const sixtyDaysAgo = daysAgo(60);

    const [clientsRes, appointmentsRes, paymentsRes] = await Promise.all([
      (supabase as any).from('clients').select('id, created_at, last_visit_at, total_spent, visit_count').eq('barbershop_id', barbershopId),
      (supabase as any).from('appointments').select('client_user_id').eq('barbershop_id', barbershopId).gte('scheduled_at', toISO(monthAgo)),
      (supabase as any).from('payments').select('client_id, amount').eq('barbershop_id', barbershopId).eq('status', 'paid').gte('created_at', toISO(monthAgo)),
    ]);

    const clients = clientsRes.data || [];
    const appointments = appointmentsRes.data || [];
    const payments = paymentsRes.data || [];

    const visitCounts: Record<string, number> = {};
    appointments.forEach((a: any) => {
      if (a.client_user_id) visitCounts[a.client_user_id] = (visitCounts[a.client_user_id] || 0) + 1;
    });

    const totalClients = clients.length;
    const newClients = clients.filter((c: any) => new Date(c.created_at) > monthAgo).length;
    const activeClients = Object.keys(visitCounts).length;
    const returningClients = Object.values(visitCounts).filter(v => v > 1).length;
    const vipClients = clients.filter((c: any) => (c.visit_count || 0) >= 10 || (c.total_spent || 0) >= 500).length;
    const inactiveClients = clients.filter((c: any) => !c.last_visit_at || new Date(c.last_visit_at) < sixtyDaysAgo).length;

    const totalSpent = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const averageVisits = totalClients > 0 ? Math.round((appointments.length / totalClients) * 10) / 10 : 0;
    const averageSpent = activeClients > 0 ? Math.round((totalSpent / activeClients) * 100) / 100 : 0;

    return { totalClients, newClients, returningClients, vipClients, inactiveClients, averageVisits, averageSpent };
  } catch (error) {
    console.error('Erro ao buscar métricas de clientes:', error);
    return { totalClients: 0, newClients: 0, returningClients: 0, vipClients: 0, inactiveClients: 0, averageVisits: 0, averageSpent: 0 };
  }
}

export async function getRetentionRate(barbershopId: string, days: number = 30): Promise<number> {
  try {
    const currentStart = toISO(daysAgo(days));
    const lastStart = toISO(daysAgo(days * 2));

    const [currentRes, lastRes] = await Promise.all([
      (supabase as any).from('appointments').select('client_user_id').eq('barbershop_id', barbershopId).gte('scheduled_at', currentStart),
      (supabase as any).from('appointments').select('client_user_id').eq('barbershop_id', barbershopId).gte('scheduled_at', lastStart).lt('scheduled_at', currentStart),
    ]);

    const currentClients = new Set((currentRes.data || []).map((a: any) => a.client_user_id).filter(Boolean));
    const lastClients = new Set((lastRes.data || []).map((a: any) => a.client_user_id).filter(Boolean));

    let retained = 0;
    lastClients.forEach((id: string) => { if (currentClients.has(id)) retained++; });
    return lastClients.size > 0 ? Math.round((retained / lastClients.size) * 100) : 0;
  } catch (error) {
    console.error('Erro ao calcular retenção:', error);
    return 0;
  }
}

export async function getCancellationRate(barbershopId: string, days: number = 30): Promise<number> {
  try {
    const { data } = await (supabase as any).from('appointments').select('status')
      .eq('barbershop_id', barbershopId).gte('scheduled_at', toISO(daysAgo(days)));
    const total = data?.length || 0;
    const cancelled = data?.filter((a: any) => a.status === 'cancelled' || a.status === 'no_show').length || 0;
    return total > 0 ? Math.round((cancelled / total) * 100) : 0;
  } catch (error) {
    console.error('Erro ao calcular cancelamento:', error);
    return 0;
  }
}

export async function getProfessionalRanking(barbershopId: string, days: number = 30) {
  try {
    const { data } = await (supabase as any).from('appointments').select('professionals(name), total_price')
      .eq('barbershop_id', barbershopId).eq('status', 'completed').gte('scheduled_at', toISO(daysAgo(days)));
    const map: Record<string, { appointments: number; revenue: number }> = {};
    (data || []).forEach((a: any) => {
      const name = a.professionals?.name || 'Não definido';
      if (!map[name]) map[name] = { appointments: 0, revenue: 0 };
      map[name].appointments++;
      map[name].revenue += a.total_price || 0;
    });
    return Object.entries(map).map(([professional, d]) => ({ professional, ...d })).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Erro ranking profissionais:', error);
    return [];
  }
}

export async function getServiceRanking(barbershopId: string, days: number = 30) {
  try {
    const { data } = await (supabase as any).from('appointments').select('services(name), total_price')
      .eq('barbershop_id', barbershopId).eq('status', 'completed').gte('scheduled_at', toISO(daysAgo(days)));
    const map: Record<string, { count: number; revenue: number }> = {};
    (data || []).forEach((a: any) => {
      const name = a.services?.name || 'Outro';
      if (!map[name]) map[name] = { count: 0, revenue: 0 };
      map[name].count++;
      map[name].revenue += a.total_price || 0;
    });
    return Object.entries(map).map(([service, d]) => ({ service, ...d })).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Erro ranking serviços:', error);
    return [];
  }
}

export async function getHourlyOccupancyAnalytics(barbershopId: string, days: number = 30) {
  try {
    const { data } = await (supabase as any).from('appointments').select('scheduled_at')
      .eq('barbershop_id', barbershopId).gte('scheduled_at', toISO(daysAgo(days)));
    const hourCounts: Record<number, number> = {};
    for (let h = 8; h < 20; h++) hourCounts[h] = 0;
    const uniqueDays = new Set<string>();
    (data || []).forEach((a: any) => {
      const d = new Date(a.scheduled_at);
      const h = d.getHours();
      if (h >= 8 && h < 20) hourCounts[h]++;
      uniqueDays.add(a.scheduled_at.split('T')[0]);
    });
    const totalDays = Math.max(uniqueDays.size, 1);
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: +hour, occupancy: Math.round((count / totalDays) * 100) / 100, dayOfWeek: 0,
    }));
  } catch (error) {
    console.error('Erro occupancy:', error);
    return [];
  }
}
