/**
 * useSecurity — hook para verificações de segurança nos componentes
 * Uso: const { guardedAction, sanitize } = useSecurity()
 */
import { useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { checkRateLimit, sanitizeText, sanitizeObject, audit } from "@/lib/security";
import { toast } from "sonner";
import type { AppRole } from "@/lib/auth";

export function useSecurity() {
  const { user, hasRole } = useAuth();

  /**
   * Executa uma ação com rate limiting automático
   * @param action - chave de rate limit
   * @param fn - função a executar se permitido
   */
  const guardedAction = useCallback(
    async <T>(
      action: "login" | "signup" | "passwordReset" | "api" | "whatsapp",
      fn: () => Promise<T>
    ): Promise<T | null> => {
      const identifier = user?.email ?? user?.id ?? "anonymous";
      const rl = checkRateLimit(action, identifier);

      if (!rl.allowed) {
        const mins = Math.ceil((rl.retryAfterMs ?? 0) / 60000);
        toast.error(`Muitas tentativas. Aguarde ${mins} minuto(s).`);
        await audit.rateLimitHit(action, identifier);
        return null;
      }

      return fn();
    },
    [user]
  );

  /**
   * Verifica se o usuário tem a role necessária, registra acesso não autorizado
   */
  const requireRole = useCallback(
    (role: AppRole): boolean => {
      if (!hasRole(role)) {
        if (user) {
          void audit.unauthorizedAccess(user.id, window.location.pathname);
        }
        return false;
      }
      return true;
    },
    [hasRole, user]
  );

  /**
   * Sanitiza um campo de texto
   */
  const sanitize = useCallback((input: string) => sanitizeText(input), []);

  /**
   * Sanitiza um objeto inteiro
   */
  const sanitizeForm = useCallback(
    <T extends Record<string, unknown>>(obj: T): T => sanitizeObject(obj),
    []
  );

  return { guardedAction, requireRole, sanitize, sanitizeForm };
}
