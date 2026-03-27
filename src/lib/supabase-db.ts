// Untyped supabase client for tables/RPCs not yet in the schema
import { supabase } from "@/integrations/supabase/client";
export const db = supabase as any;
