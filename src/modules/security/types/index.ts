/**
 * Módulo de Segurança — Tipos
 */

export interface SecurityLog {
  id: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  source_ip?: string;
  user_id?: string;
  user_agent?: string;
  endpoint?: string;
  details?: Record<string, unknown>;
  fingerprint?: string;
  blocked: boolean;
  created_at: string;
}

export type SecurityEventType =
  | 'brute_force'
  | 'sql_injection'
  | 'xss_attempt'
  | 'api_abuse'
  | 'suspicious_login'
  | 'unauthorized_access'
  | 'rate_limit_exceeded'
  | 'db_change_detected'
  | 'admin_access'
  | 'vulnerability_scan';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityScanResult {
  id: string;
  scan_type: string;
  findings: SecurityFinding[];
  status: 'completed' | 'running' | 'failed';
  started_at: string;
  completed_at?: string;
}

export interface SecurityFinding {
  type: string;
  severity: SecuritySeverity;
  description: string;
  recommendation: string;
  auto_fixable: boolean;
}

export interface RateLimitConfig {
  endpoint: string;
  max_requests: number;
  window_seconds: number;
  block_duration_seconds: number;
}
