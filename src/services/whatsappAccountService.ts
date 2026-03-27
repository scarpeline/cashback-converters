// WhatsApp Account Service
// Gerenciamento de números de WhatsApp verificados por profissional

import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppAccount {
  id: string;
  barbershop_id: string;
  professional_id?: string;
  phone_number: string;
  phone_number_formatted: string;
  twilio_sid?: string;
  twilio_auth_token?: string;
  twilio_messaging_service_sid?: string;
  is_verified: boolean;
  verification_code?: string;
  verification_expires_at?: string;
  verified_at?: string;
  is_active: boolean;
  is_primary: boolean;
  nickname?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  code?: string;
}

export interface AccountWithProfessional extends WhatsAppAccount {
  professional?: {
    id: string;
    name: string;
    user_id?: string;
  };
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) {
    return `+${digits}`;
  }
  if (!digits.startsWith('+')) {
    return `+55${digits}`;
  }
  return `+${digits}`;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerWhatsAppAccount(params: {
  barbershop_id: string;
  professional_id?: string;
  phone_number: string;
  nickname?: string;
}): Promise<{ success: boolean; account?: WhatsAppAccount; error?: string }> {
  try {
    const phoneFormatted = formatPhoneNumber(params.phone_number);

    const { data: existing } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('id')
      .eq('phone_number', phoneFormatted)
      .eq('is_active', true)
      .single();

    if (existing) {
      return { success: false, error: 'Este número já está cadastrado' };
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .insert({
        barbershop_id: params.barbershop_id,
        professional_id: params.professional_id || null,
        phone_number: phoneFormatted,
        phone_number_formatted: phoneFormatted,
        nickname: params.nickname,
        verification_code: verificationCode,
        verification_expires_at: expiresAt,
        is_verified: false,
        is_active: true,
        is_primary: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, account: data as WhatsAppAccount };
  } catch (error: any) {
    console.error('Erro ao registrar WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyPhoneNumber(params: {
  account_id: string;
  code: string;
  twilio_sid?: string;
  twilio_auth_token?: string;
}): Promise<VerificationResult> {
  try {
    const { data: account, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('*')
      .eq('id', params.account_id)
      .single();

    if (error || !account) {
      return { success: false, message: 'Conta não encontrada' };
    }

    if (account.is_verified) {
      return { success: false, message: 'Este número já foi verificado' };
    }

    if (new Date() > new Date(account.verification_expires_at)) {
      return { success: false, message: 'Código expirado. Solicite um novo.' };
    }

    if (account.verification_code !== params.code) {
      return { success: false, message: 'Código incorreto' };
    }

    const updates: Partial<WhatsAppAccount> = {
      is_verified: true,
      verified_at: new Date().toISOString(),
      verification_code: null,
      verification_expires_at: null,
    };

    if (params.twilio_sid) updates.twilio_sid = params.twilio_sid;
    if (params.twilio_auth_token) updates.twilio_auth_token = params.twilio_auth_token;

    const { error: updateError } = await (supabase as any)
      .from('whatsapp_accounts')
      .update(updates)
      .eq('id', params.account_id);

    if (updateError) throw updateError;

    return { success: true, message: 'Número verificado com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao verificar número:', error);
    return { success: false, message: error.message };
  }
}

export async function resendVerificationCode(accountId: string): Promise<VerificationResult> {
  try {
    const newCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error } = await (supabase as any)
      .from('whatsapp_accounts')
      .update({
        verification_code: newCode,
        verification_expires_at: expiresAt,
      })
      .eq('id', accountId)
      .eq('is_verified', false);

    if (error) throw error;

    return { success: true, message: 'Código reenviado', code: newCode };
  } catch (error: any) {
    console.error('Erro ao reenviar código:', error);
    return { success: false, message: error.message };
  }
}

export async function getWhatsAppAccounts(barbershopId: string): Promise<WhatsAppAccount[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contas WhatsApp:', error);
    return [];
  }
}

export async function getWhatsAppAccountsWithProfessional(barbershopId: string): Promise<AccountWithProfessional[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select(`
        *,
        professional:professionals(id, name, user_id)
      `)
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar contas com profissional:', error);
    return [];
  }
}

export async function getAccountById(accountId: string): Promise<WhatsAppAccount | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getVerifiedAccountForProfessional(professionalId: string): Promise<WhatsAppAccount | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('is_verified', true)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setPrimaryAccount(accountId: string, barbershopId: string): Promise<boolean> {
  try {
    await (supabase as any)
      .from('whatsapp_accounts')
      .update({ is_primary: false })
      .eq('barbershop_id', barbershopId)
      .eq('is_primary', true);

    const { error } = await (supabase as any)
      .from('whatsapp_accounts')
      .update({ is_primary: true })
      .eq('id', accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao definir conta primária:', error);
    return false;
  }
}

export async function updateAccountCredentials(params: {
  accountId: string;
  twilio_sid?: string;
  twilio_auth_token?: string;
  twilio_messaging_service_sid?: string;
}): Promise<boolean> {
  try {
    const updates: Partial<WhatsAppAccount> = {};
    if (params.twilio_sid) updates.twilio_sid = params.twilio_sid;
    if (params.twilio_auth_token) updates.twilio_auth_token = params.twilio_auth_token;
    if (params.twilio_messaging_service_sid) updates.twilio_messaging_service_sid = params.twilio_messaging_service_sid;

    const { error } = await (supabase as any)
      .from('whatsapp_accounts')
      .update(updates)
      .eq('id', params.accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar credenciais:', error);
    return false;
  }
}

export async function deleteWhatsAppAccount(accountId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('whatsapp_accounts')
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return false;
  }
}

export async function getBarbershopPrimaryAccount(barbershopId: string): Promise<WhatsAppAccount | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_accounts')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_verified', true)
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();

    if (error) {
      const { data: anyAccount } = await (supabase as any)
        .from('whatsapp_accounts')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('is_verified', true)
        .eq('is_active', true)
        .limit(1)
        .single();

      return anyAccount || null;
    }

    return data;
  } catch {
    return null;
  }
}
