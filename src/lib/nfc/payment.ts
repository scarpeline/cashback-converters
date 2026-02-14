/**
 * NFC Payment - Tap-to-pay
 * Verifica suporte do dispositivo e processa pagamento por aproximação
 */

import type { NfcPaymentRequest, NfcPaymentResult } from "@/lib/adapters/types";

/**
 * Verifica se o dispositivo suporta NFC / Web NFC API
 */
export function isNfcSupported(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

/**
 * Verifica se Payment Request API está disponível (para tap-to-pay)
 */
export function isPaymentRequestSupported(): boolean {
  return typeof window !== "undefined" && "PaymentRequest" in window;
}

/**
 * Processa pagamento por aproximação via Payment Request API
 */
export async function processNfcPayment(
  request: NfcPaymentRequest
): Promise<NfcPaymentResult> {
  if (!isPaymentRequestSupported()) {
    return { success: false, error: "Pagamento por aproximação não suportado neste dispositivo" };
  }

  try {
    // Configuração de método de pagamento (gateway via SDK)
    const methodData = [
      {
        supportedMethods: "basic-card",
        data: {
          supportedNetworks: ["visa", "mastercard", "elo"],
          supportedTypes: ["debit", "credit"],
        },
      },
    ];

    const details = {
      total: {
        label: request.description || "Pagamento Salão Cashback",
        amount: { currency: "BRL", value: request.amount.toFixed(2) },
      },
    };

    const paymentRequest = new PaymentRequest(methodData, details);
    const canMake = await paymentRequest.canMakePayment();

    if (!canMake) {
      return { success: false, error: "Nenhum método de pagamento disponível" };
    }

    const response = await paymentRequest.show();
    await response.complete("success");

    return {
      success: true,
      transaction_id: `nfc_${Date.now()}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pagamento cancelado";
    return { success: false, error: message };
  }
}
