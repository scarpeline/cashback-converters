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
  created_at: string;
  updated_at: string;
}

export interface PartnerWithUser extends Partner {
  users?: {
    name: string;
    email: string;
    whatsapp: string;
  };
}

/**
 * Buscar todos os parceiros
 * Se a tabela 'partners' não existir, retorna array vazio (fallback seguro)
 */
export async function getPartners(): Promise<PartnerWithUser[]> {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data: partner, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) throw error;

    const hierarchy: Partner[] = [partner];

    // Buscar parceiros acima na hierarquia
    let currentParentId = partner.parent_id;
    while (currentParentId) {
      const { data: parent, error: parentError } = await supabase
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
    const { count, error } = await supabase
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
    const { data, error } = await supabase
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