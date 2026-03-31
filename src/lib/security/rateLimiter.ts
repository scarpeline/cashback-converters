/**
 * Rate Limiter — client-side (complementa o rate limit do Supabase/Edge)
 * Previne brute-force em login, signup e operações sensíveis
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const CONFIGS: Record<string, RateLimitConfig> = {
  login:        { maxAttempts: 5,  windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 },
  signup:       { maxAttempts: 3,  windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  passwordReset:{ maxAttempts: 3,  windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  api:          { maxAttempts: 30, windowMs:  1 * 60 * 1000, blockDurationMs:  5 * 60 * 1000 },
  whatsapp:     { maxAttempts: 10, windowMs:  1 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 },
};

export function checkRateLimit(action: keyof typeof CONFIGS, identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs?: number;
} {
  const config = CONFIGS[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  // Blocked?
  if (entry?.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      return { allowed: false, remainingAttempts: 0, retryAfterMs: entry.blockedUntil - now };
    }
    // Block expired — reset
    store.delete(key);
  }

  // Window expired — reset
  if (entry && now - entry.firstAttempt > config.windowMs) {
    store.delete(key);
  }

  const current = store.get(key) ?? { count: 0, firstAttempt: now, blocked: false };
  current.count += 1;
  store.set(key, current);

  if (current.count > config.maxAttempts) {
    current.blocked = true;
    current.blockedUntil = now + config.blockDurationMs;
    store.set(key, current);
    return { allowed: false, remainingAttempts: 0, retryAfterMs: config.blockDurationMs };
  }

  return { allowed: true, remainingAttempts: config.maxAttempts - current.count };
}

export function resetRateLimit(action: keyof typeof CONFIGS, identifier: string): void {
  store.delete(`${action}:${identifier}`);
}
