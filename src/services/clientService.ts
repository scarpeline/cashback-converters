// Serviço de Gestão de Clientes
// Integração com IA e automação

import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  barbershop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  whatsapp: string;
  email: string;
  last_visit?: string;
  total_visits: number;
  total_spent: number;
  favorite_service?: string;
  favorite_professional?: string;
  created_at: string;
}

export interface ClientScore {
  frequency: 'high' | 'medium' | 'low';
  spending: 'high' | 'medium' | 'low';
  recency: 'recent' | 'active' | 'inactive' | 'dormant';
  total_score: number;
}

/**
 * Buscar clientes
 */
export async function getClients(barbershopId: string, limit: number = 50): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    // Adaptar campos se necessário (ex: last_visit_at para last_visit)
    return (data || []).map(client => ({
      ...client,
      last_visit: client.last_visit_at
    })) as any;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

/**
 * Buscar cliente por ID
 */
export async function getClientById(clientId: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }

    return {
      ...data,
      last_visit: data.last_visit_at
    } as any;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

/**
 * Buscar cliente por WhatsApp
 */
export async function getClientByWhatsApp(whatsapp: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('whatsapp', whatsapp)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar cliente por WHATSAPP:', error);
      return null;
    }

    return data ? {
      ...data,
      last_visit: data.last_visit_at
    } as any : null;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

/**
 * Criar novo cliente
 */
export async function createClient(clientData: {
  user_id?: string;
  name: string;
  phone?: string;
  whatsapp: string;
  email?: string;
  barbershop_id: string;
}): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: clientData.user_id,
        name: clientData.name,
        phone: clientData.phone,
        whatsapp: clientData.whatsapp,
        email: clientData.email,
        barbershop_id: clientData.barbershop_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      return null;
    }

    return {
      ...data,
      last_visit: data.last_visit_at
    } as any;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return null;
  }
}

/**
 * Atualizar cliente
 */
export async function updateClient(
  clientId: string,
  updates: Partial<Client>
): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates as any)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return null;
    }

    return {
      ...data,
      last_visit: data.last_visit_at
    } as any;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return null;
  }
}

/**
 * Buscar clientes por nome
 */
export async function searchClientsByName(
  barbershopId: string,
  name: string,
  limit: number = 20
): Promise<Client[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .ilike('name', `%${name}%`)
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

/**
 * Buscar clientes por WhatsApp
 */
export async function searchClientsByWhatsApp(
  barbershopId: string,
  whatsapp: string,
  limit: number = 20
): Promise<Client[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .ilike('whatsapp', `%${whatsapp}%`)
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

/**
 * Buscar clientes ativos (últimos dias)
 */
export async function getActiveClients(barbershopId: string, days: number = 60): Promise<Client[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('last_visit_at', cutoffDate.toISOString())
      .order('last_visit_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes ativos:', error);
      return [];
    }

    return (data || []).map(client => ({
      ...client,
      last_visit: client.last_visit_at
    })) as any;
  } catch (error) {
    console.error('Erro ao buscar clientes ativos:', error);
    return [];
  }
}

/**
 * Buscar clientes inativos (mais de X dias)
 */
export async function getInactiveClients(barbershopId: string, days: number = 60): Promise<Client[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .or(`last_visit_at.lt.${cutoffDate.toISOString()},last_visit_at.is.null`)
      .order('last_visit_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes inativos:', error);
      return [];
    }

    return (data || []).map(client => ({
      ...client,
      last_visit: client.last_visit_at
    })) as any;
  } catch (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    return [];
  }
}

/**
 * Calcular score do cliente
 */
export async function calculateClientScore(clientId: string): Promise<ClientScore> {
  try {
    // Buscar histórico de agendamentos
    const { data: appointments, error } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at, services(price)')
      .eq('client_user_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Erro ao calcular score:', error);
      return {
        frequency: 'low',
        spending: 'low',
        recency: 'dormant',
        total_score: 0,
      };
    }

    const totalVisits = appointments?.length || 0;
    const totalSpent = appointments?.reduce((acc, a: any) => acc + (a.services?.price || 0), 0) || 0;
    
    // Calcular frequência
    let frequency: 'high' | 'medium' | 'low' = 'low';
    if (totalVisits >= 10) frequency = 'high';
    else if (totalVisits >= 5) frequency = 'medium';

    // Calcular gasto
    let spending: 'high' | 'medium' | 'low' = 'low';
    if (totalSpent >= 1000) spending = 'high';
    else if (totalSpent >= 500) spending = 'medium';

    // Calcular recência
    let recency: 'recent' | 'active' | 'inactive' | 'dormant' = 'dormant';
    if (totalVisits > 0) {
      const lastVisit = new Date(appointments[0].scheduled_at);
      const daysSinceLastVisit = Math.floor(
        (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastVisit <= 7) recency = 'recent';
      else if (daysSinceLastVisit <= 30) recency = 'active';
      else if (daysSinceLastVisit <= 90) recency = 'inactive';
      else recency = 'dormant';
    }

    // Calcular score total (0-100)
    const totalScore = (frequency === 'high' ? 40 : frequency === 'medium' ? 25 : 10) +
                       (spending === 'high' ? 30 : spending === 'medium' ? 20 : 10) +
                       (recency === 'recent' ? 20 : recency === 'active' ? 15 : recency === 'inactive' ? 5 : 0);

    return {
      frequency,
      spending,
      recency,
      total_score: totalScore,
    };
  } catch (error) {
    console.error('Erro ao calcular score:', error);
    return {
      frequency: 'low',
      spending: 'low',
      recency: 'dormant',
      total_score: 0,
    };
  }
}

/**
 * Buscar clientes com maior score
 */
export async function getTopClients(barbershopId: string, limit: number = 10): Promise<Array<Client & { score: number }>> {
  try {
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, services(price)')
      .eq('barbershop_id', barbershopId);

    if (appointmentsError) {
      console.error('Erro ao buscar clientes:', appointmentsError);
      return [];
    }

    // Calcular score para cada cliente
    const clientScores: Record<string, number> = {};
    const clientVisits: Record<string, number> = {};
    const clientSpent: Record<string, number> = {};

    appointments?.forEach((a: any) => {
      const clientId = a.client_user_id;
      if (clientId) {
        clientVisits[clientId] = (clientVisits[clientId] || 0) + 1;
        clientSpent[clientId] = (clientSpent[clientId] || 0) + (a.services?.price || 0);
      }
    });

    // Calcular score total para cada cliente
    for (const clientId of Object.keys(clientVisits)) {
      const visits = clientVisits[clientId];
      const spent = clientSpent[clientId];

      const frequencyScore = visits >= 10 ? 40 : visits >= 5 ? 25 : 10;
      const spendingScore = spent >= 1000 ? 30 : spent >= 500 ? 20 : 10;
      const recencyScore = 15; // Assume active

      clientScores[clientId] = frequencyScore + spendingScore + recencyScore;
    }

    // Ordenar por score e limitar
    const topClients = Object.entries(clientScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([clientId, score]) => ({ user_id: clientId, score }));

    // Buscar detalhes dos clientes
    const clientIds = topClients.map(c => c.user_id);
    const { data: clients, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .in('user_id', clientIds);

    if (error) {
      console.error('Erro ao buscar detalhes dos clientes:', error);
      return [];
    }

    return clients?.map((c: any) => ({
      ...c,
      score: topClients.find(t => t.user_id === c.user_id)?.score || 0,
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar top clientes:', error);
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
): Promise<Client[]> {
  try {
    const topClients = await getTopClients(barbershopId, 100);
    
    return topClients.filter(c => c.score >= minScore && c.score <= maxScore);
  } catch (error) {
    console.error('Erro ao buscar clientes por score:', error);
    return [];
  }
}

/**
 * Buscar clientes por recência
 */
export async function getClientsByRecency(
  barbershopId: string,
  recency: 'recent' | 'active' | 'inactive' | 'dormant'
): Promise<Client[]> {
  try {
    const topClients = await getTopClients(barbershopId, 100);
    
    return topClients.filter(c => {
      if (recency === 'recent') return c.score >= 75;
      if (recency === 'active') return c.score >= 50 && c.score < 75;
      if (recency === 'inactive') return c.score >= 25 && c.score < 50;
      return c.score < 25;
    });
  } catch (error) {
    console.error('Erro ao buscar clientes por recência:', error);
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
): Promise<Client[]> {
  try {
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, services(price)')
      .eq('barbershop_id', barbershopId);

    if (appointmentsError) {
      console.error('Erro ao buscar clientes:', appointmentsError);
      return [];
    }

    // Calcular total gasto por cliente
    const clientSpent: Record<string, number> = {};
    appointments?.forEach((a: any) => {
      const clientId = a.client_user_id;
      if (clientId) {
        clientSpent[clientId] = (clientSpent[clientId] || 0) + (a.services?.price || 0);
      }
    });

    // Filtrar por faixa de gasto
    const filteredClientIds = Object.entries(clientSpent)
      .filter(([, spent]) => spent >= minSpent && spent <= maxSpent)
      .map(([clientId]) => clientId);

    if (filteredClientIds.length === 0) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .in('user_id', filteredClientIds);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

/**
 * Buscar clientes por frequência
 */
export async function getClientsByFrequency(
  barbershopId: string,
  minVisits: number,
  maxVisits: number = 100
): Promise<Client[]> {
  try {
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('client_user_id')
      .eq('barbershop_id', barbershopId);

    if (appointmentsError) {
      console.error('Erro ao buscar clientes:', appointmentsError);
      return [];
    }

    // Contar visitas por cliente
    const clientVisits: Record<string, number> = {};
    appointments?.forEach((a: any) => {
      const clientId = a.client_user_id;
      if (clientId) {
        clientVisits[clientId] = (clientVisits[clientId] || 0) + 1;
      }
    });

    // Filtrar por faixa de visitas
    const filteredClientIds = Object.entries(clientVisits)
      .filter(([, visits]) => visits >= minVisits && visits <= maxVisits)
      .map(([clientId]) => clientId);

    if (filteredClientIds.length === 0) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .in('user_id', filteredClientIds);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}