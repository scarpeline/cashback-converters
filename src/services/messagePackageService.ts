// Message Package Service
// Gerenciamento de pacotes de mensagens e compras

import { supabase } from '@/integrations/supabase/client';

export interface MessagePackage {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  quantity_messages: number;
  price_per_message: number;
  total_price: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessagePurchase {
  id: string;
  barbershop_id: string;
  package_id: string;
  quantity_messages: number;
  total_amount: number;
  payment_method: 'pix' | 'card' | 'bank_transfer';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  purchased_by?: string;
  purchased_at: string;
  expires_at: string;
  created_at: string;
}

export interface MessageBalance {
  barbershop_id: string;
  total_messages: number;
  used_messages: number;
  expired_messages: number;
  available_messages: number;
  last_updated: string;
}

export const DEFAULT_PACKAGES = [
  { name: 'Pacote Básico', quantity: 100, price: 0.08, validity: 30 },
  { name: 'Pacote Padrão', quantity: 500, price: 0.07, validity: 30 },
  { name: 'Pacote Profissional', quantity: 1000, price: 0.065, validity: 30 },
  { name: 'Pacote Premium', quantity: 2500, price: 0.06, validity: 30 },
  { name: 'Pacote Ilimitado', quantity: 5000, price: 0.055, validity: 30 },
];

export async function createDefaultPackages(barbershopId: string): Promise<void> {
  try {
    const existingPackages = await getPackages(barbershopId);
    if (existingPackages.length > 0) return;

    const packagesToInsert = DEFAULT_PACKAGES.map(pkg => ({
      barbershop_id: barbershopId,
      name: pkg.name,
      quantity_messages: pkg.quantity,
      price_per_message: pkg.price,
      total_price: Number((pkg.quantity * pkg.price).toFixed(2)),
      validity_days: pkg.validity,
      is_active: true,
    }));

    await (supabase as any).from('message_packages').insert(packagesToInsert);

    await ensureBalanceExists(barbershopId);
  } catch (error) {
    console.error('Erro ao criar pacotes padrão:', error);
  }
}

export async function getPackages(barbershopId: string): Promise<MessagePackage[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('message_packages')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('quantity_messages', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return [];
  }
}

export async function createPackage(params: {
  barbershop_id: string;
  name: string;
  description?: string;
  quantity_messages: number;
  price_per_message: number;
  validity_days?: number;
}): Promise<{ success: boolean; package?: MessagePackage; error?: string }> {
  try {
    const totalPrice = Number((params.quantity_messages * params.price_per_message).toFixed(2));

    const { data, error } = await (supabase as any)
      .from('message_packages')
      .insert({
        barbershop_id: params.barbershop_id,
        name: params.name,
        description: params.description,
        quantity_messages: params.quantity_messages,
        price_per_message: params.price_per_message,
        total_price: totalPrice,
        validity_days: params.validity_days || 30,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, package: data };
  } catch (error: any) {
    console.error('Erro ao criar pacote:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePackage(params: {
  packageId: string;
  name?: string;
  description?: string;
  price_per_message?: number;
  is_active?: boolean;
}): Promise<boolean> {
  try {
    const updates: Partial<MessagePackage> = {};
    if (params.name) updates.name = params.name;
    if (params.description !== undefined) updates.description = params.description;
    if (params.price_per_message) updates.price_per_message = params.price_per_message;
    if (params.is_active !== undefined) updates.is_active = params.is_active;

    const { error } = await (supabase as any)
      .from('message_packages')
      .update(updates)
      .eq('id', params.packageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pacote:', error);
    return false;
  }
}

export async function deletePackage(packageId: string): Promise<boolean> {
  return updatePackage({ packageId, is_active: false });
}

export async function purchasePackage(params: {
  barbershop_id: string;
  package_id: string;
  quantity_messages: number;
  payment_method?: 'pix' | 'card' | 'bank_transfer';
}): Promise<{ success: boolean; purchase?: MessagePurchase; error?: string }> {
  try {
    const { data: pkg, error: pkgError } = await (supabase as any)
      .from('message_packages')
      .select('*')
      .eq('id', params.package_id)
      .single();

    if (pkgError || !pkg) {
      return { success: false, error: 'Pacote não encontrado' };
    }

    const totalAmount = Number((params.quantity_messages * pkg.price_per_message).toFixed(2));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validity_days);

    const { data, error } = await (supabase as any)
      .from('message_purchases')
      .insert({
        barbershop_id: params.barbershop_id,
        package_id: params.package_id,
        quantity_messages: params.quantity_messages,
        total_amount: totalAmount,
        payment_method: params.payment_method || 'pix',
        payment_status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, purchase: data };
  } catch (error: any) {
    console.error('Erro ao comprar pacote:', error);
    return { success: false, error: error.message };
  }
}

export async function confirmPurchase(params: {
  purchase_id: string;
  payment_id?: string;
}): Promise<boolean> {
  try {
    const { data: purchase, error: fetchError } = await (supabase as any)
      .from('message_purchases')
      .select('*')
      .eq('id', params.purchase_id)
      .single();

    if (fetchError || !purchase) return false;

    await (supabase as any)
      .from('message_purchases')
      .update({
        payment_status: 'paid',
        payment_id: params.payment_id,
        purchased_at: new Date().toISOString(),
      })
      .eq('id', params.purchase_id);

    await addMessagesToBalance(purchase.barbershop_id, purchase.quantity_messages);

    return true;
  } catch (error) {
    console.error('Erro ao confirmar compra:', error);
    return false;
  }
}

export async function addMessagesToBalance(barbershopId: string, quantity: number): Promise<boolean> {
  try {
    const { data: existing } = await (supabase as any)
      .from('message_balance')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (existing) {
      await (supabase as any)
        .from('message_balance')
        .update({
          total_messages: existing.total_messages + quantity,
          last_updated: new Date().toISOString(),
        })
        .eq('barbershop_id', barbershopId);
    } else {
      await (supabase as any).from('message_balance').insert({
        barbershop_id: barbershopId,
        total_messages: quantity,
        used_messages: 0,
        expired_messages: 0,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao adicionar mensagens ao saldo:', error);
    return false;
  }
}

export async function ensureBalanceExists(barbershopId: string): Promise<void> {
  try {
    const { data } = await (supabase as any)
      .from('message_balance')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (!data) {
      await (supabase as any).from('message_balance').insert({
        barbershop_id: barbershopId,
        total_messages: 0,
        used_messages: 0,
        expired_messages: 0,
      });
    }
  } catch (error) {
    console.error('Erro ao garantir saldo:', error);
  }
}

export async function getBalance(barbershopId: string): Promise<MessageBalance | null> {
  try {
    await ensureBalanceExists(barbershopId);

    const { data, error } = await (supabase as any)
      .from('message_balance')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (error) throw error;

    const available = data.total_messages - data.used_messages - data.expired_messages;

    return {
      barbershop_id: data.barbershop_id,
      total_messages: data.total_messages,
      used_messages: data.used_messages,
      expired_messages: data.expired_messages,
      available_messages: available > 0 ? available : 0,
      last_updated: data.last_updated,
    };
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return null;
  }
}

export async function useMessages(barbershopId: string, quantity: number): Promise<boolean> {
  try {
    const balance = await getBalance(barbershopId);
    if (!balance || balance.available_messages < quantity) {
      return false;
    }

    const { error } = await (supabase as any).rpc('update_message_balance', {
      p_barbershop_id: barbershopId,
      p_messages_used: quantity,
      p_messages_expired: 0,
    });

    if (error) {
      const { data } = await (supabase as any)
        .from('message_balance')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .single();

      if (data) {
        await (supabase as any)
          .from('message_balance')
          .update({
            used_messages: data.used_messages + quantity,
            last_updated: new Date().toISOString(),
          })
          .eq('barbershop_id', barbershopId);
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao usar mensagens:', error);
    return false;
  }
}

export async function getPurchaseHistory(barbershopId: string, limit: number = 20): Promise<MessagePurchase[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('message_purchases')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de compras:', error);
    return [];
  }
}

export async function checkAndExpireMessages(): Promise<number> {
  try {
    const { data: purchases } = await (supabase as any)
      .from('message_purchases')
      .select('*')
      .eq('payment_status', 'paid')
      .lt('expires_at', new Date().toISOString());

    if (!purchases || purchases.length === 0) return 0;

    let expired = 0;

    for (const purchase of purchases) {
      const { data: balance } = await (supabase as any)
        .from('message_balance')
        .select('*')
        .eq('barbershop_id', purchase.barbershop_id)
        .single();

      if (balance) {
        const remaining = purchase.quantity_messages - Math.min(purchase.quantity_messages, balance.used_messages);

        if (remaining > 0) {
          await (supabase as any)
            .from('message_balance')
            .update({
              expired_messages: balance.expired_messages + remaining,
              last_updated: new Date().toISOString(),
            })
            .eq('barbershop_id', purchase.barbershop_id);
        }

        expired += remaining;
      }

      await (supabase as any)
        .from('message_purchases')
        .update({ payment_status: 'expired' })
        .eq('id', purchase.id);
    }

    return expired;
  } catch (error) {
    console.error('Erro ao expirar mensagens:', error);
    return 0;
  }
}
