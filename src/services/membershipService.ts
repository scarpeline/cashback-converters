// Membership Service
// Sistema de Clube de Assinatura VIP

import { supabase } from '@/integrations/supabase/client';

export interface MembershipPlan {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  price_monthly: number;
  original_price?: number;
  benefits: { id: string; name: string; description: string }[];
  monthly_visits_included: number;
  discount_percentage: number;
  cashback_percentage: number;
  priority_booking: boolean;
  exclusive_access: boolean;
  is_active: boolean;
  is_featured: boolean;
}

export interface Membership {
  id: string;
  client_user_id: string;
  barbershop_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  start_date: string;
  next_billing_date?: string;
  visits_used_this_period: number;
  total_cashback_earned: number;
  total_spent: number;
  referral_code?: string;
  referral_count: number;
  plan?: MembershipPlan;
}

export interface MembershipTransaction {
  id: string;
  membership_id: string;
  transaction_type: 'cashback_earned' | 'cashback_redeemed' | 'refund' | 'monthly_fee' | 'referral_bonus';
  amount: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

export async function getPlans(barbershopId: string): Promise<MembershipPlan[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('membership_plans')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return [];
  }
}

export async function getClientMembership(clientUserId: string): Promise<Membership | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('memberships')
      .select('*, plan:membership_plans(*)')
      .eq('client_user_id', clientUserId)
      .in('status', ['active', 'paused'])
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function subscribeToPlan(params: {
  client_user_id: string;
  barbershop_id: string;
  plan_id: string;
}): Promise<{ success: boolean; membership?: Membership; error?: string }> {
  try {
    const existing = await getClientMembership(params.client_user_id);
    if (existing) {
      return { success: false, error: 'Você já possui uma assinatura ativa' };
    }

    const { data: plan } = await (supabase as any)
      .from('membership_plans')
      .select('*')
      .eq('id', params.plan_id)
      .single();

    if (!plan) {
      return { success: false, error: 'Plano não encontrado' };
    }

    const now = new Date();
    const nextBilling = new Date(now);
    if (plan.plan_type === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else if (plan.plan_type === 'quarterly') {
      nextBilling.setMonth(nextBilling.getMonth() + 3);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    const periodEnd = new Date(now);
    if (plan.plan_type === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.plan_type === 'quarterly') {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data, error } = await (supabase as any)
      .from('memberships')
      .insert({
        client_user_id: params.client_user_id,
        barbershop_id: params.barbershop_id,
        plan_id: params.plan_id,
        status: 'active',
        start_date: now.toISOString(),
        next_billing_date: nextBilling.toISOString(),
        last_billing_date: now.toISOString(),
        billing_period_start: now.toISOString(),
        billing_period_end: periodEnd.toISOString(),
      })
      .select('*, plan:membership_plans(*)')
      .single();

    if (error) throw error;
    return { success: true, membership: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelMembership(membershipId: string, reason?: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('memberships')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', membershipId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return false;
  }
}

export async function pauseMembership(membershipId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('memberships')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
      })
      .eq('id', membershipId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao pausar assinatura:', error);
    return false;
  }
}

export async function resumeMembership(membershipId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('memberships')
      .update({
        status: 'active',
        paused_at: null,
      })
      .eq('id', membershipId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao retomar assinatura:', error);
    return false;
  }
}

export async function getTransactions(membershipId: string): Promise<MembershipTransaction[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('membership_transactions')
      .select('*')
      .eq('membership_id', membershipId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

export async function getCashbackBalance(membershipId: string): Promise<number> {
  try {
    const transactions = await getTransactions(membershipId);

    const earned = transactions
      .filter(t => t.transaction_type === 'cashback_earned')
      .reduce((sum, t) => sum + t.amount, 0);

    const spent = transactions
      .filter(t => ['cashback_redeemed', 'refund'].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);

    return earned - spent;
  } catch (error) {
    console.error('Erro ao calcular saldo:', error);
    return 0;
  }
}

export async function addCashback(params: {
  membership_id: string;
  amount: number;
  description: string;
  order_id?: string;
}): Promise<boolean> {
  try {
    const { error } = await (supabase as any).rpc('credit_cashback', {
      p_membership_id: params.membership_id,
      p_amount: params.amount,
      p_description: params.description,
      p_order_id: params.order_id,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao adicionar cashback:', error);
    return false;
  }
}

export async function redeemCashback(params: {
  membership_id: string;
  amount: number;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await (supabase as any).rpc('redeem_cashback', {
      p_membership_id: params.membership_id,
      p_amount: params.amount,
      p_description: params.description,
    });

    if (error) throw error;
    return { success: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function useReferralCode(referralCode: string, newUserId: string): Promise<{ success: boolean; bonus?: number; error?: string }> {
  try {
    const { data: referrer, error: referrerError } = await (supabase as any)
      .from('memberships')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('status', 'active')
      .single();

    if (referrerError || !referrer) {
      return { success: false, error: 'Código de indicação inválido' };
    }

    const { data: plan } = await (supabase as any)
      .from('membership_plans')
      .select('cashback_percentage')
      .eq('id', referrer.plan_id)
      .single();

    const bonus = plan?.cashback_percentage || 10;

    await (supabase as any).from('membership_referrals').insert({
      referrer_membership_id: referrer.id,
      referred_user_id: newUserId,
      referral_code_used: referralCode,
      bonus_awarded: bonus,
    });

    await (supabase as any)
      .from('memberships')
      .update({ referral_count: referrer.referral_count + 1 })
      .eq('id', referrer.id);

    await addCashback({
      membership_id: referrer.id,
      amount: bonus,
      description: `Bônus por indicar amigo`,
    });

    return { success: true, bonus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMembershipBenefits(membershipId: string): Promise<any[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('membership_benefits')
      .select('*')
      .eq('membership_id', membershipId)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar benefícios:', error);
    return [];
  }
}

export async function useBenefit(benefitId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('membership_benefits')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', benefitId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao usar benefício:', error);
    return false;
  }
}

export async function getMembershipStats(barbershopId: string): Promise<{
  totalMembers: number;
  activeMembers: number;
  totalCashback: number;
  revenue: number;
}> {
  try {
    const { data: memberships } = await (supabase as any)
      .from('memberships')
      .select('*')
      .eq('barbershop_id', barbershopId);

    const { data: transactions } = await (supabase as any)
      .from('membership_transactions')
      .select('amount, transaction_type')
      .eq('memberships.barbershop_id', barbershopId);

    const totalMembers = memberships?.length || 0;
    const activeMembers = memberships?.filter(m => m.status === 'active').length || 0;

    const totalCashback = transactions
      ?.filter(t => t.transaction_type === 'cashback_earned')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const revenue = memberships
      ?.filter(m => m.status === 'active')
      .reduce((sum, m) => sum + (m.total_spent || 0), 0) || 0;

    return { totalMembers, activeMembers, totalCashback, revenue };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { totalMembers: 0, activeMembers: 0, totalCashback: 0, revenue: 0 };
  }
}
