// Serviço de Relatórios
// Integração com financeiro, comissões e parceiros

import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalRevenue: number;
    totalCommissions: number;
    netProfit: number;
    profitMargin: number;
    activePartners: number;
    totalPartners: number;
    newPartners: number;
    totalAppointments: number;
    totalClients: number;
  };
  breakdown: {
    byType: Record<string, number>;
    byPartner: Array<{ partner_id: string; name: string; amount: number }>;
  };
}

/**
 * Gerar relatório financeiro
 */
export async function generateFinancialReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  try {
    const { data: payments, error: paymentsError } = await (supabase as any)
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (paymentsError) {
      console.warn('Erro ao buscar pagamentos:', paymentsError.message);
    }

    const { data: commissions, error: commissionsError } = await (supabase as any)
      .from('commissions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (commissionsError) {
      console.warn('Erro ao buscar comissões:', commissionsError.message);
    }

    const { data: partners } = await (supabase as any)
      .from('partners')
      .select('*');

    const { data: appointments } = await (supabase as any)
      .from('appointments')
      .select('*')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    const { data: clients } = await (supabase as any)
      .from('profiles')
      .select('id');

    const totalRevenue = (payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const totalCommissions = (commissions || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const netProfit = totalRevenue - totalCommissions;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const byPartner = (commissions || []).reduce((acc: any[], c) => {
      const existing = acc.find(p => p.partner_id === c.partner_id);
      if (existing) {
        existing.amount += Number(c.amount || 0);
      } else {
        acc.push({ partner_id: c.partner_id, name: 'Parceiro', amount: Number(c.amount || 0) });
      }
      return acc;
    }, []);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        totalRevenue,
        totalCommissions,
        netProfit,
        profitMargin,
        activePartners: (partners || []).filter((p) => p.status === 'ativo').length,
        totalPartners: partners?.length || 0,
        newPartners: (partners || []).filter((p) => 
          new Date(p.created_at) >= startDate && new Date(p.created_at) <= endDate
        ).length,
        totalAppointments: appointments?.length || 0,
        totalClients: clients?.length || 0,
      },
      breakdown: {
        byType: {},
        byPartner,
      },
    };
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        totalRevenue: 0,
        totalCommissions: 0,
        netProfit: 0,
        profitMargin: 0,
        activePartners: 0,
        totalPartners: 0,
        newPartners: 0,
        totalAppointments: 0,
        totalClients: 0,
      },
      breakdown: {
        byType: {},
        byPartner: [],
      },
    };
  }
}

/**
 * Gerar relatório de comissões por parceiro
 */
export async function generatePartnerCommissionReport(
  partnerId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data: commissions, error } = await (supabase as any)
      .from('commissions')
      .select('*')
      .eq('partner_id', partnerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao gerar relatório de comissões:', error);
      return null;
    }

    const total = (commissions || []).reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pago = (commissions || [])
      .filter((c: any) => c.status === 'pago')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);
    const pendente = (commissions || [])
      .filter((c: any) => c.status === 'pendente')
      .reduce((acc, c: any) => acc + Number(c.amount), 0);

    return {
      partnerId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      total,
      pago,
      pendente,
      commissions: commissions || [],
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de comissões:', error);
    return null;
  }
}

/**
 * Gerar relatório de agendamentos
 */
export async function generateAppointmentReport(
  barbershopId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data: appointments, error } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar agendamentos:', error.message);
    }

    const total = appointments?.length || 0;
    const confirmados = (appointments || []).filter((a) => a.status === 'scheduled').length;
    const concluidos = (appointments || []).filter((a) => a.status === 'completed').length;
    const cancelados = (appointments || []).filter((a) => a.status === 'cancelled').length;

    const revenue = (appointments || [])
      .filter((a) => a.total_price)
      .reduce((acc, a) => acc + Number(a.total_price || 0), 0);

    return {
      barbershopId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalAppointments: total,
      scheduledAppointments: confirmados,
      completedAppointments: concluidos,
      cancelledAppointments: cancelados,
      revenue,
      appointments: appointments || [],
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de agendamentos:', error);
    return {
      barbershopId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalAppointments: 0,
      scheduledAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      revenue: 0,
      appointments: [],
    };
  }
}

/**
 * Gerar relatório de clientes
 */
export async function generateClientReport(
  barbershopId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const { data: appointments, error } = await (supabase as any)
      .from('appointments')
      .select('client_user_id, client_name')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    if (error) {
      console.warn('Erro ao buscar clientes:', error.message);
    }

    const uniqueClients = new Set((appointments || []).map((a) => a.client_user_id).filter(Boolean));
    const totalClients = uniqueClients.size;

    const visitsByClient: Record<string, number> = {};
    (appointments || []).forEach((a) => {
      if (a.client_user_id) {
        visitsByClient[a.client_user_id] = (visitsByClient[a.client_user_id] || 0) + 1;
      }
    });

    const frequentClients = Object.entries(visitsByClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([clientId, visits]) => ({ clientId, visits }));

    return {
      barbershopId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalClients,
      visitsByClient,
      frequentClients,
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    return {
      barbershopId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalClients: 0,
      visitsByClient: {},
      frequentClients: [],
    };
  }
}

/**
 * Exportar relatório para CSV
 */
export async function exportReportToCSV(
  reportData: any,
  filename: string
): Promise<string> {
  try {
    // Converter para CSV
    let csv = '';
    
    if (reportData.metrics) {
      csv += 'Métrica,Valor\n';
      csv += `Faturamento Total,${reportData.metrics.totalRevenue}\n`;
      csv += `Comissões Totais,${reportData.metrics.totalCommissions}\n`;
      csv += `Lucro Líquido,${reportData.metrics.netProfit}\n`;
      csv += `Margem de Lucro,${reportData.metrics.profitMargin}%\n`;
      csv += `Parceiros Ativos,${reportData.metrics.activePartners}\n`;
      csv += `Total de Parceiros,${reportData.metrics.totalPartners}\n`;
      csv += `Novos Parceiros,${reportData.metrics.newPartners}\n`;
      csv += `Total de Agendamentos,${reportData.metrics.totalAppointments}\n`;
      csv += `Total de Clientes,${reportData.metrics.totalClients}\n`;
    }

    if (reportData.breakdown?.byType) {
      csv += '\n,Por Tipo,\n';
      Object.entries(reportData.breakdown.byType).forEach(([type, amount]) => {
        csv += `${type},${amount}\n`;
      });
    }

    // Salvar arquivo (em produção, usar backend para download)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return url;
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return '';
  }
}

/**
 * Gerar relatório de desempenho da IA
 */
export async function generateAIDashboardReport() {
  try {
    // Buscar estatísticas da IA
    const { data: aiStats, error: aiError } = await (supabase as any)
      .from('ai_memory')
      .select('*');

    // Buscar automações
    const { data: automations, error: autoError } = await (supabase as any)
      .from('automations')
      .select('*')
      .eq('active', true);

    // Buscar fila de automação
    const { data: queue, error: queueError } = await (supabase as any)
      .from('automation_queue')
      .select('*')
      .eq('status', 'pendente');

    if (aiError || autoError || queueError) {
      throw new Error('Erro ao gerar relatório da IA');
    }

    // Contar conversas por intenção
    const intentCount: Record<string, number> = {};
    (aiStats || []).forEach((item: any) => {
      if (item.intent) {
        intentCount[item.intent] = (intentCount[item.intent] || 0) + 1;
      }
    });

    return {
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        totalConversations: aiStats?.length || 0,
        activeAutomations: automations?.length || 0,
        pendingQueue: queue?.length || 0,
      },
      breakdown: {
        byIntent: intentCount,
      },
    };
  } catch (error) {
    console.error('Erro ao gerar relatório da IA:', error);
    return {
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        totalConversations: 0,
        activeAutomations: 0,
        pendingQueue: 0,
      },
      breakdown: {
        byIntent: {},
      },
    };
  }
}