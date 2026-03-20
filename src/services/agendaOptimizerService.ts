// Agenda Optimizer Service
// Análise inteligente da agenda com IA para detectar padrões e otimizar occupancy

import { supabase } from '@/integrations/supabase/client';

export interface TimeSlot {
  date: string;
  time: string;
  dayOfWeek: number;
  isAvailable: boolean;
  isBooked: boolean;
  serviceId?: string;
  serviceName?: string;
  professionalId?: string;
  professionalName?: string;
}

export interface DayAnalysis {
  date: string;
  dayOfWeek: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  occupancyRate: number;
  totalRevenue: number;
  predictedCancelations: number;
}

export interface WeakHour {
  dayOfWeek: number;
  hour: number;
  averageOccupancy: number;
  suggestedDiscount: number;
  suggestedPromotion: string;
}

export interface CancellationPrediction {
  appointmentId: string;
  clientId: string;
  clientName: string;
  scheduledDate: string;
  cancellationProbability: number;
  reasons: string[];
}

export interface OptimizationSuggestion {
  type: 'promotion' | 'discount' | 'reallocation' | 'retention';
  title: string;
  description: string;
  targetAudience: string;
  potentialImpact: string;
  confidence: number;
}

export interface AgendaMetrics {
  averageOccupancy: number;
  peakHours: { hour: number; occupancy: number }[];
  weakHours: WeakHour[];
  averageTicket: number;
  cancellationRate: number;
  noShowRate: number;
  retentionRate: number;
  predictedLoss: number;
}

export async function analyzeDay(barbershopId: string, date: string): Promise<DayAnalysis> {
  try {
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(price), professionals(name)')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd);

    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    const totalSlots = 24;
    const bookedSlots = appointments?.length || 0;
    const availableSlots = totalSlots - bookedSlots;
    const occupancyRate = (bookedSlots / totalSlots) * 100;

    const totalRevenue = appointments?.reduce((sum: number, apt: any) => {
      return sum + (apt.services?.price || 0);
    }, 0) || 0;

    const predictedCancelations = Math.round(bookedSlots * 0.1);

    return {
      date,
      dayOfWeek: dayNames[dayOfWeek],
      totalSlots,
      bookedSlots,
      availableSlots,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalRevenue,
      predictedCancelations,
    };
  } catch (error) {
    console.error('Erro ao analisar dia:', error);
    return {
      date,
      dayOfWeek: '',
      totalSlots: 0,
      bookedSlots: 0,
      availableSlots: 0,
      occupancyRate: 0,
      totalRevenue: 0,
      predictedCancelations: 0,
    };
  }
}

export async function analyzeWeek(barbershopId: string, startDate: string): Promise<DayAnalysis[]> {
  const analyses: DayAnalysis[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const analysis = await analyzeDay(barbershopId, dateStr);
    analyses.push(analysis);
  }

  return analyses;
}

export async function getHourlyOccupancy(barbershopId: string, days: number = 30): Promise<{ hour: number; occupancy: number; dayOfWeek: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString())
      .in('status', ['scheduled', 'confirmed', 'completed']);

    const hourCounts: Record<string, number> = {};
    const hourTotals: Record<string, number> = {};

    for (let d = 0; d < days; d++) {
      for (let h = 8; h < 20; h++) {
        const key = `${d}-${h}`;
        hourCounts[key] = 0;
        hourTotals[key] = hourTotals[key] || 0;
      }
    }

    appointments?.forEach((apt: any) => {
      const date = new Date(apt.scheduled_at);
      const dayIndex = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const hour = date.getHours();
      const key = `${dayIndex}-${hour}`;
      hourCounts[key] = (hourCounts[key] || 0) + 1;
    });

    const result: { hour: number; occupancy: number; dayOfWeek: number }[] = [];

    for (let h = 8; h < 20; h++) {
      let totalOccupancy = 0;
      let totalDays = 0;

      for (let d = 0; d < days; d++) {
        const key = `${d}-${h}`;
        if (hourCounts[key] !== undefined) {
          totalOccupancy += hourCounts[key] || 0;
          totalDays++;
        }
      }

      const avgOccupancy = totalDays > 0 ? (totalOccupancy / totalDays / days) * 100 : 0;

      result.push({
        hour,
        occupancy: Math.round(avgOccupancy * 100) / 100,
        dayOfWeek: 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Erro ao calcular occupancy por hora:', error);
    return [];
  }
}

export async function detectWeakHours(barbershopId: string, days: number = 30): Promise<WeakHour[]> {
  try {
    const hourlyData = await getHourlyOccupancy(barbershopId, days);

    const weakHours = hourlyData
      .filter(h => h.occupancy < 30)
      .map(h => {
        let suggestedDiscount = 0;
        let suggestedPromotion = '';

        if (h.occupancy < 10) {
          suggestedDiscount = 30;
          suggestedPromotion = 'Desconto especial para horários de baixa demanda';
        } else if (h.occupancy < 20) {
          suggestedDiscount = 20;
          suggestedPromotion = 'Promoção de última hora';
        } else {
          suggestedDiscount = 15;
          suggestedPromotion = 'Clientes frequentes ganham desconto';
        }

        return {
          dayOfWeek: h.dayOfWeek,
          hour: h.hour,
          averageOccupancy: h.occupancy,
          suggestedDiscount,
          suggestedPromotion,
        };
      });

    return weakHours;
  } catch (error) {
    console.error('Erro ao detectar horários fracos:', error);
    return [];
  }
}

export async function predictCancellation(barbershopId: string): Promise<CancellationPrediction[]> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, clients:client_user_id(name, email)')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', `${tomorrowStr}T00:00:00`)
      .lte('scheduled_at', `${tomorrowStr}T23:59:59`);

    const predictions: CancellationPrediction[] = [];

    const { data: history } = await supabase
      .from('appointments')
      .select('client_user_id, status')
      .eq('barbershop_id', barbershopId)
      .in('status', ['completed', 'cancelled', 'no_show']);

    const clientHistory: Record<string, { total: number; cancelled: number }> = {};

    history?.forEach((apt: any) => {
      if (!apt.client_user_id) return;
      if (!clientHistory[apt.client_user_id]) {
        clientHistory[apt.client_user_id] = { total: 0, cancelled: 0 };
      }
      clientHistory[apt.client_user_id].total++;
      if (apt.status === 'cancelled' || apt.status === 'no_show') {
        clientHistory[apt.client_user_id].cancelled++;
      }
    });

    appointments?.forEach((apt: any) => {
      const clientId = apt.client_user_id;
      if (!clientId) return;

      const history = clientHistory[clientId] || { total: 0, cancelled: 0 };
      const cancellationRate = history.total > 0 ? history.cancelled / history.total : 0.1;

      if (cancellationRate > 0.15) {
        const reasons: string[] = [];
        if (cancellationRate > 0.3) reasons.push('Histórico de cancelamentos');
        if (history.total < 3) reasons.push('Cliente novo com poucas visitas');
        if (apt.scheduled_at) {
          const hour = new Date(apt.scheduled_at).getHours();
          if (hour < 9 || hour > 17) reasons.push('Horário pouco convencional');
        }

        predictions.push({
          appointmentId: apt.id,
          clientId,
          clientName: apt.client_name || 'Cliente',
          scheduledDate: apt.scheduled_at,
          cancellationProbability: Math.round(cancellationRate * 100),
          reasons,
        });
      }
    });

    return predictions.sort((a, b) => b.cancellationProbability - a.cancellationProbability);
  } catch (error) {
    console.error('Erro ao prever cancelamentos:', error);
    return [];
  }
}

export async function getAgendaMetrics(barbershopId: string, days: number = 30): Promise<AgendaMetrics> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, services(price)')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString());

    const total = appointments?.length || 0;
    const completed = appointments?.filter((a: any) => a.status === 'completed').length || 0;
    const cancelled = appointments?.filter((a: any) => a.status === 'cancelled').length || 0;
    const noShow = appointments?.filter((a: any) => a.status === 'no_show').length || 0;

    const totalRevenue = appointments
      ?.filter((a: any) => a.status === 'completed')
      ?.reduce((sum: number, a: any) => sum + (a.services?.price || 0), 0) || 0;

    const hourlyOccupancy = await getHourlyOccupancy(barbershopId, days);
    const peakHours = hourlyOccupancy
      .filter(h => h.occupancy > 60)
      .map(h => ({ hour: h.hour, occupancy: h.occupancy }));

    const weakHoursData = await detectWeakHours(barbershopId, days);

    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
    const retentionRate = total > 0 ? (completed / total) * 100 : 0;

    const workingHours = 12;
    const totalSlots = days * workingHours;
    const averageOccupancy = total > 0 ? (total / totalSlots) * 100 : 0;

    const predictedLoss = cancelled * (totalRevenue / (completed || 1));

    return {
      averageOccupancy: Math.round(averageOccupancy * 100) / 100,
      peakHours,
      weakHours: weakHoursData,
      averageTicket: completed > 0 ? totalRevenue / completed : 0,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      retentionRate: Math.round(retentionRate * 100) / 100,
      predictedLoss: Math.round(predictedLoss * 100) / 100,
    };
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    return {
      averageOccupancy: 0,
      peakHours: [],
      weakHours: [],
      averageTicket: 0,
      cancellationRate: 0,
      noShowRate: 0,
      retentionRate: 0,
      predictedLoss: 0,
    };
  }
}

export async function generateOptimizationSuggestions(barbershopId: string): Promise<OptimizationSuggestion[]> {
  try {
    const suggestions: OptimizationSuggestion[] = [];

    const metrics = await getAgendaMetrics(barbershopId, 30);
    const predictions = await predictCancellation(barbershopId);
    const weakHours = await detectWeakHours(barbershopId, 30);

    if (metrics.averageOccupancy < 50) {
      suggestions.push({
        type: 'promotion',
        title: 'Aumentar Occupancy em Horários de Baixa',
        description: `Occupancy médio está em ${metrics.averageOccupancy}%. Sugira promoções para horários com baixa demanda.`,
        targetAudience: 'Clientes frequentes em horários de baixa ocupação',
        potentialImpact: `Pode aumentar occupancy em ${100 - metrics.averageOccupancy}% nos horários fracos`,
        confidence: 85,
      });
    }

    if (metrics.cancellationRate > 10) {
      suggestions.push({
        type: 'retention',
        title: 'Reduzir Taxa de Cancelamento',
        description: `Taxa de cancelamento está em ${metrics.cancellationRate}%. Considere lembretes automáticos e política de cancelamento.`,
        targetAudience: `${predictions.length} clientes com alta probabilidade de cancelamento`,
        potentialImpact: `Pode reduzir cancelamentos em até ${Math.round(metrics.cancellationRate * 0.5)}%`,
        confidence: 78,
      });
    }

    if (weakHours.length > 0) {
      const avgWeakOccupancy = weakHours.reduce((sum, h) => sum + h.averageOccupancy, 0) / weakHours.length;
      suggestions.push({
        type: 'discount',
        title: 'Descontos para Horários de Baixa Demanda',
        description: `${weakHours.length} horários com occupancy abaixo de 30%. Sugestão de desconto de ${weakHours[0]?.suggestedDiscount || 20}%.`,
        targetAudience: 'Novos clientes e clientes frequentes',
        potentialImpact: `Pode aumentar occupancy em ${weakHours.length} horários em até ${100 - avgWeakOccupancy}%`,
        confidence: 82,
      });
    }

    if (predictions.length > 0) {
      suggestions.push({
        type: 'retention',
        title: 'Ação Proativa de Retenção',
        description: `${predictions.length} agendamentos com alta probabilidade de cancelamento amanhã. Considere entrar em contato.`,
        targetAudience: predictions.slice(0, 5).map(p => p.clientName).join(', '),
        potentialImpact: `Pode reter até ${Math.round(predictions.length * 0.7)} clientes`,
        confidence: 75,
      });
    }

    if (metrics.noShowRate > 5) {
      suggestions.push({
        type: 'promotion',
        title: 'Reduzir No-Shows',
        description: `Taxa de no-show está em ${metrics.noShowRate}%. Considere confirmação via WhatsApp automática.`,
        targetAudience: 'Todos os clientes',
        potentialImpact: `Pode reduzir no-shows em ${Math.round(metrics.noShowRate * 0.6)}%`,
        confidence: 80,
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    return [];
  }
}

export async function getAvailableSlotsForPromotion(
  barbershopId: string,
  daysAhead: number = 7,
  maxOccupancy: number = 50
): Promise<{ date: string; time: string; serviceName?: string; suggestedDiscount: number }[]> {
  try {
    const slots: { date: string; time: string; serviceName?: string; suggestedDiscount: number }[] = [];

    for (let d = 1; d <= daysAhead; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];

      const analysis = await analyzeDay(barbershopId, dateStr);

      if (analysis.occupancyRate < maxOccupancy) {
        for (let h = 9; h < 18; h++) {
          const time = `${String(h).padStart(2, '0')}:00`;
          const occupancyAtHour = analysis.occupancyRate * (1 - (h - 9) / 9);

          if (occupancyAtHour < maxOccupancy) {
            slots.push({
              date: dateStr,
              time,
              suggestedDiscount: h < 12 ? 15 : 25,
            });
          }
        }
      }
    }

    return slots.slice(0, 20);
  } catch (error) {
    console.error('Erro ao buscar slots para promoção:', error);
    return [];
  }
}
