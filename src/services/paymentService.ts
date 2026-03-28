// Serviço de Pagamentos — Refatorado sem duplicações
import { supabase } from "@/integrations/supabase/client";

export interface Payment {
  id: string;
  barbershop_id: string;
  client_id: string;
  amount: number;
  method: 'pix' | 'card' | 'cash' | 'bank_transfer';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  asaas_payment_id?: string;
  asaas_pix_qr_code?: string;
  asaas_pix_copy_paste?: string;
  paid_at?: string;
  created_at: string;
}

export interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  totalAmount: number;
  paidAmount: number;
  byMethod: Record<string, number>;
}

interface PaymentFilters {
  barbershop_id?: string;
  client_id?: string;
  status?: Payment['status'];
  method?: Payment['method'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Query genérica de pagamentos com filtros compostos
 */
export async function queryPayments(filters: PaymentFilters): Promise<Payment[]> {
  try {
    let query = (supabase as any).from('payments').select('*');

    if (filters.barbershop_id) query = query.eq('barbershop_id', filters.barbershop_id);
    if (filters.client_id) query = query.eq('client_id', filters.client_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.method) query = query.eq('method', filters.method);
    if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
    if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

    query = query.order('created_at', { ascending: false });
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/** Criar novo pagamento */
export async function createPayment(data: {
  barbershop_id: string; client_id: string; amount: number;
  method: Payment['method']; reference_id?: string; reference_type?: string;
}): Promise<Payment | null> {
  try {
    const { data: payment, error } = await (supabase as any)
      .from('payments').insert({ ...data, status: 'pending' }).select().single();
    if (error) throw error;
    return payment;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return null;
  }
}

/** Atualizar status do pagamento */
export async function updatePaymentStatus(
  paymentId: string, status: Payment['status'], extra?: Record<string, any>
): Promise<boolean> {
  try {
    const updates: Record<string, any> = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    if (extra) Object.assign(updates, extra);

    const { error } = await (supabase as any).from('payments').update(updates).eq('id', paymentId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar pagamento para ${status}:`, error);
    return false;
  }
}

/** Confirmar pagamento */
export const confirmPayment = (id: string) => updatePaymentStatus(id, 'paid');
/** Falhar pagamento */
export const failPayment = (id: string) => updatePaymentStatus(id, 'failed');
/** Reembolsar pagamento */
export const refundPayment = (id: string) => updatePaymentStatus(id, 'refunded');

/** Pagamentos de um cliente */
export const getClientPayments = (clientId: string, limit = 50) =>
  queryPayments({ client_id: clientId, limit });

/** Pagamentos de uma barbearia por período */
export const getBarbershopPayments = (barbershopId: string, startDate: Date, endDate: Date) =>
  queryPayments({ barbershop_id: barbershopId, startDate, endDate });

/** Pagamentos pendentes */
export const getPendingPayments = () => queryPayments({ status: 'pending', limit: 50 });

/** Pagamentos de hoje */
export function getTodayPayments(): Promise<Payment[]> {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return queryPayments({ startDate: start, endDate: end });
}

/** Estatísticas de pagamentos */
export async function getPaymentStats(barbershopId: string): Promise<PaymentStats> {
  try {
    const { data, error } = await (supabase as any)
      .from('payments').select('status, method, amount').eq('barbershop_id', barbershopId);
    if (error) throw error;

    const payments = data || [];
    const byMethod: Record<string, number> = {};
    let paidAmount = 0;

    payments.forEach((p: any) => {
      byMethod[p.method] = (byMethod[p.method] || 0) + 1;
      if (p.status === 'paid') paidAmount += Number(p.amount || 0);
    });

    return {
      total: payments.length,
      paid: payments.filter((p: any) => p.status === 'paid').length,
      pending: payments.filter((p: any) => p.status === 'pending').length,
      failed: payments.filter((p: any) => p.status === 'failed').length,
      totalAmount: payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
      paidAmount,
      byMethod,
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return { total: 0, paid: 0, pending: 0, failed: 0, totalAmount: 0, paidAmount: 0, byMethod: {} };
  }
}

/** Total de pagamentos pagos num período */
export async function getTotalPayments(barbershopId: string, startDate: Date, endDate: Date): Promise<number> {
  const payments = await queryPayments({ barbershop_id: barbershopId, status: 'paid', startDate, endDate });
  return payments.reduce((s, p) => s + Number(p.amount || 0), 0);
}
