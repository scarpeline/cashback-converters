// Hook para Relatórios
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  generateFinancialReport,
  generatePartnerCommissionReport,
  generateAppointmentReport,
  generateClientReport,
  exportReportToCSV,
  generateAIDashboardReport,
  type ReportData 
} from '@/services/reportService';

// Chaves de query para cache
export const reportKeys = {
  all: ['reports'] as const,
  financial: (start: string, end: string) => [...reportKeys.all, 'financial', start, end] as const,
  partner: (partnerId: string, start: string, end: string) => [...reportKeys.all, 'partner', partnerId, start, end] as const,
  appointment: (barbershopId: string, start: string, end: string) => [...reportKeys.all, 'appointment', barbershopId, start, end] as const,
  client: (barbershopId: string, start: string, end: string) => [...reportKeys.all, 'client', barbershopId, start, end] as const,
  ai: () => [...reportKeys.all, 'ai'] as const,
};

/**
 * Hook para relatório financeiro
 */
export function useFinancialReport(startDate: Date, endDate: Date) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: reportKeys.financial(startDate.toISOString(), endDate.toISOString()),
    queryFn: () => generateFinancialReport(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    report: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para relatório de comissões de parceiro
 */
export function usePartnerCommissionReport(
  partnerId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, isLoading, error } = useQuery({
    queryKey: reportKeys.partner(partnerId, startDate.toISOString(), endDate.toISOString()),
    queryFn: () => generatePartnerCommissionReport(partnerId, startDate, endDate),
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    report: data,
    isLoading,
    error,
  };
}

/**
 * Hook para relatório de agendamentos
 */
export function useAppointmentReport(
  barbershopId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, isLoading, error } = useQuery({
    queryKey: reportKeys.appointment(barbershopId, startDate.toISOString(), endDate.toISOString()),
    queryFn: () => generateAppointmentReport(barbershopId, startDate, endDate),
    enabled: !!barbershopId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    report: data,
    isLoading,
    error,
  };
}

/**
 * Hook para relatório de clientes
 */
export function useClientReport(
  barbershopId: string,
  startDate: Date,
  endDate: Date
) {
  const { data, isLoading, error } = useQuery({
    queryKey: reportKeys.client(barbershopId, startDate.toISOString(), endDate.toISOString()),
    queryFn: () => generateClientReport(barbershopId, startDate, endDate),
    enabled: !!barbershopId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    report: data,
    isLoading,
    error,
  };
}

/**
 * Hook para relatório da IA
 */
export function useAIDashboardReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: reportKeys.ai(),
    queryFn: generateAIDashboardReport,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  return {
    report: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para exportar relatório
 */
export function useExportReport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = useCallback(async (
    reportData: any,
    filename: string
  ) => {
    setIsExporting(true);
    try {
      const url = await exportReportToCSV(reportData, filename);
      return url;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportReport,
    isExporting,
  };
}

/**
 * Hook para dashboard de relatórios
 */
export function useDashboardReports() {
  const today = new Date();
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { report: weeklyReport, isLoading: loadingWeekly } = useFinancialReport(last7Days, today);
  const { report: monthlyReport, isLoading: loadingMonthly } = useFinancialReport(last30Days, today);
  const { report: aiReport, isLoading: loadingAI } = useAIDashboardReport();

  const loading = loadingWeekly || loadingMonthly || loadingAI;

  return {
    weeklyReport,
    monthlyReport,
    aiReport,
    loading,
  };
}