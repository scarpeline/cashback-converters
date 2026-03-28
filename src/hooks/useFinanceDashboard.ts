// Hook para Dashboard Financeiro — Corrigido para tabelas reais
import { useState, useCallback } from 'react';
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
  type: string;
  status: 'pending' | 'paid';
  created_at: string;
}

export const financeKeys = {
  all: ['finance'] as const,
  summary: () => [...financeKeys.all, 'summary'] as const,
  summaryPeriod: (period: string) => [...financeKeys.summary(), period] as const,
  transactions: () => [...financeKeys.all, 'transactions'] as const,
  commissions: () => [...financeKeys.all, 'commissions'] as const,
  partners: () => [...financeKeys.all, 'partners'] as const,
};

function getPeriodStart(period: '7d' | '30d' | '90d' | '12m'): Date {
  const d = new Date();
  switch (period) {
    case '7d': d.setDate(d.getDate() - 7); break;
    case '30d': d.setDate(d.getDate() - 30); break;
    case '90d': d.setDate(d.getDate() - 90); break;
    case '12m': d.setMonth(d.getMonth() - 12); break;
  }
  return d;
}

export function useFinanceSummary(period: '7d' | '30d' | '90d' | '12m' = '30d') {
  const [data, setData] = useState<FinanceData>({ faturamento: 0, previsao: 0, comissoes: 0, pagamentosPendentes: 0, assinaturasAtivas: 0 });
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const inicio = getPeriodStart(period).toISOString();

      const [pagosRes, pendentesRes, comissoesRes, subsRes] = await Promise.all([
        (supabase as any).from('payments').select('amount').eq('status', 'paid').gte('created_at', inicio),
        (supabase as any).from('payments').select('amount').eq('status', 'pending'),
        (supabase as any).from('partner_commissions').select('amount').eq('status', 'paid').gte('created_at', inicio),
        (supabase as any).from('user_subscriptions').select('id').eq('status', 'active').gte('ends_at', new Date().toISOString()),
      ]);

      const sum = (arr: any[]) => (arr || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

      setData({
        faturamento: sum(pagosRes.data),
        previsao: sum(pagosRes.data) * 1.1, // projeção simples +10%
        comissoes: sum(comissoesRes.data),
        pagamentosPendentes: sum(pendentesRes.data),
        assinaturasAtivas: subsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar resumo financeiro:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  return { data, loading, loadSummary };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('payments').select('id, amount, status, method, created_at')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setTransactions((data || []).map((p: any) => ({
        id: p.id, amount: Number(p.amount), type: 'income' as const,
        status: p.status, description: p.method || 'pagamento', created_at: p.created_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { transactions, loading, loadTransactions };
}

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('partner_commissions').select('id, partner_id, amount, type, status, created_at')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setCommissions((data || []) as Commission[]);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { commissions, loading, loadCommissions };
}

export function usePartnerStats() {
  const [stats, setStats] = useState({ totalPartners: 0, totalEarnings: 0, activePartners: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [partnersRes, comRes] = await Promise.all([
        (supabase as any).from('partners').select('id, status'),
        (supabase as any).from('partner_commissions').select('amount').eq('status', 'paid'),
      ]);
      const partners = partnersRes.data || [];
      setStats({
        totalPartners: partners.length,
        totalEarnings: (comRes.data || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0),
        activePartners: partners.filter((p: any) => p.status === 'ativo').length,
      });
    } catch (error) {
      console.error('Erro ao carregar stats parceiros:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, loadStats };
}

export function useFinanceDashboard() {
  const { data: summary, loading: l1, loadSummary } = useFinanceSummary();
  const { transactions, loading: l2, loadTransactions } = useTransactions();
  const { commissions, loading: l3, loadCommissions } = useCommissions();
  const { stats, loading: l4, loadStats } = usePartnerStats();

  return {
    summary, transactions, commissions, stats,
    loading: l1 || l2 || l3 || l4,
    refresh: () => { loadSummary(); loadTransactions(); loadCommissions(); loadStats(); },
  };
}
