/**
 * Hook central para configuração de planos por profissional.
 * Fonte única de verdade — sincroniza Super Admin, Landing Page, Comissões e Gateway.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfPlanConfig {
  professionals: number;
  label: string;           // "1 Profissional"
  monthly: number;         // preço mensal
  semiannual: number;      // preço semestral total
  annual: number;          // preço anual total
  popular: boolean;
  color: string;           // classe tailwind bg-*
  textColor: string;       // classe tailwind text-*
  asaas_monthly_id?: string;
  asaas_annual_id?: string;
}

export interface ProfPlansConfig {
  trial_days: number;
  plans: ProfPlanConfig[];
  features: string[];      // funcionalidades iguais para todos
}

export const DEFAULT_PROF_PLANS: ProfPlansConfig = {
  trial_days: 14,
  plans: [
    { professionals: 1,  label: "1 Profissional",   monthly: 19.90, semiannual: 109.90, annual: 199.90, popular: false, color: "bg-orange-500", textColor: "text-orange-600" },
    { professionals: 2,  label: "2 Profissionais",  monthly: 29.90, semiannual: 169.90, annual: 299.90, popular: false, color: "bg-blue-500",   textColor: "text-blue-600" },
    { professionals: 5,  label: "5 Profissionais",  monthly: 49.90, semiannual: 269.90, annual: 479.90, popular: true,  color: "bg-green-500", textColor: "text-green-600" },
    { professionals: 10, label: "10 Profissionais", monthly: 79.90, semiannual: 429.90, annual: 799.90, popular: false, color: "bg-purple-500", textColor: "text-purple-600" },
  ],
  features: [
    "14 dias grátis para testar",
    "Agendamentos ilimitados",
    "Cobrança PIX na Agenda Online",
    "Ficha de Anamnese e Contratos",
    "Gestão de Pacotes Inteligente",
    "Assinatura Eletrônica",
    "Fluxo de Caixa",
    "Controle de Estoque",
    "Contas a Pagar e a Receber",
    "Emissão de Boletos Bancários",
    "Cálculo de Comissão Detalhada",
    "Relatórios Gerenciais e Gráficos",
    "Controle de Caixa por Profissional",
    "Permissão de Acesso por Profissional",
    "WhatsApp, SMS e E-mail Automático",
    "Confirmação/Cancelamento via WhatsApp",
    "Ranking de Clientes",
    "Cashback Automatizado",
    "Sistema de Afiliados",
  ],
};

const SERVICE_NAME = "prof_plans_config";

export async function fetchProfPlansConfig(): Promise<ProfPlansConfig> {
  const { data } = await (supabase as any)
    .from("integration_settings")
    .select("base_url")
    .eq("service_name", SERVICE_NAME)
    .maybeSingle();
  if (data?.base_url) {
    try {
      const parsed = JSON.parse(data.base_url);
      return { ...DEFAULT_PROF_PLANS, ...parsed };
    } catch { /* fallback */ }
  }
  return DEFAULT_PROF_PLANS;
}

export async function saveProfPlansConfig(config: ProfPlansConfig): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("integration_settings")
    .upsert(
      { service_name: SERVICE_NAME, environment: "production", is_active: true, base_url: JSON.stringify(config) },
      { onConflict: "service_name,environment" }
    );
  return !error;
}

export function useProfessionalPlansConfig(): ProfPlansConfig {
  const { data } = useQuery({
    queryKey: ["prof_plans_config"],
    queryFn: fetchProfPlansConfig,
    staleTime: 2 * 60 * 1000,
  });
  return data ?? DEFAULT_PROF_PLANS;
}
