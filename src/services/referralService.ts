// Referral Service
// Sistema de Indicação de Clientes (Cliente indica amigo)

import { supabase } from '@/integrations/supabase/client';

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_type?: 'cashback' | 'discount' | 'free_service';
  reward_amount?: number;
  referred_user_name?: string;
  referred_user_email?: string;
  created_at: string;
  completed_at?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  cashbackEarned: number;
}

export async function getReferralCode(userId: string): Promise<string | null> {
  try {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    return data?.referral_code || null;
  } catch {
    return null;
  }
}

export async function generateReferralCode(userId: string): Promise<string> {
  try {
    const code = `INDICA-${userId.substring(0, 8).toUpperCase()}`;

    await (supabase as any)
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId);

    return code;
  } catch (error) {
    console.error('Erro ao gerar código:', error);
    return `INDICA-${Date.now().toString(36).toUpperCase()}`;
  }
}

export async function getMyReferralCode(userId: string): Promise<string> {
  let code = await getReferralCode(userId);
  if (!code) {
    code = await generateReferralCode(userId);
  }
  return code;
}

export async function applyReferralCode(userId: string, code: string): Promise<{
  success: boolean;
  reward?: { type: string; amount: number };
  error?: string;
}> {
  try {
    const { data: referrer, error: referrerError } = await (supabase as any)
      .from('profiles')
      .select('id, name, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return { success: false, error: 'Código de indicação inválido' };
    }

    if (referrer.id === userId) {
      return { success: false, error: 'Você não pode usar seu próprio código' };
    }

    const { data: existing } = await (supabase as any)
      .from('client_referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .single();

    if (existing) {
      return { success: false, error: 'Você já utilizou um código de indicação' };
    }

    const defaultReward = { type: 'cashback', amount: 10 };

    await (supabase as any).from('client_referrals').insert({
      referrer_user_id: referrer.id,
      referred_user_id: userId,
      referral_code: code.toUpperCase(),
      status: 'pending',
      reward_type: defaultReward.type,
      reward_amount: defaultReward.amount,
    });

    return { success: true, reward: defaultReward };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMyReferrals(userId: string): Promise<Referral[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('client_referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar indicações:', error);
    return [];
  }
}

export async function getReferralsByMe(userId: string): Promise<Referral[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('client_referrals')
      .select('*')
      .eq('referred_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar indicações:', error);
    return [];
  }
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const [myReferrals, byMe] = await Promise.all([
      getMyReferrals(userId),
      getReferralsByMe(userId),
    ]);

    const total = myReferrals.length;
    const completed = myReferrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
    const pending = total - completed;
    const totalRewards = myReferrals
      .filter(r => r.reward_amount)
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
    const cashbackEarned = myReferrals
      .filter(r => r.reward_type === 'cashback')
      .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    return {
      totalReferrals: total,
      completedReferrals: completed,
      pendingReferrals: pending,
      totalRewards,
      cashbackEarned,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewards: 0,
      cashbackEarned: 0,
    };
  }
}

export async function completeReferral(referralId: string): Promise<boolean> {
  try {
    const { data: referral } = await (supabase as any)
      .from('client_referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (!referral) return false;

    await (supabase as any)
      .from('client_referrals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    if (referral.reward_type === 'cashback' && referral.reward_amount) {
      await (supabase as any).rpc('credit_referral_cashback', {
        p_user_id: referral.referrer_user_id,
        p_amount: referral.reward_amount,
        p_referral_id: referralId,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao completar indicação:', error);
    return false;
  }
}

export async function processReferralReward(referralId: string): Promise<boolean> {
  try {
    const { data: referral } = await (supabase as any)
      .from('client_referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (!referral) return false;

    if (referral.reward_type === 'cashback' && referral.reward_amount) {
      await (supabase as any).rpc('credit_referral_cashback', {
        p_user_id: referral.referrer_user_id,
        p_amount: referral.reward_amount,
        p_referral_id: referralId,
      });
    }

    await (supabase as any)
      .from('client_referrals')
      .update({
        status: 'rewarded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    return true;
  } catch (error) {
    console.error('Erro ao processar recompensa:', error);
    return false;
  }
}

export async function shareReferralLink(userId: string): Promise<string> {
  const code = await getMyReferralCode(userId);
  return `Olá! Use meu código ${code} para ganhar cashback ao se cadastrar no app!`;
}

export async function getReferralShareOptions(userId: string): Promise<{
  code: string;
  whatsapp: string;
  email: string;
  sms: string;
}> {
  const code = await getMyReferralCode(userId);
  const baseUrl = window.location.origin;

  return {
    code,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Olá! Use meu código ${code} para ganhar cashback ao se cadastrar no app!`)}`,
    email: `mailto:?subject=Indicação&body=${encodeURIComponent(`Olá! Use meu código ${code} para ganhar cashback ao se cadastrar no app! ${baseUrl}`)}`,
    sms: `sms:?body=${encodeURIComponent(`Use o código ${code} para ganhar cashback no app!`)}`,
  };
}
