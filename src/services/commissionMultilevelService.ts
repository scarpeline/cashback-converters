// Serviço de Comissão Multinível
// Integração com estrutura existente (partners, commissions, commission_rules)

import { supabase } from "@/integrations/supabase/client";

export interface CommissionDistribution {
  partner_id: string;
  amount: number;
  percentage: number;
  type: 'adesao' | 'recorrente';
  level: number;
}

/**
 * Distribuir comissão multinível
 * Quando um pagamento é feito, percorre a hierarquia e distribui comissões
 */
export async function distribuirComissaoMultinivel(
  valor: number,
  partnerId: string,
  sourceUserId: string,
  type: 'adesao' | 'recorrente = 'adesao'
): Promise<CommissionDistribution[]> {
  try {
    const distribuicoes: CommissionDistribution[] = [];
    let parceiro = await getPartner(partnerId);
    let nivel = 0;

    while (parceiro) {
      // Buscar regra de comissão para este parceiro
      const regra = await getCommissionRule(parceiro, nivel);
      
      if (regra) {
        // Verificar se já existe comissão para esta transação
        const existe = await alreadyHasCommission(
          parceiro.id, 
          sourceUserId, 
          type
        );

        if (!existe) {
          const valorComissao = valor * (regra.commission_percent / 100);
          
          // Criar comissão
          const { data: comissao, error } = await supabase
            .from('commissions')
            .insert({
              partner_id: parceiro.id,
              source_user_id: sourceUserId,
              amount: valorComissao,
              type: type,
              status: 'pendente',
            })
            .select()
            .single();

          if (error) {
            console.error('Erro ao criar comissão:', error);
          } else {
            distribuicoes.push({
              partner_id: parceiro.id,
              amount: valorComissao,
              percentage: regra.commission_percent,
              type: type,
              level: nivel,
            });
          }
        }
      }

      // Subir na hierarquia
      if (parceiro.parent_id) {
        parceiro = await getPartner(parceiro.parent_id);
        nivel++;
      } else {
        parceiro = null;
      }
    }

    return distribuicoes;
  } catch (error) {
    console.error('Erro ao distribuir comissão:', error);
    return [];
  }
}

/**
 * Buscar parceiro por ID
 */
async function getPartner(partnerId: string) {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Buscar regra de comissão para o parceiro
 */
async function getCommissionRule(partner: any, nivel: number) {
  try {
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .eq('partner_type', partner.type)
      .gte('level_min', nivel)
      .lte('level_max', nivel + partner.total_indicados)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Verificar se já existe comissão para esta transação
 */
async function alreadyHasCommission(
  partnerId: string,
  sourceUserId: string,
  type: 'adesao' | 'recorrente'
) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('source_user_id', sourceUserId)
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Processar pagamento e distribuir comissões
 */
export async function processarPagamento(
  barbershopId: string,
  clientId: string,
  valor: number,
  partnerId: string
): Promise<{ success: boolean; distribuicoes: CommissionDistribution[] }> {
  try {
    // Validar dados
    if (!partnerId || valor <= 0) {
      return { success: false, distribuicoes: [] };
    }

    // Criar pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('payments')
      .insert({
        barbershop_id: barbershopId,
        client_id: clientId,
        amount: valor,
        method: 'pix',
        status: 'paid',
      })
      .select()
      .single();

    if (pagError) {
      console.error('Erro ao criar pagamento:', pagError);
      return { success: false, distribuicoes: [] };
    }

    // Distribuir comissões
    const distribuicoes = await distribuirComissaoMultinivel(
      valor,
      partnerId,
      clientId,
      'adesao'
    );

    return { success: true, distribuicoes };
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return { success: false, distribuicoes: [] };
  }
}

/**
 * Processar pagamento recorrente (mensalidade)
 */
export async function processarPagamentoRecurrente(
  barbershopId: string,
  clientId: string,
  valor: number,
  partnerId: string
): Promise<{ success: boolean; distribuicoes: CommissionDistribution[] }> {
  try {
    // Validar dados
    if (!partnerId || valor <= 0) {
      return { success: false, distribuicoes: [] };
    }

    // Criar pagamento
    const { data: pagamento, error: pagError } = await supabase
      .from('payments')
      .insert({
        barbershop_id: barbershopId,
        client_id: clientId,
        amount: valor,
        method: 'pix',
        status: 'paid',
      })
      .select()
      .single();

    if (pagError) {
      console.error('Erro ao criar pagamento:', pagError);
      return { success: false, distribuicoes: [] };
    }

    // Distribuir comissões recorrentes
    const distribuicoes = await distribuirComissaoMultinivel(
      valor,
      partnerId,
      clientId,
      'recorrente'
    );

    return { success: true, distribuicoes };
  } catch (error) {
    console.error('Erro ao processar pagamento recorrente:', error);
    return { success: false, distribuicoes: [] };
  }
}

/**
 * Buscar comissões de um parceiro
 */
export async function getPartnerCommissions(partnerId: string) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comissões:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return [];
  }
}

/**
 * Calcular total de comissões de um parceiro
 */
export async function getTotalCommissions(partnerId: string) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('partner_id', partnerId);

    if (error) {
      console.error('Erro ao calcular comissões:', error);
      return { total: 0, pendente: 0, pago: 0 };
    }

    const comissoes = data || [];
    
    const total = comissoes.reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pago = comissoes
      .filter((c: any) => c.status === 'pago')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pendente = comissoes
      .filter((c: any) => c.status === 'pendente')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);

    return { total, pendente, pago };
  } catch (error) {
    console.error('Erro ao calcular comissões:', error);
    return { total: 0, pendente: 0, pago: 0 };
  }
}

/**
 * Buscar comissões por status
 */
export async function getCommissionsByStatus(status: 'pending' | 'paid') {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*, partners:user_id(name, type)')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comissões:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comissões:', error);
    return [];
  }
}

/**
 * Atualizar status de comissão
 */
export async function updateCommissionStatus(
  commissionId: string,
  status: 'pending' | 'paid'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('commissions')
      .update({ status })
      .eq('id', commissionId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return false;
  }
}

/**
 * Gerar relatório de comissões
 */
export async function generateCommissionReport(
  partnerId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao gerar relatório:', error);
      return null;
    }

    const comissoes = data || [];
    
    const total = comissoes.reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pago = comissoes
      .filter((c: any) => c.status === 'pago')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pendente = comissoes
      .filter((c: any) => c.status === 'pendente')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);

    return {
      total,
      pago,
      pendente,
      comissoes,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return null;
  }
}