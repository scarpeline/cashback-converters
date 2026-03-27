/**
 * Serviço para gerenciar comissões de parceiros
 * Integra com pagamentos, agendamentos e referências
 */

import { supabase } from '@/integrations/supabase/client';
import { createPartnerCommission } from './partnersService';

/**
 * Gerar comissão quando um cliente é indicado e faz primeira compra
 */
export async function generateReferralCommission(
  referrerId: string,
  referredUserId: string,
  paymentAmount: number,
  paymentId: string
) {
  try {
    // Buscar configuração de comissão para afiliados
    const commissionPercentage = 0.10; // 10% para primeira compra
    const commissionAmount = paymentAmount * commissionPercentage;

    const success = await createPartnerCommission({
      partner_id: referrerId,
      type: 'referral',
      amount: commissionAmount,
      description: `Comissão de indicação - Cliente ${referredUserId.substring(0, 8)}`,
      source_id: paymentId,
      source_type: 'payment'
    });

    return success;
  } catch (error) {
    console.error('Erro ao gerar comissão de referência:', error);
    return false;
  }
}

/**
 * Gerar comissão para franqueado sobre faturamento
 */
export async function generateFranchiseCommission(
  franchiseId: string,
  revenueAmount: number,
  paymentId: string
) {
  try {
    // 30% sobre faturamento da unidade
    const commissionPercentage = 0.30;
    const commissionAmount = revenueAmount * commissionPercentage;

    const success = await createPartnerCommission({
      partner_id: franchiseId,
      type: 'franchise_revenue',
      amount: commissionAmount,
      description: `Comissão sobre faturamento da unidade`,
      source_id: paymentId,
      source_type: 'payment'
    });

    return success;
  } catch (error) {
    console.error('Erro ao gerar comissão de franquia:', error);
    return false;
  }
}

/**
 * Gerar comissão para diretor sobre rede
 */
export async function generateNetworkCommission(
  directorId: string,
  networkRevenueAmount: number,
  paymentId: string
) {
  try {
    // 5% sobre faturamento da rede
    const commissionPercentage = 0.05;
    const commissionAmount = networkRevenueAmount * commissionPercentage;

    const success = await createPartnerCommission({
      partner_id: directorId,
      type: 'network_revenue',
      amount: commissionAmount,
      description: `Comissão sobre faturamento da rede`,
      source_id: paymentId,
      source_type: 'payment'
    });

    return success;
  } catch (error) {
    console.error('Erro ao gerar comissão de rede:', error);
    return false;
  }
}

/**
 * Buscar comissões pendentes de um parceiro
 */
export async function getPendingCommissions(partnerId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('partner_commissions')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar comissões pendentes:', error);
    return [];
  }
}

/**
 * Aprovar comissão (admin)
 */
export async function approveCommission(commissionId: string) {
  try {
    const { error } = await (supabase as any)
      .from('partner_commissions')
      .update({ status: 'approved' })
      .eq('id', commissionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao aprovar comissão:', error);
    return false;
  }
}

/**
 * Marcar comissão como paga
 */
export async function markCommissionAsPaid(commissionId: string) {
  try {
    const { error } = await (supabase as any)
      .from('partner_commissions')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', commissionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao marcar comissão como paga:', error);
    return false;
  }
}

/**
 * Cancelar comissão
 */
export async function cancelCommission(commissionId: string) {
  try {
    const { error } = await (supabase as any)
      .from('partner_commissions')
      .update({ status: 'cancelled' })
      .eq('id', commissionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao cancelar comissão:', error);
    return false;
  }
}
