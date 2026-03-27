// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export interface ServiceSuggestion {
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  suggestion_reason: string;
  confidence_score: number;
  popularity_score: number;
  revenue_impact: number;
}

export interface ServiceSuggestionSettings {
  id: string;
  barbershop_id: string;
  enable_suggestions: boolean;
  min_services_for_suggestions: number;
  suggestion_probability: number;
  max_suggestions_per_booking: number;
  show_price_comparison: boolean;
  show_popularity_badge: boolean;
}

export interface ServiceSuggestionRule {
  id: string;
  barbershop_id: string;
  trigger_service_id: string;
  suggested_service_id: string;
  rule_type: 'complementary' | 'upsell' | 'popular_pair' | 'seasonal';
  priority: number;
  is_active: boolean;
  conditions: any;
}

export interface ClientServiceHistory {
  id: string;
  client_user_id: string;
  barbershop_id: string;
  service_id: string;
  appointment_id?: string;
  service_date: string;
  service_price: number;
  professional_id?: string;
  rating?: number;
  feedback?: string;
}

export interface ServiceSuggestionLog {
  id: string;
  barbershop_id: string;
  client_user_id: string;
  appointment_id?: string;
  trigger_service_id: string;
  suggested_services: any[];
  client_response?: any;
  response_time?: string;
  created_at: string;
}

/**
 * Serviço para CRM Inteligente com Sugestão de Serviços
 */
export class CRMServiceSuggestionService {
  /**
   * Gerar sugestões de serviços para um cliente
   */
  static async generateSuggestions(
    clientId: string,
    barbershopId: string,
    triggerServiceId: string
  ): Promise<ServiceSuggestion[]> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('generate_service_suggestions', {
          p_client_user_id: clientId,
          p_barbershop_id: barbershopId,
          p_trigger_service_id: triggerServiceId
        });

      if (error) {
        console.error('Erro ao gerar sugestões:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao gerar sugestões:', error);
      return [];
    }
  }

  /**
   * Registrar histórico de serviço
   */
  static async registerServiceHistory(appointmentId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('register_service_history', {
          p_appointment_id: appointmentId
        });

      if (error) {
        console.error('Erro ao registrar histórico:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erro inesperado ao registrar histórico:', error);
      return false;
    }
  }

  /**
   * Buscar configurações de sugestões de uma barbearia
   */
  static async getSuggestionSettings(barbershopId: string): Promise<ServiceSuggestionSettings | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_settings')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .single();

      if (error) {
        console.error('Erro ao buscar configurações:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro inesperado ao buscar configurações:', error);
      return null;
    }
  }

  /**
   * Atualizar configurações de sugestões
   */
  static async updateSuggestionSettings(
    barbershopId: string,
    settings: Partial<ServiceSuggestionSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('service_suggestion_settings')
        .upsert({
          barbershop_id: barbershopId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao atualizar configurações:', error);
      return { success: false, error: 'Erro ao atualizar configurações' };
    }
  }

  /**
   * Buscar regras de sugestão de uma barbearia
   */
  static async getSuggestionRules(barbershopId: string): Promise<ServiceSuggestionRule[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_rules')
        .select(`
          *,
          trigger_service:services(name, price),
          suggested_service:services(name, price)
        `)
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Erro ao buscar regras:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar regras:', error);
      return [];
    }
  }

  /**
   * Criar nova regra de sugestão
   */
  static async createSuggestionRule(
    rule: Omit<ServiceSuggestionRule, 'id'>
  ): Promise<{ success: boolean; error?: string; rule?: ServiceSuggestionRule }> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_rules')
        .insert(rule)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar regra:', error);
        return { success: false, error: error.message };
      }

      return { success: true, rule: data };
    } catch (error) {
      console.error('Erro inesperado ao criar regra:', error);
      return { success: false, error: 'Erro ao criar regra' };
    }
  }

  /**
   * Atualizar regra de sugestão
   */
  static async updateSuggestionRule(
    ruleId: string,
    updates: Partial<ServiceSuggestionRule>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('service_suggestion_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);

      if (error) {
        console.error('Erro ao atualizar regra:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro inesperado ao atualizar regra:', error);
      return { success: false, error: 'Erro ao atualizar regra' };
    }
  }

  /**
   * Buscar histórico de serviços de um cliente
   */
  static async getClientServiceHistory(
    clientId: string,
    barbershopId: string,
    limit: number = 50
  ): Promise<ClientServiceHistory[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('client_service_history')
        .select(`
          *,
          services(name, price, duration_minutes),
          professionals(name),
          appointments(status)
        `)
        .eq('client_user_id', clientId)
        .eq('barbershop_id', barbershopId)
        .order('service_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Registrar log de sugestões apresentadas
   */
  static async logSuggestionPresentation(
    barbershopId: string,
    clientId: string,
    appointmentId: string,
    triggerServiceId: string,
    suggestedServices: ServiceSuggestion[]
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_logs')
        .insert({
          barbershop_id: barbershopId,
          client_user_id: clientId,
          appointment_id: appointmentId,
          trigger_service_id: triggerServiceId,
          suggested_services: suggestedServices
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao registrar log:', error);
        return { success: false, error: error.message };
      }

      return { success: true, logId: data.id };
    } catch (error) {
      console.error('Erro inesperado ao registrar log:', error);
      return { success: false, error: 'Erro ao registrar log' };
    }
  }

  /**
   * Registrar resposta do cliente às sugestões
   */
  static async recordSuggestionResponse(
    logId: string,
    response: {
      action: 'accept' | 'decline' | 'ignore';
      acceptedServices?: string[];
      declinedServices?: string[];
      feedback?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('record_suggestion_response', {
          p_log_id: logId,
          p_response: response
        });

      if (error) {
        console.error('Erro ao registrar resposta:', error);
        return { success: false, error: error.message };
      }

      return { success: data === true };
    } catch (error) {
      console.error('Erro inesperado ao registrar resposta:', error);
      return { success: false, error: 'Erro ao registrar resposta' };
    }
  }

  /**
   * Buscar estatísticas de sugestões
   */
  static async getSuggestionStats(barbershopId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_stats')
        .select(`
          *,
          trigger_service:services(name),
          suggested_service:services(name)
        `)
        .eq('barbershop_id', barbershopId)
        .order('times_accepted', { ascending: false });

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar estatísticas:', error);
      return [];
    }
  }

  /**
   * Buscar logs de sugestões recentes
   */
  static async getSuggestionLogs(
    barbershopId: string,
    limit: number = 100
  ): Promise<ServiceSuggestionLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('service_suggestion_logs')
        .select(`
          *,
          trigger_service:services(name),
          profiles!client_user_id(name)
        `)
        .eq('barbershop_id', barbershopId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar logs:', error);
      return [];
    }
  }

  /**
   * Analisar perfil do cliente para sugestões personalizadas
   */
  static async analyzeClientProfile(
    clientId: string,
    barbershopId: string
  ): Promise<{
    totalVisits: number;
    avgTicket: number;
    lastVisit: string;
    favoriteServices: string[];
    preferredProfessionals: string[];
    spendingPattern: 'low' | 'medium' | 'high';
    visitFrequency: 'rare' | 'occasional' | 'frequent';
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('client_service_history')
        .select(`
          service_price,
          service_date,
          service_id,
          professional_id,
          services(name)
        `)
        .eq('client_user_id', clientId)
        .eq('barbershop_id', barbershopId)
        .order('service_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return {
          totalVisits: 0,
          avgTicket: 0,
          lastVisit: '',
          favoriteServices: [],
          preferredProfessionals: [],
          spendingPattern: 'low',
          visitFrequency: 'rare'
        };
      }

      const totalVisits = data.length;
      const avgTicket = data.reduce((sum, item) => sum + item.service_price, 0) / totalVisits;
      const lastVisit = data[0].service_date;

      // Serviços mais frequentes
      const serviceCounts: { [key: string]: number } = {};
      data.forEach(item => {
        const serviceName = item.services?.name || 'Unknown';
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      });
      const favoriteServices = Object.entries(serviceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      // Profissionais preferidos
      const professionalCounts: { [key: string]: number } = {};
      data.forEach(item => {
        if (item.professional_id) {
          professionalCounts[item.professional_id] = (professionalCounts[item.professional_id] || 0) + 1;
        }
      });
      const preferredProfessionals = Object.entries(professionalCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);

      // Padrão de gastos
      let spendingPattern: 'low' | 'medium' | 'high' = 'low';
      if (avgTicket > 100) spendingPattern = 'high';
      else if (avgTicket > 50) spendingPattern = 'medium';

      // Frequência de visitas
      const daysSinceFirstVisit = Math.floor(
        (new Date().getTime() - new Date(data[data.length - 1].service_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const visitsPerMonth = (totalVisits / daysSinceFirstVisit) * 30;
      
      let visitFrequency: 'rare' | 'occasional' | 'frequent' = 'rare';
      if (visitsPerMonth > 2) visitFrequency = 'frequent';
      else if (visitsPerMonth > 0.5) visitFrequency = 'occasional';

      return {
        totalVisits,
        avgTicket,
        lastVisit,
        favoriteServices,
        preferredProfessionals,
        spendingPattern,
        visitFrequency
      };
    } catch (error) {
      console.error('Erro inesperado ao analisar perfil:', error);
      return {
        totalVisits: 0,
        avgTicket: 0,
        lastVisit: '',
        favoriteServices: [],
        preferredProfessionals: [],
        spendingPattern: 'low',
        visitFrequency: 'rare'
      };
    }
  }
}

// Funções utilitárias
export const SUGGESTION_REASONS = {
  complementary: 'Combina perfeitamente com seu serviço escolhido',
  upsell: 'Upgrade para uma experiência premium',
  popular_pair: 'Muito popular junto com seu serviço',
  seasonal: 'Promoção especial do mês',
  similar: 'Clientes como você também gostam'
} as const;

export function formatSuggestionMessage(
  clientName: string,
  serviceName: string,
  suggestion: ServiceSuggestion
): string {
  const reason = SUGGESTION_REASONS[suggestion.suggestion_reason as keyof typeof SUGGESTION_REASONS] || SUGGESTION_REASONS.similar;
  
  return `${clientName}, que tal aproveitar e fazer ${suggestion.service_name} também? ${reason}`;
}

export function calculateSuggestionPriority(suggestion: ServiceSuggestion): number {
  // Calcular score baseado em múltiplos fatores
  const confidenceWeight = 0.4;
  const popularityWeight = 0.3;
  const revenueWeight = 0.3;

  const confidenceScore = suggestion.confidence_score * 100;
  const popularityScore = Math.min(suggestion.popularity_score, 100);
  const revenueScore = Math.max(0, Math.min(100, suggestion.revenue_impact));

  return (
    confidenceScore * confidenceWeight +
    popularityScore * popularityWeight +
    revenueScore * revenueWeight
  );
}
