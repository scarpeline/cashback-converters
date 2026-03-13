/**
 * Worker Assíncrono de Automação
 * Processa inatividade diária e envia notificações
 */

import { supabase } from '@/integrations/supabase/client';

export interface AutomationWorker {
  processDailyInactivity(): Promise<void>;
  sendNotifications(): Promise<void>;
  updateTracking(): Promise<void>;
}

class AutomationWorkerImpl implements AutomationWorker {
  private isRunning = false;
  private lastRun: Date | null = null;

  async processDailyInactivity(): Promise<void> {
    if (this.isRunning) {
      console.log('[AutomationWorker] Já está em execução, ignorando...');
      return;
    }

    this.isRunning = true;
    console.log('[AutomationWorker] Iniciando processamento diário de inatividade');

    try {
      // 1. Atualizar tracking de todos os usuários
      await this.updateTracking();

      // 2. Identificar usuários que precisam de notificação
      const { data: usersToNotify } = await supabase.rpc('process_daily_inactivity');

      if (!usersToNotify || usersToNotify.length === 0) {
        console.log('[AutomationWorker] Nenhum usuário para notificar hoje');
        return;
      }

      console.log(`[AutomationWorker] ${usersToNotify.length} usuários para notificar`);

      // 3. Enviar notificações
      for (const user of usersToNotify) {
        if (user.should_notify) {
          await this.sendUserNotification(user);
        }
      }

      // 4. Atualizar status para inativo se necessário
      await this.updateInactiveUsers();

      this.lastRun = new Date();
      console.log('[AutomationWorker] Processamento concluído com sucesso');

    } catch (error) {
      console.error('[AutomationWorker] Erro no processamento:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async sendNotifications(): Promise<void> {
    console.log('[AutomationWorker] Enviando notificações pendentes...');
    
    try {
      // Buscar notificações pendentes
      const { data: pendingLogs, error } = await supabase
        .from('automation_send_log')
        .select('*')
        .eq('status', 'pending')
        .limit(100);

      if (error) throw error;
      if (!pendingLogs || pendingLogs.length === 0) {
        console.log('[AutomationWorker] Nenhuma notificação pendente');
        return;
      }

      console.log(`[AutomationWorker] Processando ${pendingLogs.length} notificações pendentes`);

      for (const log of pendingLogs) {
        await this.processPendingNotification(log);
      }

    } catch (error) {
      console.error('[AutomationWorker] Erro ao enviar notificações:', error);
      throw error;
    }
  }

  async updateTracking(): Promise<void> {
    console.log('[AutomationWorker] Atualizando tracking de inatividade...');

    try {
      // Buscar todos os usuários com login há mais de 1 dia
      const { data: activeUsers, error } = await supabase
        .from('user_inactivity_tracking')
        .select('*')
        .lt('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      for (const user of activeUsers || []) {
        // Verificar se usuário fez login recentemente (via auth.sessions)
        const { data: session } = await supabase.auth.getSession();
        
        // Se não há sessão ativa, incrementar dias de inatividade
        if (!session?.user || session.user.id !== user.user_id) {
          const newInactivityDays = user.inactivity_days + 1;
          
          // Buscar configuração para o perfil
          const { data: settings } = await supabase
            .from('inactivity_settings')
            .select('*')
            .eq('user_role', user.user_role)
            .eq('is_enabled', true)
            .single();

          if (settings) {
            let newStatus = user.status;
            
            // Atualizar status baseado nos dias
            if (newInactivityDays >= settings.inactivity_days) {
              newStatus = 'inactive';
            } else if (newInactivityDays >= Math.floor(settings.inactivity_days * 0.7)) {
              newStatus = 'warning';
            }

            // Atualizar tracking
            await supabase
              .from('user_inactivity_tracking')
              .update({
                inactivity_days: newInactivityDays,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.user_id);
          }
        }
      }

    } catch (error) {
      console.error('[AutomationWorker] Erro ao atualizar tracking:', error);
      throw error;
    }
  }

  private async sendUserNotification(user: any): Promise<void> {
    console.log(`[AutomationWorker] Enviando notificação para usuário ${user.user_id}`);

    try {
      // ✅ VERIFICAÇÃO INTELIGENTE: Usuário já assinou plano?
      const hasActiveSubscription = await this.checkUserSubscription(user.user_id);
      
      if (hasActiveSubscription) {
        console.log(`[AutomationWorker] Usuário ${user.user_id} já assinou plano - ignorando notificação`);
        
        // Atualizar status para subscribed se ainda não estiver
        await this.updateUserSubscriptionStatus(user.user_id, 'subscribed');
        return;
      }

      // Buscar templates ativos para o perfil
      const { data: templates, error } = await supabase
        .from('automation_templates')
        .select('*')
        .eq('user_role', user.user_role)
        .eq('is_active', true);

      if (error) throw error;
      if (!templates || templates.length === 0) {
        console.warn(`[AutomationWorker] Nenhum template encontrado para ${user.user_role}`);
        return;
      }

      // Buscar dados do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, whatsapp, name')
        .eq('user_id', user.user_id)
        .single();

      if (profileError || !profile) {
        console.warn(`[AutomationWorker] Perfil não encontrado para ${user.user_id}`);
        return;
      }

      // Enviar para cada canal configurado
      for (const template of templates) {
        const recipient = this.getRecipient(template.channel, profile);
        
        if (!recipient) {
          console.warn(`[AutomationWorker] Destinatário não encontrado para ${template.channel}`);
          continue;
        }

        // Personalizar mensagem com verificação de assinatura
        const personalizedContent = this.personalizeMessage(template.content, {
          nome: profile.name,
          dias_inativo: user.inactivity_days,
          link_reativacao: `${process.env.VITE_APP_URL}/login?reactivate=${user.user_id}`,
          link_assinatura: `${process.env.VITE_APP_URL}/plans`, // ✅ NOVO: Link direto para assinatura
          email: profile.email,
          whatsapp: profile.whatsapp,
          status_assinatura: 'pendente' // ✅ NOVO: Status atual
        });

        // Registrar envio
        const logId = await supabase.rpc('log_automation_send', {
          p_user_id: user.user_id,
          p_template_id: template.id,
          p_channel: template.channel,
          p_recipient: recipient,
          p_status: 'pending',
          p_metadata: { 
            content: personalizedContent,
            subject: template.subject,
            has_subscription: false // ✅ NOVO: Metadata para tracking
          }
        });

        // Enviar mensagem (implementação real depende do serviço)
        await this.sendMessage({
          logId,
          channel: template.channel,
          recipient,
          subject: template.subject,
          content: personalizedContent,
          userId: user.user_id
        });
      }

    } catch (error) {
      console.error(`[AutomationWorker] Erro ao enviar notificação para ${user.user_id}:`, error);
      throw error;
    }
  }

  private async sendMessage(params: {
    logId: string;
    channel: 'email' | 'sms' | 'whatsapp';
    recipient: string;
    subject?: string;
    content: string;
    userId: string;
  }): Promise<void> {
    console.log(`[AutomationWorker] Enviando ${params.channel} para ${params.recipient}`);

    try {
      let success = false;
      let errorMessage = '';

      switch (params.channel) {
        case 'email':
          success = await this.sendEmail(params.recipient, params.subject || '', params.content);
          break;
        case 'sms':
          success = await this.sendSMS(params.recipient, params.content);
          break;
        case 'whatsapp':
          success = await this.sendWhatsApp(params.recipient, params.content);
          break;
      }

      // Atualizar status do log
      await supabase
        .from('automation_send_log')
        .update({
          status: success ? 'sent' : 'failed',
          error_message: success ? null : errorMessage,
          delivered_at: success ? new Date().toISOString() : null
        })
        .eq('id', params.logId);

    } catch (error) {
      console.error(`[AutomationWorker] Erro ao enviar mensagem:`, error);
      
      // Atualizar status para failed
      await supabase
        .from('automation_send_log')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        .eq('id', params.logId);
      
      throw error;
    }
  }

  private async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    // Implementação real usando serviço de e-mail (Resend, SendGrid, etc.)
    console.log(`[Email] Para: ${to}, Assunto: ${subject}`);
    console.log(`[Email] Conteúdo: ${content.substring(0, 100)}...`);
    
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retornar true para simular sucesso
    return true;
  }

  private async sendSMS(to: string, content: string): Promise<boolean> {
    // Implementação real usando serviço de SMS (Twilio, etc.)
    console.log(`[SMS] Para: ${to}`);
    console.log(`[SMS] Conteúdo: ${content.substring(0, 100)}...`);
    
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  private async sendWhatsApp(to: string, content: string): Promise<boolean> {
    // Implementação real usando WhatsApp API
    console.log(`[WhatsApp] Para: ${to}`);
    console.log(`[WhatsApp] Conteúdo: ${content.substring(0, 100)}...`);
    
    // Simulação de envio
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return true;
  }

  private async processPendingNotification(log: any): Promise<void> {
    // Processar notificações pendentes (retry)
    console.log(`[AutomationWorker] Processando notificação pendente ${log.id}`);
    
    // Implementar lógica de retry aqui
    // Por enquanto, apenas marca como sent
    await supabase
      .from('automation_send_log')
      .update({
        status: 'sent',
        delivered_at: new Date().toISOString()
      })
      .eq('id', log.id);
  }

  private async updateInactiveUsers(): Promise<void> {
    console.log('[AutomationWorker] Atualizando usuários inativos...');

    try {
      // Marcar usuários como inativos se excederam o limite
      const { data: settings } = await supabase.from('inactivity_settings').select('*');
      
      if (!settings) return;

      for (const setting of settings) {
        await supabase
          .from('user_inactivity_tracking')
          .update({ status: 'inactive' })
          .eq('user_role', setting.user_role)
          .gte('inactivity_days', setting.inactivity_days)
          .neq('status', 'subscribed');
      }

    } catch (error) {
      console.error('[AutomationWorker] Erro ao atualizar usuários inativos:', error);
    }
  }

  private getRecipient(channel: string, profile: any): string | null {
    switch (channel) {
      case 'email':
        return profile.email;
      case 'sms':
      case 'whatsapp':
        return profile.whatsapp;
      default:
        return null;
    }
  }

  // ✅ NOVO: Verificar se usuário tem assinatura ativa
  private async checkUserSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status, ends_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) return false;

      // Verificar se assinatura não expirou
      return new Date(data.ends_at) > new Date();
    } catch (error) {
      console.error('[AutomationWorker] Erro ao verificar assinatura:', error);
      return false;
    }
  }

  // ✅ NOVO: Atualizar status de assinatura no tracking
  private async updateUserSubscriptionStatus(userId: string, status: string): Promise<void> {
    try {
      await supabase
        .from('user_inactivity_tracking')
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('[AutomationWorker] Erro ao atualizar status:', error);
    }
  }

  private personalizeMessage(content: string, variables: Record<string, string>): string {
    let personalized = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return personalized;
  }

  // Métodos públicos para status
  getStatus(): { isRunning: boolean; lastRun: Date | null } {
    return { isRunning: this.isRunning, lastRun: this.lastRun };
  }

  // Agendar execução diária
  scheduleDaily(): void {
    console.log('[AutomationWorker] Agendando execução diária...');
    
    // Calcular próximo horário (2:00 AM)
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0);
    
    // Se já passou das 2AM, agendar para amanhã
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const delay = nextRun.getTime() - now.getTime();
    
    console.log(`[AutomationWorker] Próxima execução: ${nextRun.toLocaleString()}`);
    
    setTimeout(() => {
      this.processDailyInactivity();
      // Agendar próxima execução
      this.scheduleDaily();
    }, delay);
  }
}

// Instância global do worker
export const automationWorker = new AutomationWorkerImpl();

// Função para iniciar o worker
export function startAutomationWorker(): void {
  console.log('[AutomationWorker] Iniciando worker de automação...');
  
  // Agendar execução diária
  automationWorker.scheduleDaily();
  
  // Também executar imediatamente se necessário
  // automationWorker.processDailyInactivity();
}

// Exportar para uso no componente
export { AutomationWorkerImpl };
