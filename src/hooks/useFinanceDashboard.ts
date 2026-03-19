// Hook para Dashboard Financeiro
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export interface FinanceData {
  faturamento: number;
  previsao: number;
  comissoes: number;
  pagamentosPendentes: number;
  assinaturasAtivas: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'failed';
  description: string;
  created_at: string;
}

export interface Commission {
  id: string;
  partner_id: string;
  amount: number;
  type: 'adesao' | 'recorrente';
  status: 'pending' | 'paid';
  created_at: string;
}

// Chaves de query para cache
export const financeKeys = {
  all: ['finance'] as const,
  summary: () => [...financeKeys.all, 'summary'] as const,
  summaryPeriod: (period: string) => [...financeKeys.summary(), period] as const,
  transactions: () => [...financeKeys.all, 'transactions'] as const,
  commissions: () => [...financeKeys.all, 'commissions'] as const,
  partners: () => [...financeKeys.all, 'partners'] as const,
};

/**
 * Hook para dados financeiros resumidos
 */
export function useFinanceSummary(period: '7d' | '30d' | '90d' | '12m' = '30d') {
  const [data, setData] = useState<FinanceData>({
    faturamento: 0,
    previsao: 0,
    comissoes: 0,
    pagamentosPendentes: 0,
    assinaturasAtivas: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    
    try {
      const hoje = new Date();
      const dataInicio = new Date();
      
      switch (period) {
        case '7d':
          dataInicio.setDate(hoje.getDate() - 7);
          break;
        case '30d':
          dataInicio.setDate(hoje.getDate() - 30);
          break;
        case '90d':
          dataInicio.setDate(hoje.getDate() - 90);
          break;
        case '12m':
          dataInicio.setMonth(hoje.getMonth() - 12);
          break;
      }

      // Buscar pagamentos
      const { data: pagamentos, error: pagError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'paid');

      // Buscar assinaturas ativas
      const { data: assinaturas, error: subError } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('status', 'ativo');

      // Buscar comissões pagas
      const { data: comissoes, error: comError } = await (supabase as any)
        .from('commissions')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .eq('status', 'pago');

      // Buscar pagamentos pendentes
      const { data: pendentes, error: pendError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending');

      if (pagError || subError || comError || pendError) {
        throw new Error('Erro ao carregar dados financeiros');
      }

      // Calcular totais
      const faturamento = (pagamentos || []).reduce((acc, p: any) => acc + Number(p.amount), 0);
      const previsao = (assinaturas || []).reduce((acc, s: any) => acc + Number(s.value), 0);
      const comissoesTotal = (comissoes || []).reduce((acc, c: any) => acc + Number(c.amount), 0);
      const pagamentosPendentes = (pendentes || []).reduce((acc, p: any) => acc + Number(p.amount), 0);

      setData({
        faturamento,
        previsao,
        comissoes: comissoesTotal,
        pagamentosPendentes,
        assinaturasAtivas: assinaturas?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  return {
    data,
    loading,
    loadSummary,
  };
}

/**
 * Hook para transações
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions((data || []).map((p: any) => ({ ...p, type: 'income' as const, description: p.payment_method || '' })));
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    loadTransactions,
  };
}

/**
 * Hook para comissões
 */
export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await (supabase as any)
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setCommissions((data || []) as Commission[]);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    commissions,
    loading,
    loadCommissions,
  };
}

/**
 * Hook para estatísticas de parceiros
 */
export function usePartnerStats() {
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalEarnings: 0,
    activePartners: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    
    try {
      // Buscar parceiros
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('*');

      // Buscar comissões pagas
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('status', 'pago');

      if (partnersError || commissionsError) {
        throw new Error('Erro ao carregar estatísticas');
      }

      setStats({
        totalPartners: partners?.length || 0,
        totalEarnings: (commissions || []).reduce((acc, c: any) => acc + Number(c.amount), 0),
        activePartners: (partners || []).filter((p: any) => p.status === 'ativo').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    loadStats,
  };
}

/**
 * Hook para dashboard completo
 */
export function useFinanceDashboard() {
  const { data: summary, loading: summaryLoading, loadSummary } = useFinanceSummary();
  const { transactions, loading: transactionsLoading, loadTransactions } = useTransactions();
  const { commissions, loading: commissionsLoading, loadCommissions } = useCommissions();
  const { stats, loading: statsLoading, loadStats } = usePartnerStats();

  const loading = summaryLoading || transactionsLoading || commissionsLoading || statsLoading;

  return {
    summary,
    transactions,
    commissions,
    stats,
    loading,
    refresh: () => {
      loadSummary();
      loadTransactions();
      loadCommissions();
      loadStats();
    },
  };
}