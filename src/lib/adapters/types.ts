/**
 * Adapter Interfaces - Abstração de provedores externos
 * REGRA: Nunca chamar provedor direto na lógica de negócio
 */

// ============================================
// STANDARD EVENTS
// ============================================

export const STANDARD_EVENTS = {
  // User events
  'user.created': { label: 'Usuário Criado', category: 'user' },
  'user.phone_verified': { label: 'Telefone Verificado', category: 'user' },

  // Booking events
  'booking.created': { label: 'Agendamento Criado', category: 'booking' },
  'booking.confirmed': { label: 'Agendamento Confirmado', category: 'booking' },
  'booking.canceled': { label: 'Agendamento Cancelado', category: 'booking' },
  'booking.completed': { label: 'Atendimento Concluído', category: 'booking' },

  // Payment events
  'payment.created': { label: 'Pagamento Criado', category: 'payment' },
  'payment.approved': { label: 'Pagamento Aprovado', category: 'payment' },
  'payment.failed': { label: 'Pagamento Falhou', category: 'payment' },

  // Affiliate events
  'affiliate.sale': { label: 'Venda de Afiliado', category: 'affiliate' },
  'affiliate.commission_generated': { label: 'Comissão Gerada', category: 'affiliate' },
  'affiliate.payout_requested': { label: 'Saque Solicitado', category: 'affiliate' },

  // Salon events
  'salon.created': { label: 'Salão Criado', category: 'salon' },
  'salon.subscription_paid': { label: 'Assinatura Paga', category: 'salon' },
  'salon.subscription_failed': { label: 'Assinatura Falhou', category: 'salon' },
} as const;

export type StandardEvent = keyof typeof STANDARD_EVENTS;

export const STANDARD_EVENT_LIST = Object.entries(STANDARD_EVENTS).map(([key, val]) => ({
  event: key as StandardEvent,
  ...val,
}));

// ============================================
// PIXEL EVENTS
// ============================================

export const PIXEL_EVENTS = [
  'booking_created',
  'booking_paid',
  'signup',
  'subscription_paid',
] as const;

export type PixelEvent = typeof PIXEL_EVENTS[number];

// ============================================
// QR CODE TYPES
// ============================================

export type QrType = 'payment' | 'checkin' | 'salon_link' | 'affiliate_link' | 'loyalty';

export interface QrPayload {
  type: QrType;
  entity_id: string;
  hash: string;
  expires_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// PAYMENT ADAPTER
// ============================================

export interface ChargeRequest {
  customer_id: string;
  amount: number;
  description: string;
  billing_type: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  due_date?: string;
  external_reference?: string;
  split?: SplitRule[];
}

export interface SplitRule {
  wallet_id: string;
  fixed_value?: number;
  percentage_value?: number;
}

export interface ChargeResult {
  payment_id: string;
  status: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  payment_link?: string;
  invoice_url?: string;
}

export interface PaymentAdapter {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  getPayment(paymentId: string): Promise<ChargeResult>;
  refund(paymentId: string, amount?: number): Promise<boolean>;
}

// ============================================
// SMS ADAPTER
// ============================================

export interface SmsRequest {
  to: string;
  body: string;
}

export interface OtpRequest {
  to: string;
  code: string;
  template?: string;
  expiration_minutes?: number;
}

export interface SmsAdapter {
  sendSms(request: SmsRequest): Promise<boolean>;
  sendOtp(request: OtpRequest): Promise<boolean>;
}

// ============================================
// PIXEL ADAPTER
// ============================================

export interface PixelTrackRequest {
  event: PixelEvent;
  data?: Record<string, unknown>;
  user_id?: string;
}

export interface PixelAdapter {
  track(request: PixelTrackRequest): void;
  trackServerSide(request: PixelTrackRequest): Promise<void>;
}

// ============================================
// WEBHOOK DISPATCHER
// ============================================

export interface WebhookDispatchRequest {
  event: StandardEvent;
  payload: Record<string, unknown>;
}

export interface WebhookDispatcher {
  dispatch(request: WebhookDispatchRequest): Promise<void>;
}

// ============================================
// NFC PAYMENT
// ============================================

export interface NfcPaymentRequest {
  amount: number;
  description: string;
  booking_id?: string;
}

export interface NfcPaymentResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}
