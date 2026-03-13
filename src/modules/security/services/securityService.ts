/**
 * Módulo de Segurança — Service
 * Detecção de tentativas de invasão, brute force, SQL injection, XSS, abuso de API
 */

import { supabase } from '@/integrations/supabase/client';
import type { SecurityLog, SecurityEventType, SecuritySeverity, SecurityScanResult } from '../types';

// ==================== RATE LIMITER ====================

const rateLimitStore: Record<string, { count: number; windowStart: number }> = {};

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  'login': { max: 5, windowMs: 60_000 },        // 5 tentativas por minuto
  'api_call': { max: 100, windowMs: 60_000 },    // 100 req/min
  'password_reset': { max: 3, windowMs: 300_000 }, // 3 por 5min
  'signup': { max: 3, windowMs: 600_000 },         // 3 por 10min
};

export function checkRateLimit(key: string, endpoint: string): boolean {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['api_call'];
  const now = Date.now();
  const storeKey = `${key}:${endpoint}`;

  if (!rateLimitStore[storeKey] || now - rateLimitStore[storeKey].windowStart > config.windowMs) {
    rateLimitStore[storeKey] = { count: 1, windowStart: now };
    return true;
  }

  rateLimitStore[storeKey].count++;

  if (rateLimitStore[storeKey].count > config.max) {
    logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      severity: 'medium',
      endpoint,
      details: { key, count: rateLimitStore[storeKey].count, max: config.max },
      blocked: true,
    });
    return false;
  }

  return true;
}

// ==================== DETECÇÃO DE PADRÕES ====================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
  /(-{2}|\/\*|\*\/|;)/,
  /(('|")(\s)*(OR|AND)(\s)*('|")\s*=\s*('|"))/i,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
];

const XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on(error|load|click|mouse|focus|blur)\s*=/i,
  /<iframe/i,
  /<img.*onerror/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
];

export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function detectXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateInputSecurity(input: string, fieldName: string): { safe: boolean; threats: string[] } {
  const threats: string[] = [];

  if (detectSqlInjection(input)) {
    threats.push('sql_injection');
    logSecurityEvent({
      event_type: 'sql_injection',
      severity: 'critical',
      details: { field: fieldName, input_preview: input.substring(0, 50) },
      blocked: true,
    });
  }

  if (detectXss(input)) {
    threats.push('xss_attempt');
    logSecurityEvent({
      event_type: 'xss_attempt',
      severity: 'high',
      details: { field: fieldName, input_preview: input.substring(0, 50) },
      blocked: true,
    });
  }

  return { safe: threats.length === 0, threats };
}

// ==================== DETECÇÃO DE BRUTE FORCE ====================

const loginAttempts: Record<string, { count: number; firstAttempt: number; locked: boolean }> = {};
const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_WINDOW_MS = 300_000; // 5 minutos
const LOCK_DURATION_MS = 900_000; // 15 minutos

export function checkBruteForce(identifier: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = loginAttempts[identifier];

  if (!record || now - record.firstAttempt > BRUTE_FORCE_WINDOW_MS) {
    loginAttempts[identifier] = { count: 1, firstAttempt: now, locked: false };
    return { allowed: true, remainingAttempts: BRUTE_FORCE_THRESHOLD - 1 };
  }

  if (record.locked && now - record.firstAttempt < LOCK_DURATION_MS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  if (record.locked && now - record.firstAttempt >= LOCK_DURATION_MS) {
    loginAttempts[identifier] = { count: 1, firstAttempt: now, locked: false };
    return { allowed: true, remainingAttempts: BRUTE_FORCE_THRESHOLD - 1 };
  }

  record.count++;

  if (record.count >= BRUTE_FORCE_THRESHOLD) {
    record.locked = true;
    logSecurityEvent({
      event_type: 'brute_force',
      severity: 'high',
      details: { identifier, attempts: record.count },
      blocked: true,
    });
    return { allowed: false, remainingAttempts: 0 };
  }

  return { allowed: true, remainingAttempts: BRUTE_FORCE_THRESHOLD - record.count };
}

export function registerLoginAttempt(identifier: string, success: boolean): void {
  if (success) {
    delete loginAttempts[identifier];
  } else {
    checkBruteForce(identifier);
  }
}

// ==================== DETECÇÃO DE LOGIN SUSPEITO ====================

export function detectSuspiciousLogin(params: {
  userId: string;
  currentIp?: string;
  currentUserAgent?: string;
  previousIp?: string;
  previousUserAgent?: string;
}): boolean {
  const { userId, currentIp, currentUserAgent, previousIp, previousUserAgent } = params;

  const suspicious =
    (previousIp && currentIp && previousIp !== currentIp) ||
    (previousUserAgent && currentUserAgent && previousUserAgent !== currentUserAgent);

  if (suspicious) {
    logSecurityEvent({
      event_type: 'suspicious_login',
      severity: 'medium',
      user_id: userId,
      source_ip: currentIp,
      user_agent: currentUserAgent,
      details: { previousIp, previousUserAgent },
      blocked: false,
    });
  }

  return !!suspicious;
}

// ==================== LOGGING ====================

export async function logSecurityEvent(event: Omit<SecurityLog, 'id' | 'created_at'>): Promise<void> {
  try {
    // Usa RPC para inserir no security_logs (se a tabela existir)
    const { error } = await supabase.from('security_logs' as any).insert({
      event_type: event.event_type,
      severity: event.severity,
      source_ip: event.source_ip || null,
      user_id: event.user_id || null,
      user_agent: event.user_agent || null,
      endpoint: event.endpoint || null,
      details: event.details || {},
      fingerprint: event.fingerprint || null,
      blocked: event.blocked,
    });

    if (error) {
      console.warn('[SecurityService] Erro ao logar evento de segurança:', error.message);
    }
  } catch (err) {
    console.error('[SecurityService] Falha crítica ao logar evento:', err);
  }
}

// ==================== CONSULTA DE LOGS ====================

export async function getSecurityLogs(params?: {
  severity?: SecuritySeverity;
  event_type?: SecurityEventType;
  limit?: number;
}): Promise<SecurityLog[]> {
  try {
    let query = supabase
      .from('security_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params?.limit || 50);

    if (params?.severity) {
      query = query.eq('severity', params.severity);
    }
    if (params?.event_type) {
      query = query.eq('event_type', params.event_type);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[SecurityService] Erro ao buscar logs:', error.message);
      return [];
    }

    return (data || []) as SecurityLog[];
  } catch (err) {
    console.error('[SecurityService] Falha ao buscar logs:', err);
    return [];
  }
}

// ==================== SCAN DE VULNERABILIDADES ====================

export async function runVulnerabilityScan(): Promise<SecurityScanResult> {
  const findings: SecurityScanResult['findings'] = [];

  // Verificar se RLS está ativo em tabelas críticas (check via client)
  // Nota: verificações reais rodariam no backend/edge function
  findings.push({
    type: 'info',
    severity: 'low',
    description: 'Verificação de segurança do frontend concluída.',
    recommendation: 'Para scan completo do BD, execute via edge function.',
    auto_fixable: false,
  });

  return {
    id: crypto.randomUUID(),
    scan_type: 'frontend_security_check',
    findings,
    status: 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
}
