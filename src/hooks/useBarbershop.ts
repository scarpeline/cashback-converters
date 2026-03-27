import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

interface Barbershop {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  owner_user_id: string;
  cashback_percentage: number | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  affiliate_commission_pct: number | null;
  affiliate_auto_pay: boolean | null;
  affiliate_reward_type: string | null;
  asaas_customer_id: string | null;
  asaas_wallet_id: string | null;
  automation_schedule: any;
  sector: string | null;
  created_at: string;
  updated_at: string;
}

export function useBarbershop() {
  const { user } = useAuth();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBarbershop = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("barbershops")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setBarbershop(data as Barbershop);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbershop();
  }, [user]);

  const updateBarbershop = async (updates: Partial<Barbershop>) => {
    if (!barbershop?.id) return { success: false, error: 'Barbearia não encontrada' };

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("barbershops")
        .update(updates)
        .eq("id", barbershop.id);

      if (error) throw error;
      
      setBarbershop((prev) => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar barbearia:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { barbershop, loading, refetch: fetchBarbershop, updateBarbershop };
}
