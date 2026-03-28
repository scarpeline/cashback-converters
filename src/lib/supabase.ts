/**
 * Re-export do Supabase client para compatibilidade com services legados
 * (commissionService, activityService, etc.)
 */
import { supabase } from "@/integrations/supabase/client";

export function createClient() {
  return supabase;
}

export { supabase };
