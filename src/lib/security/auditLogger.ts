/**
 * Audit Logger — registra ações sensíveis para rastreabilidade
 */
import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT"
  | "SIGNUP" | "PASSWORD_RESET"
  | "ROLE_CHANGE" | "PROFILE_UPDATE"
  | "PAYMENT_INITIATED" | "PAYMENT_CONFIRMED"
  | "DATA_EXPORT" | "ADMIN_ACTION"
  | "RATE_LIMIT_HIT" | "UNAUTHORIZED_ACCESS";

interface AuditEntry {
  action: AuditAction;
  userId?: string;
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    // Log local em dev
    if (import.meta.env.DEV) {
      const icon = entry.severity === "critical" ? "🚨" : entry.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`${icon} [AUDIT] ${entry.action}`, entry.metadata ?? "");
    }

    // Em produção, persiste no Supabase
    if (import.meta.env.PROD) {
      await (supabase as any).from("audit_logs").insert({
        action: entry.action,
        user_id: entry.userId ?? null,
        metadata: entry.metadata ?? {},
        severity: entry.severity,
        ip_hint: navigator.userAgent.slice(0, 100),
        created_at: new Date().toISOString(),
      });
    }
  } catch {
    // Nunca deixar o audit log quebrar a aplicação
  }
}

/** Atalhos para ações comuns */
export const audit = {
  loginSuccess: (userId: string) =>
    auditLog({ action: "LOGIN_SUCCESS", userId, severity: "info" }),

  loginFailed: (identifier: string) =>
    auditLog({ action: "LOGIN_FAILED", metadata: { identifier }, severity: "warning" }),

  logout: (userId: string) =>
    auditLog({ action: "LOGOUT", userId, severity: "info" }),

  rateLimitHit: (action: string, identifier: string) =>
    auditLog({ action: "RATE_LIMIT_HIT", metadata: { action, identifier }, severity: "warning" }),

  unauthorizedAccess: (userId: string, path: string) =>
    auditLog({ action: "UNAUTHORIZED_ACCESS", userId, metadata: { path }, severity: "critical" }),

  adminAction: (userId: string, description: string) =>
    auditLog({ action: "ADMIN_ACTION", userId, metadata: { description }, severity: "warning" }),

  profileUpdate: (userId: string) =>
    auditLog({ action: "PROFILE_UPDATE", userId, severity: "info" }),
};
