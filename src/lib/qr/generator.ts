/**
 * QR Code Generator - Multi-purpose
 * Gera QR para pagamento, checkin, link salão, afiliado, fidelidade
 */

import type { QrPayload, QrType } from "@/lib/adapters/types";

/**
 * Gera hash SHA-256 para o payload do QR
 */
async function generateHash(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16); // Short hash for QR
}

/**
 * Cria payload do QR code
 */
export async function createQrPayload(
  type: QrType,
  entityId: string,
  expiresInMinutes = 30,
  metadata?: Record<string, unknown>
): Promise<QrPayload> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
  const hashInput = `${type}:${entityId}:${expiresAt}:${Date.now()}`;
  const hash = await generateHash(hashInput);

  return {
    type,
    entity_id: entityId,
    hash,
    expires_at: expiresAt,
    metadata,
  };
}

/**
 * Serializa payload para string do QR
 */
export function serializeQrPayload(payload: QrPayload): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Desserializa string do QR para payload
 */
export function deserializeQrPayload(encoded: string): QrPayload | null {
  try {
    const decoded = atob(encoded);
    const payload = JSON.parse(decoded) as QrPayload;
    
    // Validar expiração
    if (new Date(payload.expires_at) < new Date()) {
      console.warn("[QR] QR code expired");
      return null;
    }

    return payload;
  } catch {
    console.error("[QR] Invalid QR payload");
    return null;
  }
}

/**
 * Gera URL do QR code usando API pública (Google Charts)
 */
export function getQrCodeImageUrl(data: string, size = 300): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

/**
 * Helpers para tipos específicos de QR
 */
export async function createPaymentQr(paymentId: string, amount: number) {
  return createQrPayload("payment", paymentId, 60, { amount });
}

export async function createCheckinQr(appointmentId: string) {
  return createQrPayload("checkin", appointmentId, 15);
}

export async function createSalonLinkQr(barbershopId: string, slug?: string) {
  return createQrPayload("salon_link", barbershopId, 525600, { slug }); // 1 year
}

export async function createAffiliateLinkQr(affiliateId: string, referralCode: string) {
  return createQrPayload("affiliate_link", affiliateId, 525600, { ref: referralCode });
}

export async function createLoyaltyQr(userId: string, barbershopId: string) {
  return createQrPayload("loyalty", userId, 10, { barbershop_id: barbershopId });
}
