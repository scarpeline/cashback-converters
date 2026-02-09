/**
 * Auth Debug Logger - SALÃO CASHBACK
 * Sistema de logs para debug de autenticação, rotas e sessão
 * 
 * LOGS OBRIGATÓRIOS:
 * - Erro de auth
 * - Falha de redirect
 * - Sessão expirada
 */

const IS_DEV = import.meta.env.DEV;

type LogLevel = 'info' | 'warn' | 'error';

interface AuthLogData {
  token_existe?: boolean;
  token_valido?: boolean;
  role_detectado?: string | null;
  user_id?: string;
  [key: string]: unknown;
}

interface RouteLogData {
  rota?: string;
  existe?: boolean;
  perfil_permitido?: boolean;
  from?: string;
  to?: string;
  motivo?: string;
  [key: string]: unknown;
}

interface SessionLogData {
  storage?: 'ok' | 'error';
  expires_at?: string;
  is_valid?: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface LoadLogData {
  status?: 'aguardando_auth' | 'liberado' | 'timeout';
  duration_ms?: number;
  [key: string]: unknown;
}

// Sanitize data for production - remove sensitive info
function sanitizeForProduction(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  // Remove potentially sensitive fields in production
  delete sanitized.user_id;
  delete sanitized.token;
  delete sanitized.session;
  return sanitized;
}

function log(tag: string, data: Record<string, unknown>, level: LogLevel = 'info') {
  const timestamp = new Date().toISOString();
  const displayData = IS_DEV ? data : sanitizeForProduction(data);
  
  const logMessage = `[${tag}] ${timestamp}`;
  const logData = Object.keys(displayData).length > 0 ? displayData : undefined;

  switch (level) {
    case 'error':
      console.error(logMessage, logData || '');
      break;
    case 'warn':
      console.warn(logMessage, logData || '');
      break;
    default:
      console.log(logMessage, logData || '');
  }
}

// ============================================
// AUTH LOGGING
// ============================================

export function logAuthStart(data: AuthLogData) {
  log('AUTH_START', data, 'info');
}

export function logAuthValidate(data: AuthLogData) {
  log('AUTH_VALIDATE', data, data.token_valido === false ? 'warn' : 'info');
}

export function logAuthRole(data: AuthLogData) {
  log('AUTH_ROLE', data, data.role_detectado ? 'info' : 'warn');
}

export function logAuthError(message: string, data?: Record<string, unknown>) {
  log('ERROR_AUTH', { message, ...data }, 'error');
}

export function logAuthSuccess(data: AuthLogData) {
  log('AUTH_SUCCESS', data, 'info');
}

// ============================================
// ROUTE LOGGING
// ============================================

export function logRouteCheck(data: RouteLogData) {
  const level = data.existe === false || data.perfil_permitido === false ? 'warn' : 'info';
  log('ROUTE_CHECK', data, level);
}

export function logRedirectCheck(data: RouteLogData) {
  log('REDIRECT', data, 'info');
}

export function logRedirectError(message: string, data?: Record<string, unknown>) {
  log('ERROR_REDIRECT', { message, ...data }, 'error');
}

export function logRouteError(message: string, data?: Record<string, unknown>) {
  log('ERROR_ROUTE', { message, ...data }, 'error');
}

// ============================================
// SESSION LOGGING
// ============================================

export function logSessionCheck(data: SessionLogData) {
  const level = data.storage === 'error' || data.is_valid === false ? 'warn' : 'info';
  log('SESSION_CHECK', data, level);
}

export function logSessionExpired(data: SessionLogData) {
  log('SESSION_EXPIRED', { ...data, reason: 'token_expired' }, 'warn');
}

export function logSessionRefresh(success: boolean) {
  log('SESSION_REFRESH', { success }, success ? 'info' : 'error');
}

export function logSessionDestroyed(reason: string) {
  log('SESSION_DESTROYED', { reason }, 'warn');
}

// ============================================
// FIRST LOAD LOGGING
// ============================================

export function logFirstLoad(data: LoadLogData) {
  log('FIRST_LOAD', data, 'info');
}

export function logLoadError(message: string, data?: Record<string, unknown>) {
  log('ERROR_LOAD', { message, ...data }, 'error');
}

export function logLoadComplete(data: LoadLogData) {
  log('LOAD_COMPLETE', data, 'info');
}

// ============================================
// ROLE LOGGING
// ============================================

export function logRoleAssignment(userId: string, role: string, success: boolean) {
  log('ROLE_ASSIGNMENT', { user_id: userId, role, success }, success ? 'info' : 'error');
}

export function logRoleBootstrap(userId: string, role: string | null) {
  log('ROLE_BOOTSTRAP', { user_id: userId, role_assigned: role }, role ? 'info' : 'warn');
}

// ============================================
// DEBUG SUMMARY
// ============================================

export function logDebugSummary(context: string, data: Record<string, unknown>) {
  if (IS_DEV) {
    console.group(`[DEBUG_SUMMARY] ${context}`);
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${key}:`, value);
    });
    console.groupEnd();
  }
}

// ============================================
// ERROR TRACKING
// ============================================

export function logCriticalError(context: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  log('CRITICAL_ERROR', { 
    context, 
    message: errorMessage, 
    stack: IS_DEV ? errorStack : undefined 
  }, 'error');
}
