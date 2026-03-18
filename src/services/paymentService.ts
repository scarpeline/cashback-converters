// Serviço de Pagamentos
// Integração com Supabase e gateways de pagamento

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
  byMethod: Record<string, number>;
}

/**
 * Criar novo pagamento
 */
export async function createPayment(
  data: {
    barbershop_id: string;
    client_id: string;
    amount: number;
    method: Payment['method'];
    reference_id?: string;
    reference_type?: 'appointment' | 'subscription' | 'service';
  }
): Promise<Payment | null> {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        barbershop_id: data.barbershop_id,
        client_id: data.client_id,
        amount: data.amount,
        method: data.method,
        status: 'pending',
        asaas_payment_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pagamento:', error);
      return null;
    }

    return payment;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return null;
  }
}

/**
 * Confirmar pagamento
 */
export async function confirmPayment(
  paymentId: string,
  paidAt?: Date
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: paidAt?.toISOString(),
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Erro ao confirmar pagamento:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return false;
  }
}

/**
 * Falhar pagamento
 */
export async function failPayment(
  paymentId: string,
  reason: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Erro ao falhar pagamento:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao falhar pagamento:', error);
    return false;
  }
}

/**
 * Buscar pagamentos de um cliente
 */
export async function getClientPayments(
  clientId: string,
  limit: number = 50
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos de uma barbearia
 */
export async function getBarbershopPayments(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos pendentes
 */
export async function getPendingPayments(): Promise<Payment[]> {
  try {
    const hoje = new Date();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', hoje.toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    return [];
  }
}

/**
 * Buscar pagamentos de hoje
 */
export async function getTodayPayments(): Promise<Payment[]> {
  try {
    const hoje = new Date();
    const startOfDay = new Date(hoje);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(hoje);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos de hoje:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos de hoje:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por status
 */
export async function getPaymentsByStatus(status: Payment['status']): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por método
 */
export async function getPaymentsByMethod(method: Payment['method']): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('method', method)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Calcular estatísticas de pagamentos
 */
export async function getPaymentStats(barbershopId: string): Promise<PaymentStats> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status, method, amount')
      .eq('barbershop_id', barbershopId);

    if (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        paid: 0,
        pending: 0,
        failed: 0,
        byMethod: {},
      };
    }

    const payments = data || [];
    
    const total = payments.length;
    const paid = payments.filter((p: any) => p.status === 'paid').length;
    const pending = payments.filter((p: any) => p.status === 'pending').length;
    const failed = payments.filter((p: any) => p.status === 'failed').length;

    const byMethod: Record<string, number> = {};
    payments.forEach((p: any) => {
      byMethod[p.method] = (byMethod[p.method] || 0) + 1;
    });

    return {
      total,
      paid,
      pending,
      failed,
      byMethod,
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return {
      total: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      byMethod: {},
    };
  }
}

/**
 * Calcular total de pagamentos
 */
export async function getTotalPayments(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'paid');

    if (error) {
      console.error('Erro ao calcular total:', error);
      return 0;
    }

    return (data || []).reduce((acc, p: any) => acc + Number(p.amount), 0);
  } catch (error) {
    console.error('Erro ao calcular total:', error);
    return 0;
  }
}

/**
 * Buscar pagamentos recorrentes
 */
export async function getRecurringPayments(
  barbershopId: string,
  status: 'active' | 'cancelled' = 'active'
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos recorrentes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos recorrentes:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por cliente
 */
export async function getPaymentsByClient(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia e status
 */
export async function getBarbershopPaymentsByStatus(
  barbershopId: string,
  status: Payment['status']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia e método
 */
export async function getBarbershopPaymentsByMethod(
  barbershopId: string,
  method: Payment['method']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('method', method)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia, status e método
 */
export async function getBarbershopPaymentsByStatusAndMethod(
  barbershopId: string,
  status: Payment['status'],
  method: Payment['method']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', status)
      .eq('method', method)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia, data inicial e final
 */
export async function getBarbershopPaymentsByDateRange(
  barbershopId: string,
  startDate: Date,
  endDate: Date
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia, data inicial e final, e status
 */
export async function getBarbershopPaymentsByDateRangeAndStatus(
  barbershopId: string,
  startDate: Date,
  endDate: Date,
  status: Payment['status']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia, data inicial e final, e método
 */
export async function getBarbershopPaymentsByDateRangeAndMethod(
  barbershopId: string,
  startDate: Date,
  endDate: Date,
  method: Payment['method']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('method', method)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}

/**
 * Buscar pagamentos por barbearia, data inicial e final, status e método
 */
export async function getBarbershopPaymentsByDateRangeAndStatusAndMethod(
  barbershopId: string,
  startDate: Date,
  endDate: Date,
  status: Payment['status'],
  method: Payment['method']
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', status)
      .eq('method', method)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return [];
  }
}