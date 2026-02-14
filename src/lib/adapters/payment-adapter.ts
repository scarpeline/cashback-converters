/**
 * Payment Adapter - Abstração do gateway Asaas
 * Todas as chamadas de pagamento passam por aqui
 */

import { supabase } from "@/integrations/supabase/client";
import type { PaymentAdapter, ChargeRequest, ChargeResult } from "./types";

class AsaasPaymentAdapter implements PaymentAdapter {
  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: { action: "charge", ...request },
    });

    if (error) throw new Error(error.message || "Payment failed");
    return data as ChargeResult;
  }

  async getPayment(paymentId: string): Promise<ChargeResult> {
    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: { action: "get", payment_id: paymentId },
    });

    if (error) throw new Error(error.message || "Failed to get payment");
    return data as ChargeResult;
  }

  async refund(paymentId: string, amount?: number): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke("process-payment", {
      body: { action: "refund", payment_id: paymentId, amount },
    });

    if (error) return false;
    return data?.success ?? false;
  }
}

export const paymentAdapter: PaymentAdapter = new AsaasPaymentAdapter();
