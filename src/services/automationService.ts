// Serviço de Automação Inteligente
// Integração com IA e sistema de parceiros

import { supabase } from "@/integrations/supabase/client";

export interface Automation {
  id: string;
  type: 'reativacao' | 'abandono' | 'agenda_vazia' | 'pagamento' | 'comissao';
  channel: 'sms' | 'whatsapp' | 'email' | 'push';
  active: boolean;
  template: string;
  created_at: string;
}

export interface AutomationQueueItem {
  id: string;
  client_id: string;
  automation_id: string;
  message: string;
  status: 'pendente' | 'enviado' | 'erro';
  scheduled_at: string;
  sent_at?: string;
  error_message?: string;
}

/**
 * Buscar automações ativas
 */
export async function getActiveAutomations(): Promise<Automation[]> {
  try {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar automações:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar automações:', error);
    return [];
  }
}

/**
 * Buscar automação por tipo e canal
 */
export async function getAutomationByType(
  type: Automation['type'],
  channel: Automation['channel']
): Promise<Automation | null> {
  try {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('type', type)
      .eq('channel', channel)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar automação:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar automação:', error);
    return null;
  }
}

/**
 * Adicionar item à fila de automação
 */
export async function addToAutomationQueue(
  clientId: string,
  automationId: string,
  message: string,
  scheduledAt?: Date
): Promise<AutomationQueueItem | null> {
  try {
    const { data, error } = await supabase
      .from('automation_queue')
      .insert({
        client_id: clientId,
        automation_id: automationId,
        message: message.substring(0, 1000), // Limitar tamanho
        status: 'pendente',
        scheduled_at: scheduledAt || new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar à fila:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao adicionar à fila:', error);
    return null;
  }
}

/**
 * Processar fila de automação
 */
export async function processAutomationQueue(): Promise<number> {
  try {
    // Buscar itens pendentes
    const { data: queueItems, error } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('status', 'pendente')
      .lt('scheduled_at', new Date().toISOString())
      .limit(50); // Processar até 50 por vez

    if (error) {
      console.error('Erro ao buscar fila:', error);
      return 0;
    }

    if (!queueItems || queueItems.length === 0) {
      return 0;
    }

    let processed = 0;

    for (const item of queueItems) {
      try {
        // Aqui você implementaria o envio real da mensagem
        // Exemplo: enviar via WhatsApp, SMS, Email, Push
        
        // Atualizar status para enviado
        await supabase
          .from('automation_queue')
          .update({
            status: 'enviado',
            sent_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        processed++;
      } catch (itemError) {
        console.error('Erro ao processar item:', itemError);
        
        // Atualizar status para erro
        await supabase
          .from('automation_queue')
          .update({
            status: 'erro',
            error_message: String(itemError),
          })
          .eq('id', item.id);
      }
    }

    return processed;
  } catch (error) {
    console.error('Erro ao processar fila:', error);
    return 0;
  }
}

/**
 * Automação de reativação de clientes
 */
export async function reativarClientesInativos(): Promise<number> {
  try {
    // Buscar clientes inativos há mais de 15 dias
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('client_user_id, client_name, client_whatsapp')
      .eq('status', 'completed')
      .lt('scheduled_at', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return 0;
    }

    // Agrupar por cliente (único)
    const clientesUnicos = new Map();
    appointments?.forEach(apt => {
      if (apt.client_user_id && !clientesUnicos.has(apt.client_user_id)) {
        clientesUnicos.set(apt.client_user_id, {
          id: apt.client_user_id,
          name: apt.client_name,
          whatsapp: apt.client_whatsapp,
        });
      }
    });

    let enviados = 0;

    for (const [clientId, cliente] of clientesUnicos) {
      try {
        // Buscar automação de reativação
        const automation = await getAutomationByType('reativacao', 'whatsapp');
        
        if (automation) {
          const mensagem = automation.template.replace('{nome}', cliente.name || 'Cliente');
          
          await addToAutomationQueue(clientId, automation.id, mensagem);
          enviados++;
        }
      } catch (error) {
        console.error('Erro ao processar cliente:', error);
      }
    }

    return enviados;
  } catch (error) {
    console.error('Erro na automação de reativação:', error);
    return 0;
  }
}

/**
 * Automação de agenda vazia
 */
export async function preencherAgendaVazia(): Promise<number> {
  try {
    // Buscar horários vazios hoje
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const { data: horariosVazios, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_at', hoje.toISOString())
      .lt('scheduled_at', amanha.toISOString())
      .eq('status', 'scheduled');

    if (error) {
      console.error('Erro ao buscar horários:', error);
      return 0;
    }

    // Buscar automação de agenda vazia
    const automation = await getAutomationByType('agenda_vazia', 'whatsapp');
    
    if (!automation) {
      return 0;
    }

    let enviados = 0;

    // Enviar para clientes preferenciais (simplificado)
    const { data: clientes } = await supabase
      .from('profiles')
      .select('id, name, whatsapp')
      .limit(10);

    clientes?.forEach(cliente => {
      const mensagem = automation.template
        .replace('{nome}', cliente.name || 'Cliente')
        .replace('{horario}', '14:00');
      
      addToAutomationQueue(cliente.id, automation.id, mensagem);
      enviados++;
    });

    return enviados;
  } catch (error) {
    console.error('Erro na automação de agenda:', error);
    return 0;
  }
}

/**
 * Automação de comissão gerada
 */
export async function notificarComissaoGerada(
  partnerId: string,
  amount: number,
  type: 'adesao' | 'recorrente'
): Promise<void> {
  try {
    // Buscar automação de comissão
    const automation = await getAutomationByType('comissao', 'email');
    
    if (automation) {
      const mensagem = automation.template
        .replace('{valor}', amount.toFixed(2))
        .replace('{tipo}', type === 'adesao' ? 'adesão' : 'recorrente');

      // Buscar email do parceiro
      const { data: partner, error } = await supabase
        .from('partners')
        .select('user_id')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Erro ao buscar parceiro:', error);
        return;
      }

      // Buscar email do usuário
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', partner.user_id)
        .single();

      if (userError || !user) {
        console.error('Erro ao buscar email:', userError);
        return;
      }

      // Adicionar à fila (em produção, enviar email real)
      await addToAutomationQueue(partner.user_id, automation.id, mensagem);
    }
  } catch (error) {
    console.error('Erro ao notificar comissão:', error);
  }
}

/**
 * Agendar reativação para cliente específico
 */
export async function agendarReativacaoCliente(
  clientId: string,
  diasParaReativacao: number = 15
): Promise<boolean> {
  try {
    const automation = await getAutomationByType('reativacao', 'whatsapp');
    
    if (!automation) {
      return false;
    }

    const dataAgendada = new Date();
    dataAgendada.setDate(dataAgendada.getDate() + diasParaReativacao);

    const mensagem = automation.template.replace('{nome}', 'Cliente');

    await addToAutomationQueue(clientId, automation.id, mensagem, dataAgendada);
    
    return true;
  } catch (error) {
    console.error('Erro ao agendar reativação:', error);
    return false;
  }
}

/**
 * Verificar status da automação
 */
export async function getAutomationStatus(): Promise<{
  totalQueue: number;
  pending: number;
  sent: number;
  errored: number;
  lastProcessed: string;
}> {
  try {
    const { count: totalQueue, error: countError } = await supabase
      .from('automation_queue')
      .select('*', { count: 'exact', head: true });

    const { data: pending, error: pendingError } = await supabase
      .from('automation_queue')
      .select('id')
      .eq('status', 'pendente');

    const { data: sent, error: sentError } = await supabase
      .from('automation_queue')
      .select('id')
      .eq('status', 'enviado');

    const { data: errored, error: erroredError } = await supabase
      .from('automation_queue')
      .select('id')
      .eq('status', 'erro');

    return {
      totalQueue: totalQueue || 0,
      pending: pending?.length || 0,
      sent: sent?.length || 0,
      errored: errored?.length || 0,
      lastProcessed: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return {
      totalQueue: 0,
      pending: 0,
      sent: 0,
      errored: 0,
      lastProcessed: new Date().toISOString(),
    };
  }
}

/**
 * Limpar fila antiga (manutenção)
 */
export async function cleanupOldQueue(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await supabase
      .from('automation_queue')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
  } catch (error) {
    console.error('Erro ao limpar fila:', error);
  }
}