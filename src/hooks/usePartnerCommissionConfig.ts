/**
 * Hook que busca a configuração completa de comissões de parceiros.
 * Sincroniza com config_comissoes + integration_settings do super admin.
 * Cache de 2 minutos — qualquer alteração no super admin reflete automaticamente.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Comissão escalonada por mês ─────────────────────────────────────────────
// Meses 1-4: alternado (pct_alto / pct_baixo / pct_alto / pct_baixo)
// Mês 5+: fixo (pct_fixo)
export interface ScaledCommission {
  pct_alto: number;   // % nos meses ímpares (1, 3) do período inicial
  pct_baixo: number;  // % nos meses pares (2, 4) do período inicial
  pct_fixo: number;   // % fixo do mês 5 em diante
  meses_escalonados: number; // quantos meses dura o período escalonado (padrão: 4)
}

// ─── Renovação de franqueado/diretor ─────────────────────────────────────────
export type RenewalType = "unico" | "anual" | "bienal";

export interface PartnerCommissionConfig {
  // Afiliado — comissão escalonada
  afiliado_adesao_pct: number;
  afiliado_escalonado: ScaledCommission;

  // Franqueado — comissão escalonada
  franqueado_adesao_pct: number;
  franqueado_escalonado: ScaledCommission;
  franqueado_renovacao: RenewalType;

  // Diretor — comissão escalonada
  diretor_afiliados_escalonado: ScaledCommission;
  diretor_franqueados_escalonado: ScaledCommission;
  diretor_renovacao: RenewalType;

  // Preços
  preco_franqueado: number;
  preco_diretor: number;
  preco_assinatura: number;
}

const DEFAULT_SCALED: ScaledCommission = {
  pct_alto: 25,
  pct_baixo: 15,
  pct_fixo: 10,
  meses_escalonados: 4,
};

export const DEFAULTS: PartnerCommissionConfig = {
  afiliado_adesao_pct: 50,
  afiliado_escalonado: { pct_alto: 25, pct_baixo: 15, pct_fixo: 10, meses_escalonados: 4 },
  franqueado_adesao_pct: 65,
  franqueado_escalonado: { pct_alto: 15, pct_baixo: 8, pct_fixo: 5, meses_escalonados: 4 },
  franqueado_renovacao: "anual",
  diretor_afiliados_escalonado: { pct_alto: 15, pct_baixo: 10, pct_fixo: 7, meses_escalonados: 4 },
  diretor_franqueados_escalonado: { pct_alto: 10, pct_baixo: 6, pct_fixo: 4, meses_escalonados: 4 },
  diretor_renovacao: "anual",
  preco_franqueado: 997,
  preco_diretor: 2997,
  preco_assinatura: 97,
};

/**
 * Calcula o % de comissão para um mês específico baseado na regra escalonada.
 * Mês 1 = índice 1 (começa em 1)
 */
export function getCommissionForMonth(scaled: ScaledCommission, month: number): number {
  if (month <= scaled.meses_escalonados) {
    // Alterna: ímpar = alto, par = baixo
    return month % 2 !== 0 ? scaled.pct_alto : scaled.pct_baixo;
  }
  return scaled.pct_fixo;
}

/**
 * Calcula o total de comissão para N meses com regra escalonada.
 */
export function calcTotalCommission(
  scaled: ScaledCommission,
  totalMonths: number,
  monthlyBase: number
): number {
  let total = 0;
  for (let m = 1; m <= totalMonths; m++) {
    total += monthlyBase * (getCommissionForMonth(scaled, m) / 100);
  }
  return total;
}

export function usePartnerCommissionConfig(): PartnerCommissionConfig {
  const { data } = useQuery({
    queryKey: ["partner_commission_config_v2"],
    queryFn: async () => {
      // Buscar config_comissoes
      const { data: rows } = await (supabase as any)
        .from("config_comissoes")
        .select("tipo_parceria, tipo_comissao, percentual_padrao, regras")
        .eq("ativo", true);

      // Buscar integration_settings
      const { data: settings } = await (supabase as any)
        .from("integration_settings")
        .select("service_name, base_url")
        .in("service_name", [
          "preco_franqueado", "preco_diretor", "preco_assinatura",
          "franqueado_renovacao", "diretor_renovacao",
          "afiliado_escalonado", "franqueado_escalonado",
          "diretor_afiliados_escalonado", "diretor_franqueados_escalonado",
        ]);

      const map: Record<string, any> = {};
      (rows || []).forEach((r: any) => {
        map[`${r.tipo_parceria}__${r.tipo_comissao}`] = r;
      });

      const sm: Record<string, string> = {};
      (settings || []).forEach((s: any) => { sm[s.service_name] = s.base_url; });

      const parseScaled = (key: string, def: ScaledCommission): ScaledCommission => {
        try { return sm[key] ? JSON.parse(sm[key]) : def; } catch { return def; }
      };

      return {
        afiliado_adesao_pct: map["afiliado__adesao"]?.percentual_padrao ?? DEFAULTS.afiliado_adesao_pct,
        afiliado_escalonado: parseScaled("afiliado_escalonado", DEFAULTS.afiliado_escalonado),
        franqueado_adesao_pct: map["franqueado__adesao"]?.percentual_padrao ?? DEFAULTS.franqueado_adesao_pct,
        franqueado_escalonado: parseScaled("franqueado_escalonado", DEFAULTS.franqueado_escalonado),
        franqueado_renovacao: (sm["franqueado_renovacao"] as RenewalType) || DEFAULTS.franqueado_renovacao,
        diretor_afiliados_escalonado: parseScaled("diretor_afiliados_escalonado", DEFAULTS.diretor_afiliados_escalonado),
        diretor_franqueados_escalonado: parseScaled("diretor_franqueados_escalonado", DEFAULTS.diretor_franqueados_escalonado),
        diretor_renovacao: (sm["diretor_renovacao"] as RenewalType) || DEFAULTS.diretor_renovacao,
        preco_franqueado: Number(sm["preco_franqueado"]) || DEFAULTS.preco_franqueado,
        preco_diretor: Number(sm["preco_diretor"]) || DEFAULTS.preco_diretor,
        preco_assinatura: Number(sm["preco_assinatura"]) || DEFAULTS.preco_assinatura,
      } as PartnerCommissionConfig;
    },
    staleTime: 2 * 60 * 1000,
  });

  return data ?? DEFAULTS;
}
