import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCallback } from "react";

export const useAuditLog = (barbershopId: string) => {
  const { user } = useAuth();

  const logAction = useCallback(async (
    action: 'LOGIN' | 'EXPORT' | 'DELETE' | 'SETTINGS_CHANGE' | 'SENSITIVE_ACCESS',
    tableName?: string,
    recordId?: string,
    newData?: any,
    oldData?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("audit_logs")
        .insert({
          user_id: user.id,
          barbershop_id: barbershopId,
          action,
          table_name: tableName,
          record_id: recordId,
          new_data: newData || {},
          old_data: oldData || {},
          user_agent: navigator.userAgent,
        });
        
      if (error) console.error("Erro ao gravar log de auditoria:", error);
    } catch (e) {
      console.error("Erro no sistema de auditoria:", e);
    }
  }, [user, barbershopId]);

  return { logAction };
};
