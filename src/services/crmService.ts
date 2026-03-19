// Serviço de CRM (Customer Relationship Management)
// Integração com IA, automação e agendamentos

import { supabase } from "@/integrations/supabase/client";

export interface ClientProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  last_visit?: string;
  total_visits: number;
  total_spent: number;
  average_ticket: number;
  favorite_service?: string;
  favorite_professional?: string;
  frequency: 'high' | 'medium' | 'low';
  recency: 'recent' | 'active' | 'inactive' | 'dormant';
  score: number;
  tags: string[];
}

export interface CRMAction {
  id: string;
  client_id: string;
  type: 'message' | 'call' | 'email' | 'sms';
  status: 'pending' | 'completed' | 'cancelled';
  scheduled_at?: string;
  completed_at?: string;
  result?: string;
  created_at: string;
}

/**
 * Buscar perfil completo do cliente
 */
export async function getClientProfile(clientId: string): Promise<ClientProfile | null> {
  try {
    // Buscar dados básicos
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('user_id', clientId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Buscar histórico de agendamentos
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at, services(price), professionals(name)')
      .eq('client_user_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
    }

    // Calcular métricas
    const totalVisits = appointments?.length || 0;
    const totalSpent = appointments?.reduce((acc, a: any) => acc + (a.services?.price || 0), 0) || 0;
    const averageTicket = totalVisits > 0 ? totalSpent / totalVisits : 0;

    // Calcular frequência
    let frequency: 'high' | 'medium' | 'low' = 'low';
    if (totalVisits >= 10) frequency = 'high';
    else if (totalVisits >= 5) frequency = 'medium';

    // Calcular recência
    let recency: 'recent' | 'active' | 'inactive' | 'dormant' = 'dormant';
    if (totalVisits > 0 && appointments) {
      const lastVisit = new Date(appointments[0].scheduled_at);
      const daysSinceLastVisit = Math.floor(
        (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastVisit <= 7) recency = 'recent';
      else if (daysSinceLastVisit <= 30) recency = 'active';
      else if (daysSinceLastVisit <= 90) recency = 'inactive';
      else recency = 'dormant';
    }

    // Calcular score (0-100)
    const frequencyScore = frequency === 'high' ? 40 : frequency === 'medium' ? 25 : 10;
    const spendingScore = totalSpent >= 1000 ? 30 : totalSpent >= 500 ? 20 : 10;
    const recencyScore = recency === 'recent' ? 20 : recency === 'active' ? 15 : recency === 'inactive' ? 5 : 0;
    const score = frequencyScore + spendingScore + recencyScore;

    // Buscar tags
    const { data: tags, error: tagsError } = await (supabase as any)
      .from('client_tags')
      .select('tag')
      .eq('client_id', clientId);

    return {
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name || '',
      phone: profile.phone || '',
      whatsapp: profile.whatsapp || '',
      email: profile.email || '',
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      last_visit: appointments?.[0]?.scheduled_at,
      total_visits: totalVisits,
      total_spent,
      average_ticket: averageTicket,
      favorite_service: undefined, // Calcular a partir do histórico
      favorite_professional: undefined, // Calcular a partir do histórico
      frequency,
      recency,
      score,
      tags: tags?.map((t: any) => t.tag) || [],
    };
  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return null;
  }
}

/**
 * Buscar clientes com maior score
 */
export async function getTopClientsByScore(barbershopId: string, limit: number = 10): Promise<ClientProfile[]> {
  try {
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, services(price)')
      .eq('barbershop_id', barbershopId);

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    // Calcular score para cada cliente
    const clientScores: Record<string, { visits: number; spent: number; lastVisit?: string }> = {};
    appointments?.forEach((a: any) => {
      const clientId = a.client_user_id;
      if (clientId) {
        if (!clientScores[clientId]) {
          clientScores[clientId] = { visits: 0, spent: 0, lastVisit: a.scheduled_at };
        }
        clientScores[clientId].visits += 1;
        clientScores[clientId].spent += a.services?.price || 0;
      }
    });

    // Calcular score total para cada cliente
    const scoredClients = Object.entries(clientScores).map(([clientId, data]) => {
      const frequencyScore = data.visits >= 10 ? 40 : data.visits >= 5 ? 25 : 10;
      const spendingScore = data.spent >= 1000 ? 30 : data.spent >= 500 ? 20 : 10;
      const recencyScore = data.lastVisit ? 15 : 0;
      const totalScore = frequencyScore + spendingScore + recencyScore;

      return { clientId, score: totalScore, ...data };
    });

    // Ordenar por score e limitar
    return scoredClients
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(client => ({
        id: client.clientId,
        user_id: client.clientId,
        name: 'Cliente',
        phone: '',
        whatsapp: '',
        email: '',
        created_at: '',
        last_visit: client.lastVisit,
        total_visits: client.visits,
        total_spent: client.spent,
        average_ticket: client.visits > 0 ? client.spent / client.visits : 0,
        frequency: client.visits >= 10 ? 'high' : client.visits >= 5 ? 'medium' : 'low',
        recency: client.lastVisit ? 'active' : 'dormant',
        score: client.score,
        tags: [],
      }));
  } catch (error) {
    console.error('Erro ao buscar top clientes:', error);
    return [];
  }
}

/**
 * Adicionar tag a um cliente
 */
export async function addClientTag(clientId: string, tag: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('client_tags')
      .insert({
        client_id: clientId,
        tag: tag.toLowerCase().trim(),
      });

    if (error) {
      console.error('Erro ao adicionar tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao adicionar tag:', error);
    return false;
  }
}

/**
 * Remover tag de um cliente
 */
export async function removeClientTag(clientId: string, tag: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('client_tags')
      .delete()
      .eq('client_id', clientId)
      .eq('tag', tag.toLowerCase().trim());

    if (error) {
      console.error('Erro ao remover tag:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao remover tag:', error);
    return false;
  }
}

/**
 * Buscar clientes por tag
 */
export async function getClientsByTag(tag: string, limit: number = 50): Promise<ClientProfile[]> {
  try {
    const { data: taggedClients, error: taggedError } = await (supabase as any)
      .from('client_tags')
      .select('client_id')
      .eq('tag', tag.toLowerCase().trim())
      .limit(limit);

    if (taggedError) {
      console.error('Erro ao buscar clientes por tag:', taggedError);
      return [];
    }

    const clientIds = taggedClients?.map((t: any) => t.client_id) || [];
    if (clientIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .in('user_id', clientIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
      return [];
    }

    return profiles?.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      last_visit: undefined,
      total_visits: 0,
      total_spent: 0,
      average_ticket: 0,
      frequency: 'low',
      recency: 'dormant',
      score: 0,
      tags: [],
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar clientes por tag:', error);
    return [];
  }
}

/**
 * Criar ação de CRM
 */
export async function createCRMAction(
  clientId: string,
  type: CRMAction['type'],
  scheduledAt?: Date
): Promise<CRMAction | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('crm_actions')
      .insert({
        client_id: clientId,
        type,
        status: 'pending',
        scheduled_at: scheduledAt?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ação de CRM:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar ação de CRM:', error);
    return null;
  }
}

/**
 * Buscar ações pendentes de CRM
 */
export async function getPendingCRMActions(): Promise<CRMAction[]> {
  try {
    const hoje = new Date();

    const { data, error } = await (supabase as any)
      .from('crm_actions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', hoje.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erro ao buscar ações pendentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar ações pendentes:', error);
    return [];
  }
}

/**
 * Processar ações pendentes de CRM
 */
export async function processPendingCRMActions(): Promise<{ success: boolean; count: number }> {
  try {
    const pendentes = await getPendingCRMActions();
    let count = 0;

    for (const action of pendentes) {
      try {
        // Aqui você implementaria o envio real da mensagem
        // Exemplo: enviar WhatsApp, SMS, Email, etc.

        // Atualizar status para completed
        await (supabase as any)
          .from('crm_actions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', action.id);

        count++;
      } catch (error) {
        console.error('Erro ao processar ação:', error);
      }
    }

    return { success: true, count };
  } catch (error) {
    console.error('Erro ao processar ações pendentes:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Buscar clientes que precisam de reativação
 */
export async function getClientsNeedingReactivation(): Promise<ClientProfile[]> {
  try {
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, client_name, client_whatsapp')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false });

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    // Agrupar por cliente
    const clientes: Record<string, { name: string; whatsapp: string; lastVisit: string }> = {};
    appointments?.forEach(apt => {
      if (apt.client_user_id && !clientes[apt.client_user_id]) {
        clientes[apt.client_user_id] = {
          name: apt.client_name || 'Cliente',
          whatsapp: apt.client_whatsapp || '',
          lastVisit: apt.scheduled_at,
        };
      }
    });

    // Filtrar clientes inativos há mais de 30 dias
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    return Object.entries(clientes)
      .filter(([, data]) => new Date(data.lastVisit) < cutoffDate)
      .map(([clientId, data]) => ({
        id: clientId,
        user_id: clientId,
        name: data.name,
        phone: '',
        whatsapp: data.whatsapp,
        email: '',
        created_at: '',
        last_visit: data.lastVisit,
        total_visits: 1,
        total_spent: 0,
        average_ticket: 0,
        frequency: 'low',
        recency: 'inactive',
        score: 0,
        tags: ['needs-reactivation'],
      }));
  } catch (error) {
    console.error('Erro ao buscar clientes para reativação:', error);
    return [];
  }
}

/**
 * Buscar clientes com alto potencial
 */
export async function getHighPotentialClients(barbershopId: string): Promise<ClientProfile[]> {
  try {
    // Clientes que gastaram mais de R$ 500 e visitaram pelo menos 3 vezes
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, services(price)')
      .eq('barbershop_id', barbershopId);

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    // Calcular gasto e visitas por cliente
    const clientStats: Record<string, { visits: number; spent: number }> = {};
    appointments?.forEach((a: any) => {
      const clientId = a.client_user_id;
      if (clientId) {
        if (!clientStats[clientId]) {
          clientStats[clientId] = { visits: 0, spent: 0 };
        }
        clientStats[clientId].visits += 1;
        clientStats[clientId].spent += a.services?.price || 0;
      }
    });

    // Filtrar clientes com alto potencial
    const highPotential = Object.entries(clientStats)
      .filter(([, stats]) => stats.spent >= 500 && stats.visits >= 3)
      .map(([clientId]) => ({
        id: clientId,
        user_id: clientId,
        name: 'Cliente',
        phone: '',
        whatsapp: '',
        email: '',
        created_at: '',
        last_visit: undefined,
        total_visits: 0,
        total_spent: 0,
        average_ticket: 0,
        frequency: 'medium',
        recency: 'active',
        score: 0,
        tags: ['high-potential'],
      }));

    return highPotential;
  } catch (error) {
    console.error('Erro ao buscar clientes com alto potencial:', error);
    return [];
  }
}

/**
 * Buscar clientes que podem ser convertidos em parceiros
 */
export async function getClientsForPartnerConversion(barbershopId: string): Promise<ClientProfile[]> {
  try {
    // Clientes que indicaram 3 ou mais amigos
    const { data: referrals, error: referralsError } = await (supabase as any)
      .from('referrals')
      .select('client_id, count')
      .eq('barbershop_id', barbershopId)
      .gte('count', 3);

    if (referralsError) {
      console.error('Erro ao buscar indicações:', referralsError);
      return [];
    }

    const clientIds = referrals?.map((r: any) => r.client_id) || [];
    if (clientIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .in('user_id', clientIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError);
      return [];
    }

    return profiles?.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      last_visit: undefined,
      total_visits: 0,
      total_spent: 0,
      average_ticket: 0,
      frequency: 'low',
      recency: 'dormant',
      score: 0,
      tags: ['potential-partner'],
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar clientes para conversão:', error);
    return [];
  }
}

/**
 * Buscar clientes por recência
 */
export async function getClientsByRecency(
  barbershopId: string,
  recency: 'recent' | 'active' | 'inactive' | 'dormant'
): Promise<ClientProfile[]> {
  try {
    const topClients = await getTopClientsByScore(barbershopId, 100);

    return topClients.filter(client => {
      if (recency === 'recent') return client.score >= 75;
      if (recency === 'active') return client.score >= 50 && client.score < 75;
      if (recency === 'inactive') return client.score >= 25 && client.score < 50;
      return client.score < 25;
    });
  } catch (error) {
    console.error('Erro ao buscar clientes por recência:', error);
    return [];
  }
}

/**
 * Buscar clientes por frequência
 */
export async function getClientsByFrequency(
  barbershopId: string,
  frequency: 'high' | 'medium' | 'low'
): Promise<ClientProfile[]> {
  try {
    const topClients = await getTopClientsByScore(barbershopId, 100);

    return topClients.filter(client => client.frequency === frequency);
  } catch (error) {
    console.error('Erro ao buscar clientes por frequência:', error);
    return [];
  }
}

/**
 * Buscar clientes por gasto
 */
export async function getClientsBySpending(
  barbershopId: string,
  minSpent: number,
  maxSpent: number = 10000
): Promise<ClientProfile[]> {
  try {
    const topClients = await getTopClientsByScore(barbershopId, 100);

    return topClients.filter(client => 
      client.total_spent >= minSpent && client.total_spent <= maxSpent
    );
  } catch (error) {
    console.error('Erro ao buscar clientes por gasto:', error);
    return [];
  }
}

/**
 * Buscar clientes por score
 */
export async function getClientsByScore(
  barbershopId: string,
  minScore: number,
  maxScore: number = 100
): Promise<ClientProfile[]> {
  try {
    const topClients = await getTopClientsByScore(barbershopId, 100);

    return topClients.filter(client => 
      client.score >= minScore && client.score <= maxScore
    );
  } catch (error) {
    console.error('Erro ao buscar clientes por score:', error);
    return [];
  }
}