/**
 * Session Validator
 * Validação de sessão e token
 */

import { Session } from "@supabase/supabase-js";
import { logSessionCheck } from "./auth-logger";

interface SessionValidationResult {
  isValid: boolean;
  hasToken: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  reason?: string;
}

/**
 * Valida se a sessão é válida e não está expirada
 */
export function validateSession(session: Session | null): SessionValidationResult {
  if (!session) {
    logSessionCheck({ storage: 'ok', is_valid: false });
    return {
      isValid: false,
      hasToken: false,
      isExpired: false,
      expiresAt: null,
      reason: 'no_session',
    };
  }

  const hasToken = !!session.access_token;
  
  if (!hasToken) {
    logSessionCheck({ storage: 'error', is_valid: false });
    return {
      isValid: false,
      hasToken: false,
      isExpired: false,
      expiresAt: null,
      reason: 'no_token',
    };
  }

  // Check expiration
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  if (isExpired) {
    logSessionCheck({ 
      storage: 'ok', 
      is_valid: false, 
      expires_at: expiresAt?.toISOString() || 'unknown' 
    });
    return {
      isValid: false,
      hasToken: true,
      isExpired: true,
      expiresAt: expiresAt?.toISOString() || null,
      reason: 'token_expired',
    };
  }

  logSessionCheck({ 
    storage: 'ok', 
    is_valid: true, 
    expires_at: expiresAt?.toISOString() || 'valid' 
  });

  return {
    isValid: true,
    hasToken: true,
    isExpired: false,
    expiresAt: expiresAt?.toISOString() || null,
  };
}

/**
 * Verifica se o token no localStorage está presente
 */
export function checkLocalStorageToken(): boolean {
  try {
    const supabaseKey = Object.keys(localStorage).find(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );
    
    if (!supabaseKey) return false;
    
    const tokenData = localStorage.getItem(supabaseKey);
    return !!tokenData;
  } catch {
    return false;
  }
}

/**
 * Remove o token do localStorage (para logout)
 */
export function clearLocalStorageToken(): void {
  try {
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') && key.includes('auth')
    );
    supabaseKeys.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}
