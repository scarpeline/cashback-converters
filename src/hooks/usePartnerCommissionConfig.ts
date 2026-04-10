// Hook para configurações de comissão de parceiros
// Busca do banco ou retorna defaults hardcoded

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerCommissionConfig {
  // Afiliado
  comissao_adesao_afiliado: number;       // % sobre adesão
  comissao_recorrente_afiliado: number;   // % sobre mensalidade recorrente
  // Franqueado
  comissao_adesao_franqueado: number;
  comissao_recorrente_franqueado: number;
  // Diretor
  comissao_adesao_diretor: number;
  comissao_recorrente_diretor: number;
  // Preços de upgrade
  preco_franqueado: number;
  preco_diretor: number;
  // Valor base de adesão e mensalidade
  valor_adesao: number;
  valor_mensalidade: number;
}

const DEFAULTS: PartnerCommissionConfig = {
  comissao_adesao_afiliado: 60,
  comissao_recorrente_afiliado: 20,
  comissao_adesao_franqueado: 30,
  comissao_recorrente_franqueado: 10,
  comissao_adesao_diretor: 15,
  comissao_recorrente_diretor: 5,
  preco_franqueado: 3000,
  preco_diretor: 10000,
  valor_adesao: 497,
  valor_mensalidade: 197,
};

export function usePartnerCommissionConfig(): {
  config: PartnerCommissionConfig;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['partner-commission-config'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('partner_commission_config')
          .select('*')
          .maybeSingle();
        if (error || !data) return null;
        return data as PartnerCommissionConfig;
      } catch {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    config: data ? { ...DEFAULTS, ...data } : DEFAULTS,
    isLoading,
  };
}
