// Analytics Service
// Métricas avançadas para dashboard

import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  revenue: {
    today: number;
    week: number;
    month: number;
    comparison: number;
  };
  appointments: {
    today: number;
    week: number;
    month: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  clients: {
    total: number;
    newThisMonth: number;
    active: number;
    inactive: number;
    retention: number;
  };
  occupation: {
    average: number;
    peak: number;
    weak: number;
  };
  financials: {
    averageTicket: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    margin: number;
  };
}

export interface ClientMetrics {
  totalClients: number;
  newClients: number;
  returningClients: number;
  vipClients: number;
  inactiveClients: number;
  averageVisits: number;
  averageSpent: number;
}

export interface RevenueMetrics {
  total: number;
  byPayment: { method: string; amount: number }[];
  byService: { service: string; amount: number }[];
  byProfessional: { professional: string; amount: number }[];
  daily: { date: string; amount: number }[];
  monthly: { month: string; amount: number }[];
}

export async function getDashboardMetrics(barbershopId: string): Promise<DashboardMetrics> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastMonthAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [todayAppointments, weekAppointments, monthAppointments, lastMonthAppointments, clients, allAppointments] = await Promise.all([
      (supabase as any).from('appointments').select('*', { count: 'exact' }).eq('barbershop_id', barbershopId).gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`),
      (supabase as any).from('appointments').select('*', { count: 'exact' }).eq('barbershop_id', barbershopId).gte('scheduled_at', `${weekAgo}T00:00:00`),
      (supabase as any).from('appointments').select('*', { count: 'exact' }).eq('barbershop_id', barbershopId).gte('scheduled_at', `${monthAgo}T00:00:00`),
      (supabase as any).from('appointments').select('*', { count: 'exact' }).eq('barbershop_id', barbershopId).gte('scheduled_at', `${lastMonthAgo}T00:00:00`).lt('scheduled_at', `${monthAgo}T00:00:00`),
      (supabase as any).from('clients').select('*', { count: 'exact' }).eq('barbershop_id', barbershopId),
      (supabase as any).from('appointments').select('*').eq('barbershop_id', barbershopId).gte('scheduled_at', `${monthAgo}T00:00:00`),
    ]);

    const completed = allAppointments.data?.filter((a: any) => a.status === 'completed').length || 0;
    const cancelled = allAppointments.data?.filter((a: any) => a.status === 'cancelled').length || 0;
    const noShow = allAppointments.data?.filter((a: any) => a.status === 'no_show').length || 0;

    const totalRevenue = allAppointments.data
      ?.filter((a: any) => a.status === 'completed')
      ?.reduce((sum: number, a: any) => sum + (a.total_price || 0), 0) || 0;

    const lastMonthRevenue = 0;

    const workingHours = 12;
    const daysInMonth = 30;
    const totalSlots = daysInMonth * workingHours;
    const averageOccupancy = allAppointments.data?.length ? (allAppointments.data.length / totalSlots) * 100 : 0;

    return {
      revenue: {
        today: totalRevenue * (todayAppointments.count || 0) / Math.max(allAppointments.data?.length || 1, 1),
        week: totalRevenue * (weekAppointments.count || 0) / Math.max(allAppointments.data?.length || 1, 1),
        month: totalRevenue,
        comparison: lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
      },
      appointments: {
        today: todayAppointments.count || 0,
        week: weekAppointments.count || 0,
        month: monthAppointments.count || 0,
        completed,
        cancelled,
        noShow,
      },
      clients: {
        total: clients.count || 0,
        newThisMonth: 0,
        active: 0,
        inactive: 0,
        retention: 0,
      },
      occupation: {
        average: Math.round(averageOccupancy * 100) / 100,
        peak: 0,
        weak: 0,
      },
      financials: {
        averageTicket: completed > 0 ? totalRevenue / completed : 0,
        totalRevenue,
        totalCost: 0,
        profit: totalRevenue,
        margin: totalRevenue > 0 ? 0 : 0,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return {
      revenue: { today: 0, week: 0, month: 0, comparison: 0 },
      appointments: { today: 0, week: 0, month: 0, completed: 0, cancelled: 0, noShow: 0 },
      clients: { total: 0, newThisMonth: 0, active: 0, inactive: 0, retention: 0 },
      occupation: { average: 0, peak: 0, weak: 0 },
      financials: { averageTicket: 0, totalRevenue: 0, totalCost: 0, profit: 0, margin: 0 },
    };
  }
}

export async function getRevenueMetrics(barbershopId: string, days: number = 30): Promise<RevenueMetrics> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('*, services(name), professionals(name)')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate.toISOString());

    const total = appointments?.reduce((sum: number, a: any) => sum + (a.total_price || 0), 0) || 0;

    const byService: Record<string, number> = {};
    const byProfessional: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    appointments?.forEach((apt: any) => {
      const serviceName = apt.services?.name || 'Outro';
      const profName = apt.professionals?.name || 'Não definido';
      const day = apt.scheduled_at?.split('T')[0];

      byService[serviceName] = (byService[serviceName] || 0) + (apt.total_price || 0);
      byProfessional[profName] = (byProfessional[profName] || 0) + (apt.total_price || 0);
      if (day) {
        byDay[day] = (byDay[day] || 0) + (apt.total_price || 0);
      }
    });

    return {
      total,
      byPayment: [],
      byService: Object.entries(byService).map(([service, amount]) => ({ service, amount })).sort((a, b) => b.amount - a.amount),
      byProfessional: Object.entries(byProfessional).map(([professional, amount]) => ({ professional, amount })).sort((a, b) => b.amount - a.amount),
      daily: Object.entries(byDay).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
      monthly: [],
    };
  } catch (error) {
    console.error('Erro ao buscar métricas de receita:', error);
    return { total: 0, byPayment: [], byService: [], byProfessional: [], daily: [], monthly: [] };
  }
}

export async function getClientMetrics(barbershopId: string): Promise<ClientMetrics> {
  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: clients } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('barbershop_id', barbershopId);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, scheduled_at')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', monthAgo.toISOString());

    const clientVisits: Record<string, number> = {};
    appointments?.forEach((apt: any) => {
      if (apt.client_user_id) {
        clientVisits[apt.client_user_id] = (clientVisits[apt.client_user_id] || 0) + 1;
      }
    });

    const totalClients = clients?.length || 0;
    const activeClients = Object.keys(clientVisits).length;
    const newClients = clients?.filter((c: any) => new Date(c.created_at) > monthAgo).length || 0;
    const returningClients = Object.values(clientVisits).filter(v => v > 1).length;

    return {
      totalClients,
      newClients,
      returningClients,
      vipClients: 0,
      inactiveClients: totalClients - activeClients,
      averageVisits: totalClients > 0 ? (appointments?.length || 0) / totalClients : 0,
      averageSpent: 0,
    };
  } catch (error) {
    console.error('Erro ao buscar métricas de clientes:', error);
    return {
      totalClients: 0,
      newClients: 0,
      returningClients: 0,
      vipClients: 0,
      inactiveClients: 0,
      averageVisits: 0,
      averageSpent: 0,
    };
  }
}

export async function getRetentionRate(barbershopId: string, days: number = 30): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days * 2);

    const { data: currentPeriod } = await (supabase as any)
      .from('appointments')
      .select('client_user_id')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const { data: lastPeriod } = await (supabase as any)
      .from('appointments')
      .select('client_user_id')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString())
      .lt('scheduled_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const currentClients = new Set(currentPeriod?.map((a: any) => a.client_user_id).filter(Boolean) || []);
    const lastClients = new Set(lastPeriod?.map((a: any) => a.client_user_id).filter(Boolean) || []);

    let retained = 0;
    lastClients.forEach(clientId => {
      if (currentClients.has(clientId)) retained++;
    });

    return lastClients.size > 0 ? Math.round((retained / lastClients.size) * 100) : 0;
  } catch (error) {
    console.error('Erro ao calcular taxa de retenção:', error);
    return 0;
  }
}

export async function getCancellationRate(barbershopId: string, days: number = 30): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('status')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString());

    const total = appointments?.length || 0;
    const cancelled = appointments?.filter((a: any) => a.status === 'cancelled' || a.status === 'no_show').length || 0;

    return total > 0 ? Math.round((cancelled / total) * 100) : 0;
  } catch (error) {
    console.error('Erro ao calcular taxa de cancelamento:', error);
    return 0;
  }
}

export async function getProfessionalRanking(barbershopId: string, days: number = 30): Promise<{ professional: string; appointments: number; revenue: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('professionals(name), total_price, status')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate.toISOString());

    const ranking: Record<string, { appointments: number; revenue: number }> = {};

    appointments?.forEach((apt: any) => {
      const name = apt.professionals?.name || 'Não definido';
      if (!ranking[name]) {
        ranking[name] = { appointments: 0, revenue: 0 };
      }
      ranking[name].appointments++;
      ranking[name].revenue += apt.total_price || 0;
    });

    return Object.entries(ranking)
      .map(([professional, data]) => ({ professional, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return [];
  }
}

export async function getServiceRanking(barbershopId: string, days: number = 30): Promise<{ service: string; count: number; revenue: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('services(name), total_price, status')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate.toISOString());

    const ranking: Record<string, { count: number; revenue: number }> = {};

    appointments?.forEach((apt: any) => {
      const name = apt.services?.name || 'Outro';
      if (!ranking[name]) {
        ranking[name] = { count: 0, revenue: 0 };
      }
      ranking[name].count++;
      ranking[name].revenue += apt.total_price || 0;
    });

    return Object.entries(ranking)
      .map(([service, data]) => ({ service, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Erro ao buscar ranking de serviços:', error);
    return [];
  }
}

export async function getHourlyOccupancyAnalytics(barbershopId: string, days: number = 30): Promise<{ hour: number; occupancy: number; dayOfWeek: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString());

    const hourCounts: Record<number, { total: number; days: Set<string> }> = {};

    for (let h = 8; h < 20; h++) {
      hourCounts[h] = { total: 0, days: new Set() };
    }

    appointments?.forEach((apt: any) => {
      const date = new Date(apt.scheduled_at);
      const hour = date.getHours();
      const dayKey = apt.scheduled_at.split('T')[0];

      if (hour >= 8 && hour < 20) {
        hourCounts[hour].total++;
        hourCounts[hour].days.add(dayKey);
      }
    });

    const totalDays = new Set(appointments?.map((a: any) => a.scheduled_at.split('T')[0])).size || 1;

    return Object.entries(hourCounts).map(([hour, data]) => ({
      hour: parseInt(hour),
      occupancy: Math.round((data.total / (totalDays * 12)) * 100),
      dayOfWeek: 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar occupancy por hora:', error);
    return [];
  }
}
