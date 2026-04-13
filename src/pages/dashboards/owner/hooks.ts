import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useBarbershop() {
  const { user } = useAuth();
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBarbershop(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("barbershops")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
      
    if (error) {
      console.error("[DONO] barbershop error:", error.message);
      setBarbershop(null);
      setLoading(false);
      return;
    }
    setBarbershop(data?.[0] ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { barbershop, loading, refetch };
}

export function useServices(barbershopId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetch = useCallback(async () => {
    if (!barbershopId) { setServices([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("services").select("*").eq("barbershop_id", barbershopId).eq("is_active", true);
    setServices(data || []);
    setLoading(false);
  }, [barbershopId]);
  
  useEffect(() => { fetch(); }, [fetch]);
  return { services, loading, refetch: fetch };
}

export function useProfessionals(barbershopId: string | undefined) {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetch = useCallback(async () => {
    if (!barbershopId) { setProfessionals([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("professionals").select("*").eq("barbershop_id", barbershopId).eq("is_active", true);
    setProfessionals(data || []);
    setLoading(false);
  }, [barbershopId]);
  
  useEffect(() => { fetch(); }, [fetch]);
  return { professionals, loading, refetch: fetch };
}

export function useAppointments(barbershopId: string | undefined) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetch = useCallback(async () => {
    if (!barbershopId) { setAppointments([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("appointments")
      .select("*, services(name, price, duration_minutes), professionals(name)")
      .eq("barbershop_id", barbershopId)
      .order("scheduled_at", { ascending: true });
    setAppointments(data || []);
    setLoading(false);
  }, [barbershopId]);
  
  useEffect(() => { fetch(); }, [fetch]);
  
  return { appointments, loading, refetch: fetch };
}
