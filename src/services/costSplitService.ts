// Cost Split Service
// Divisão de custos de mensagens entre Dono e Profissionais

import { supabase } from '@/integrations/supabase/client';

export interface CostSplit {
  id: string;
  barbershop_id: string;
  professional_id: string;
  split_enabled: boolean;
  split_percentage_owner: number;
  split_percentage_professional: number;
  owner_cost_limit?: number;
  professional_cost_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface CostSplitConfig {
  professional_id: string;
  professional_name: string;
  split_enabled: boolean;
  split_percentage_owner: number;
  split_percentage_professional: number;
  owner_cost_limit?: number;
  professional_cost_limit?: number;
  total_cost_share?: number;
  cost_limit_exceeded?: boolean;
}

export interface CostSplitResult {
  ownerShare: number;
  professionalShare: number;
  professionalCostLimitExceeded: boolean;
  ownerCostLimitExceeded: boolean;
}

export async function getCostSplitConfig(
  barbershopId: string,
  professionalId: string
): Promise<CostSplit | null> {
  try {
    const { data, error } = await supabase
      .from('message_cost_splits')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('professional_id', professionalId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setCostSplit(params: {
  barbershop_id: string;
  professional_id: string;
  split_enabled: boolean;
  split_percentage_owner: number;
  split_percentage_professional: number;
  owner_cost_limit?: number;
  professional_cost_limit?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (params.split_percentage_owner + params.split_percentage_professional !== 100) {
      return { success: false, error: 'Percentuais devem somar 100%' };
    }

    const { error } = await supabase
      .from('message_cost_splits')
      .upsert({
        barbershop_id: params.barbershop_id,
        professional_id: params.professional_id,
        split_enabled: params.split_enabled,
        split_percentage_owner: params.split_percentage_owner,
        split_percentage_professional: params.split_percentage_professional,
        owner_cost_limit: params.owner_cost_limit,
        professional_cost_limit: params.professional_cost_limit,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'barbershop_id,professional_id',
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao configurar divisão de custo:', error);
    return { success: false, error: error.message };
  }
}

export async function enableCostSplit(
  barbershopId: string,
  professionalId: string,
  percentageOwner: number = 50
): Promise<boolean> {
  const result = await setCostSplit({
    barbershop_id: barbershopId,
    professional_id: professionalId,
    split_enabled: true,
    split_percentage_owner: percentageOwner,
    split_percentage_professional: 100 - percentageOwner,
  });
  return result.success;
}

export async function disableCostSplit(
  barbershopId: string,
  professionalId: string
): Promise<boolean> {
  const result = await setCostSplit({
    barbershop_id: barbershopId,
    professional_id: professionalId,
    split_enabled: false,
    split_percentage_owner: 100,
    split_percentage_professional: 0,
  });
  return result.success;
}

export async function getAllCostSplits(barbershopId: string): Promise<CostSplitConfig[]> {
  try {
    const { data, error } = await supabase
      .from('message_cost_splits')
      .select(`
        *,
        professional:professionals(id, name)
      `)
      .eq('barbershop_id', barbershopId);

    if (error) throw error;

    return (data || []).map(item => ({
      professional_id: item.professional_id,
      professional_name: item.professional?.name || 'Desconhecido',
      split_enabled: item.split_enabled,
      split_percentage_owner: item.split_percentage_owner,
      split_percentage_professional: item.split_percentage_professional,
      owner_cost_limit: item.owner_cost_limit,
      professional_cost_limit: item.professional_cost_limit,
    }));
  } catch (error) {
    console.error('Erro ao buscar configurações de custo:', error);
    return [];
  }
}

export async function getProfessionalCostShare(
  barbershopId: string,
  professionalId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    let query = supabase
      .from('message_usage')
      .select('professional_cost_share')
      .eq('barbershop_id', barbershopId)
      .eq('professional_id', professionalId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).reduce((sum, item) => sum + (item.professional_cost_share || 0), 0);
  } catch (error) {
    console.error('Erro ao calcular custo do profissional:', error);
    return 0;
  }
}

export async function getOwnerCostShare(
  barbershopId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    let query = supabase
      .from('message_usage')
      .select('owner_cost_share')
      .eq('barbershop_id', barbershopId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).reduce((sum, item) => sum + (item.owner_cost_share || 0), 0);
  } catch (error) {
    console.error('Erro ao calcular custo do dono:', error);
    return 0;
  }
}

export async function calculateCostSplit(params: {
  barbershopId: string;
  professionalId?: string;
  totalCost: number;
}): Promise<CostSplitResult> {
  try {
    if (!params.professionalId) {
      return {
        ownerShare: params.totalCost,
        professionalShare: 0,
        ownerCostLimitExceeded: false,
        professionalCostLimitExceeded: false,
      };
    }

    const config = await getCostSplitConfig(params.barbershopId, params.professionalId);

    if (!config || !config.split_enabled) {
      return {
        ownerShare: params.totalCost,
        professionalShare: 0,
        ownerCostLimitExceeded: false,
        professionalCostLimitExceeded: false,
      };
    }

    const ownerShare = Number((params.totalCost * config.split_percentage_owner / 100).toFixed(6));
    const professionalShare = Number((params.totalCost * config.split_percentage_professional / 100).toFixed(6));

    let ownerCostLimitExceeded = false;
    let professionalCostLimitExceeded = false;

    if (config.owner_cost_limit) {
      const currentOwnerCost = await getOwnerCostShare(params.barbershopId);
      ownerCostLimitExceeded = currentOwnerCost + ownerShare > config.owner_cost_limit;
    }

    if (config.professional_cost_limit) {
      const currentProfessionalCost = await getProfessionalCostShare(
        params.barbershopId,
        params.professionalId
      );
      professionalCostLimitExceeded = currentProfessionalCost + professionalShare > config.professional_cost_limit;
    }

    return {
      ownerShare,
      professionalShare,
      ownerCostLimitExceeded,
      professionalCostLimitExceeded,
    };
  } catch (error) {
    console.error('Erro ao calcular divisão de custo:', error);
    return {
      ownerShare: params.totalCost,
      professionalShare: 0,
      ownerCostLimitExceeded: false,
      professionalCostLimitExceeded: false,
    };
  }
}

export async function resetCostLimits(barbershopId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_cost_splits')
      .update({
        owner_cost_limit: null,
        professional_cost_limit: null,
        updated_at: new Date().toISOString(),
      })
      .eq('barbershop_id', barbershopId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao resetar limites de custo:', error);
    return false;
  }
}

export async function bulkSetCostSplits(params: {
  barbershop_id: string;
  professional_ids: string[];
  split_enabled: boolean;
  split_percentage_owner: number;
}): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const professionalId of params.professional_ids) {
    const result = await setCostSplit({
      barbershop_id: params.barbershop_id,
      professional_id: professionalId,
      split_enabled: params.split_enabled,
      split_percentage_owner: params.split_percentage_owner,
      split_percentage_professional: 100 - params.split_percentage_owner,
    });

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
