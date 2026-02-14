/**
 * Affiliate Tracking - Cookie 30d + ?ref=CODE
 */

const COOKIE_NAME = "sc_ref";
const COOKIE_DAYS = 30;

/**
 * Captura ?ref=CODE da URL e salva em cookie
 */
export function captureReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    setReferralCookie(ref);
    return ref;
  }

  return getReferralCode();
}

/**
 * Salva referral code em cookie (30 dias)
 */
function setReferralCookie(code: string) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Lê referral code do cookie
 */
export function getReferralCode(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Remove cookie de referral
 */
export function clearReferralCode() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Gera link de afiliado
 */
export function generateAffiliateLink(referralCode: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/?ref=${encodeURIComponent(referralCode)}`;
}
