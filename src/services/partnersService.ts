// Serviço de parceiros - Integração com estrutura existente
// NÃO duplica funcionalidades existentes

import { supabase } from "@/integrations/supabase/client";

export interface Partner {
  id: string;
  user_id: string;
  type: 'afiliado' | 'franqueado' | 'diretor';
  parent_id: string | null;
  level: number;
  total_indicados: number;
  status: 'ativo' | 'bloqueado';
  referral_code?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerWithUser extends Partner {
  users?: {
    name: string;
    email: string;
    whatsapp: string;
  };
  referral_code?: string;
}

/**
 * Buscar todos os parceiros
 * Se a tabela 'partners' não existir, retorna array vazio (fallback seguro)
 */
export async function getPartners(): Promise<PartnerWithUser[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .select(`
        *,
        users:user_id (
          name,
          email,
          whatsapp
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // Se a tabela não existir, retorna array vazio (sem quebrar)
      if (error.code === '42P01') {
        console.warn('Tabela partners não existe ainda. Retornando array vazio.');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar parceiros:', error);
    return []; // Fallback seguro
  }
}

/**
 * Buscar parceiro por ID
 */
export async function getPartnerById(id: string): Promise<PartnerWithUser | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .select(`
        *,
        users:user_id (
          name,
          email,
          whatsapp
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar parceiro:', error);
    return null;
  }
}

/**
 * Criar novo parceiro
 */
export async function createPartner(partnerData: {
  user_id: string;
  type: 'afiliado' | 'franqueado' | 'diretor';
  parent_id?: string | null;
}): Promise<Partner | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .insert([{
        ...partnerData,
        level: 0,
        total_indicados: 0,
        status: 'ativo'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar parceiro:', error);
    return null;
  }
}

/**
 * Atualizar parceiro
 */
export async function updatePartner(
  id: string, 
  updates: Partial<Partner>
): Promise<Partner | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error);
    return null;
  }
}

/**
 * Atualizar status do parceiro
 */
export async function updatePartnerStatus(
  id: string, 
  status: 'ativo' | 'bloqueado'
): Promise<Partner | null> {
  return updatePartner(id, { status });
}

/**
 * Buscar parceiros por tipo
 */
export async function getPartnersByType(type: Partner['type']): Promise<PartnerWithUser[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .select(`
        *,
        users:user_id (
          name,
          email,
          whatsapp
        )
      `)
      .eq('type', type)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar parceiros por tipo:', error);
    return [];
  }
}

/**
 * Buscar hierarquia de parceiros
 */
export async function getPartnerHierarchy(partnerId: string): Promise<Partner[]> {
  try {
    // Buscar parceiro atual
    const { data: partner, error } = await (supabase as any)
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) throw error;

    const hierarchy: Partner[] = [partner];

    // Buscar parceiros acima na hierarquia
    let currentParentId = partner.parent_id;
    while (currentParentId) {
      const { data: parent, error: parentError } = await (supabase as any)
        .from('partners')
        .select('*')
        .eq('id', currentParentId)
        .single();

      if (parentError) break;
      
      hierarchy.push(parent);
      currentParentId = parent.parent_id;
    }

    return hierarchy;
  } catch (error) {
    console.error('Erro ao buscar hierarquia:', error);
    return [];
  }
}

/**
 * Contar indicados diretos de um parceiro
 */
export async function countDirectReferrals(partnerId: string): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', partnerId)
      .eq('status', 'ativo');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Erro ao contar indicados:', error);
    return 0;
  }
}

/**
 * Verificar se usuário já é parceiro
 */
export async function isUserPartner(userId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ativo')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar se usuário é parceiro:', error);
    return false;
  }
}

/**
 * Gerar código de referência único
 */
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Buscar parceiro por referral_code
 */
export async function getPartnerByReferralCode(code: string): Promise<PartnerWithUser | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('partners')
      .select(`
        *,
        users:user_id (
          name,
          email,
          whatsapp
        )
      `)
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar parceiro por código:', error);
    return null;
  }
}

/**
 * Registrar referência (quando alguém se cadastra via link)
 */
export async function createPartnerReferral(referrerId: string, referredUserId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_referrals')
      .insert([{
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        status: 'pending'
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao registrar referência:', error);
    return false;
  }
}

/**
 * Buscar comissões de um parceiro
 */
export async function getPartnerCommissions(partnerId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('partner_commissions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return [];
  }
}

/**
 * Buscar resumo de comissões
 */
export async function getPartnerCommissionSummary(partnerId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('partner_commission_summary')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          pending_count: 0,
          approved_count: 0,
          paid_count: 0,
          pending_amount: 0,
          approved_amount: 0,
          paid_amount: 0,
          total_amount: 0
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar resumo de comissões:', error);
    return {
      pending_count: 0,
      approved_count: 0,
      paid_count: 0,
      pending_amount: 0,
      approved_amount: 0,
      paid_amount: 0,
      total_amount: 0
    };
  }
}

/**
 * Criar comissão para parceiro
 */
export async function createPartnerCommission(data: {
  partner_id: string;
  type: 'referral' | 'franchise_revenue' | 'network_revenue';
  amount: number;
  description?: string;
  source_id?: string;
  source_type?: string;
}): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('partner_commissions')
      .insert([{
        ...data,
        status: 'pending'
      }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao criar comissão:', error);
    return false;
  }
}