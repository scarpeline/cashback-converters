import { createClient } from '@/lib/supabase';

export interface ActivityRule {
  daysInactive: number;
  penaltyPercentage: number;
  level: number;
  description: string;
}

export interface RenewalNotification {
  partnerId: string;
  planType: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  renewalDate: string;
  daysUntilRenewal: number;
  message: string;
}

export class ActivityService {
  private supabase = createClient();

  // Regras de atividade baseadas nos requisitos
  private activityRules: ActivityRule[] = [
    { daysInactive: 40, penaltyPercentage: 10, level: 1, description: '10% de redução nas comissões' },
    { daysInactive: 60, penaltyPercentage: 15, level: 2, description: '15% de redução nas comissões' },
    { daysInactive: 90, penaltyPercentage: 25, level: 3, description: '25% de redução nas comissões' },
    { daysInactive: 120, penaltyPercentage: 40, level: 4, description: '40% de redução nas comissões' },
  ];

  /**
   * Verifica e aplica regras de atividade para todos os parceiros
   */
  async checkAndApplyActivityRules(): Promise<void> {
    try {
      const { data: partners, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('status', 'ativo');

      if (error || !partners) {
        console.error('Erro ao buscar parceiros:', error);
        return;
      }

      for (const partner of partners) {
        await this.checkPartnerActivity(partner.id);
      }
    } catch (error) {
      console.error('Erro ao verificar regras de atividade:', error);
    }
  }

  /**
   * Verifica atividade de um parceiro específico
   */
  async checkPartnerActivity(partnerId: string): Promise<void> {
    try {
      const { data: partner, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Erro ao buscar parceiro:', error);
        return;
      }

      // Calcular dias desde última indicação
      const daysSinceLastIndication = this.calculateDaysSinceLastIndication(partner.data_ultima_indicacao);
      
      // Encontrar regra aplicável
      const applicableRule = this.findApplicableRule(daysSinceLastIndication);
      
      if (applicableRule) {
        // Aplicar penalidade
        await this.applyPenalty(partnerId, applicableRule, daysSinceLastIndication);
        
        // Enviar notificação
        await this.sendActivityNotification(partner, applicableRule, daysSinceLastIndication);
      } else if (daysSinceLastIndication < 40) {
        // Resetar penalidades se estiver ativo
        await this.resetPenalties(partnerId);
      }

      // Atualizar dias parado
      await this.supabase
        .from('parceiros')
        .update({ dias_parado: daysSinceLastIndication })
        .eq('id', partnerId);

    } catch (error) {
      console.error('Erro ao verificar atividade do parceiro:', error);
    }
  }

  /**
   * Calcula dias desde última indicação
   */
  private calculateDaysSinceLastIndication(lastIndicationDate?: string): number {
    if (!lastIndicationDate) {
      // Se nunca indicou, contar desde a data de início
      return 999; // Valor alto para indicar inatividade prolongada
    }

    const lastDate = new Date(lastIndicationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Encontra regra aplicável baseada nos dias de inatividade
   */
  private findApplicableRule(daysInactive: number): ActivityRule | null {
    // Regra para além de 120 dias (10% adicionais a cada 30 dias)
    if (daysInactive >= 120) {
      const additionalPenalties = Math.floor((daysInactive - 120) / 30) * 10;
      const totalPenalty = Math.min(40 + additionalPenalties, 90);
      const additionalLevels = Math.floor((daysInactive - 120) / 30);
      
      return {
        daysInactive,
        penaltyPercentage: totalPenalty,
        level: 4 + additionalLevels,
        description: `${totalPenalty}% de redução nas comissões`
      };
    }

    // Regras padrão
    return this.activityRules
      .slice()
      .reverse()
      .find(rule => daysInactive >= rule.daysInactive) || null;
  }

  /**
   * Aplica penalidade ao parceiro
   */
  private async applyPenalty(partnerId: string, rule: ActivityRule, daysInactive: number): Promise<void> {
    try {
      await this.supabase
        .from('parceiros')
        .update({
          nivel_penalidade: rule.penaltyPercentage,
          dias_parado: daysInactive
        })
        .eq('id', partnerId);

      // Registrar log
      await this.logActivity(partnerId, 'penalidade_aplicada', `Penalidade de ${rule.penaltyPercentage}% aplicada: ${rule.description}`);

      console.log(`Penalidade aplicada ao parceiro ${partnerId}: ${rule.description}`);
    } catch (error) {
      console.error('Erro ao aplicar penalidade:', error);
    }
  }

  /**
   * Reseta penalidades do parceiro
   */
  private async resetPenalties(partnerId: string): Promise<void> {
    try {
      await this.supabase
        .from('parceiros')
        .update({
          nivel_penalidade: 0,
          dias_parado: 0
        })
        .eq('id', partnerId);

      // Registrar log
      await this.logActivity(partnerId, 'penalidade_resetada', 'Penalidades resetadas - Parceiro ativo');

      console.log(`Penalidades resetadas para o parceiro ${partnerId}`);
    } catch (error) {
      console.error('Erro ao resetar penalidades:', error);
    }
  }

  /**
   * Envia notificação de atividade ao parceiro
   */
  private async sendActivityNotification(partner: any, rule: ActivityRule, daysInactive: number): Promise<void> {
    try {
      // Registrar notificação no log (tabela notificacoes não existe ainda)
      await this.logActivity(partner.id, 'notificacao_atividade', `Alerta de atividade: ${rule.description}`);

      // Enviar email (em produção)
      await this.sendActivityEmail(partner, rule, daysInactive);

      console.log(`Notificação de atividade registrada para o parceiro ${partner.id}`);
    } catch (error) {
      console.error('Erro ao enviar notificação de atividade:', error);
    }
  }

  /**
   * Gera mensagem de notificação de atividade
   */
  private generateActivityMessage(daysInactive: number, rule: ActivityRule): string {
    if (daysInactive >= 120) {
      return `Atenção crítica! Você está ${daysInactive} dias sem realizar uma indicação. Sua comissão foi reduzida em ${rule.penaltyPercentage}%. Para recuperar, ative 2 novos clientes.`;
    }

    if (daysInactive >= 90) {
      return `Alerta importante! Você está ${daysInactive} dias sem realizar uma indicação. Sua comissão foi reduzida em ${rule.penaltyPercentage}%. Indique novos clientes para recuperar seu nível.`;
    }

    if (daysInactive >= 60) {
      return `Atenção! Você está ${daysInactive} dias sem realizar uma indicação. Sua comissão foi reduzida em ${rule.penaltyPercentage}%. Não deixe sua rede esfriar!`;
    }

    if (daysInactive >= 40) {
      return `Aviso: Você está ${daysInactive} dias sem realizar uma indicação. Sua comissão foi reduzida em ${rule.penaltyPercentage}%. Mantenha sua rede ativa!`;
    }

    return '';
  }

  /**
   * Envia email de atividade (simulação)
   */
  private async sendActivityEmail(partner: any, rule: ActivityRule, daysInactive: number): Promise<void> {
    // Em produção, integrar com serviço de email
    console.log(`Email de atividade enviado para ${partner.email}:`, {
      subject: 'Alerta de Atividade - SalãoCashBack',
      message: this.generateActivityMessage(daysInactive, rule)
    });
  }

  /**
   * Processa recuperação de penalidade
   */
  async processPenaltyRecovery(partnerId: string, newClientsCount: number): Promise<void> {
    try {
      const { data: partner, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Erro ao buscar parceiro:', error);
        return;
      }

      const currentLevel = partner.nivel_penalidade || 0;
      
      if (currentLevel > 0) {
        // Cada 2 novos clientes reduzem 1 nível de penalidade
        const levelsToRecover = Math.floor(newClientsCount / 2);
        const newLevel = Math.max(0, currentLevel - (levelsToRecover * 10));

        await this.supabase
          .from('parceiros')
          .update({ nivel_penalidade: newLevel })
          .eq('id', partnerId);

        // Registrar log
        await this.logActivity(partnerId, 'penalidade_recuperada', `Recuperados ${levelsToRecover} níveis com ${newClientsCount} novos clientes`);

        console.log(`Recuperação de penalidade processada para parceiro ${partnerId}: nível ${currentLevel}% → ${newLevel}%`);
      }
    } catch (error) {
      console.error('Erro ao processar recuperação de penalidade:', error);
    }
  }

  /**
   * Verifica renovações de assinaturas
   */
  async checkSubscriptionRenewals(): Promise<RenewalNotification[]> {
    try {
      const { data: partners, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('status', 'ativo')
        .not('data_renovacao', 'is', null);

      if (error || !partners) {
        console.error('Erro ao buscar parceiros com renovações:', error);
        return [];
      }

      const notifications: RenewalNotification[] = [];
      const today = new Date();

      for (const partner of partners) {
        if (partner.data_renovacao) {
          const renewalDate = new Date(partner.data_renovacao);
          const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Enviar notificações em 30, 15 e 7 dias antes
          if ([30, 15, 7].includes(daysUntilRenewal)) {
            const notification = this.generateRenewalNotification(partner, daysUntilRenewal);
            notifications.push(notification);

            // Salvar notificação no banco
            await this.saveRenewalNotification(notification);
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Erro ao verificar renovações:', error);
      return [];
    }
  }

  /**
   * Gera notificação de renovação
   */
  private generateRenewalNotification(partner: any, daysUntilRenewal: number): RenewalNotification {
    const planNames = {
      mensal: 'Plano Mensal',
      trimestral: 'Plano Trimestral',
      semestral: 'Plano Semestral',
      anual: 'Plano Anual'
    };

    const planName = planNames[partner.plano_assinatura as keyof typeof planNames] || 'Plano';

    let message = '';
    if (daysUntilRenewal === 30) {
      message = `Sua assinatura ${planName} será renovada em 30 dias. Prepare-se para a renovação automática.`;
    } else if (daysUntilRenewal === 15) {
      message = `Aviso: Sua assinatura ${planName} será renovada em 15 dias. Verifique seus dados de pagamento.`;
    } else if (daysUntilRenewal === 7) {
      message = `Último aviso: Sua assinatura ${planName} será renovada em 7 dias. Contate o suporte se necessário.`;
    }

    return {
      partnerId: partner.id,
      planType: partner.plano_assinatura,
      renewalDate: partner.data_renovacao!,
      daysUntilRenewal,
      message
    };
  }

  /**
   * Salva notificação de renovação no log
   */
  private async saveRenewalNotification(notification: RenewalNotification): Promise<void> {
    try {
      // Registrar no log (tabela notificacoes não existe ainda)
      await this.logActivity(notification.partnerId, 'notificacao_renovacao', notification.message);

      console.log(`Notificação de renovação registrada para parceiro ${notification.partnerId}`);
    } catch (error) {
      console.error('Erro ao salvar notificação de renovação:', error);
    }
  }

  /**
   * Processa renovação de assinatura
   */
  async processSubscriptionRenewal(partnerId: string): Promise<void> {
    try {
      const { data: partner, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        console.error('Erro ao buscar parceiro:', error);
        return;
      }

      // Buscar preços dos planos
      const { data: plans } = await this.supabase
        .from('planos_parceiros')
        .select('*')
        .eq('nome', partner.plano_assinatura)
        .eq('ativo', true)
        .single();

      if (!plans) {
        console.error('Plano não encontrado:', partner.plano_assinatura);
        return;
      }

      // Calcular próxima data de renovação
      const renewalDate = new Date(partner.data_renovacao!);
      const nextRenewalDate = new Date(renewalDate);
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + plans.duracao_meses);

      // Atualizar data de renovação
      await this.supabase
        .from('parceiros')
        .update({
          data_renovacao: nextRenewalDate.toISOString()
        })
        .eq('id', partnerId);

      // Registrar log
      await this.logActivity(partnerId, 'assinatura_renovada', `Plano ${partner.plano_assinatura} renovado por ${plans.duracao_meses} meses`);

      console.log(`Renovação processada para parceiro ${partnerId}: ${partner.plano_assinatura}`);
    } catch (error) {
      console.error('Erro ao processar renovação:', error);
    }
  }

  /**
   * Registra atividade do parceiro
   */
  private async logActivity(partnerId: string, action: string, description: string): Promise<void> {
    await this.supabase
      .from('logs_atividade_parceiros')
      .insert({
        parceiro_id: partnerId,
        tipo_acao: action,
        descricao: description,
        dados_adicionais: { timestamp: new Date().toISOString() },
        data_acao: new Date().toISOString()
      });
  }

  /**
   * Obtém estatísticas de atividade do parceiro
   */
  async getPartnerActivityStats(partnerId: string) {
    try {
      const { data: partner } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (!partner) return null;

      // Buscar logs de atividade recentes
      const { data: recentLogs } = await this.supabase
        .from('logs_atividade_parceiros')
        .select('*')
        .eq('parceiro_id', partnerId)
        .order('data_acao', { ascending: false })
        .limit(10);

      // Notificações não lidas não disponíveis ainda (tabela não existe)
      const unreadNotifications = [];

      return {
        partner,
        activityStatus: this.getActivityStatus(partner.dias_parado || 0),
        recentLogs: recentLogs || [],
        unreadNotifications: unreadNotifications || [],
        nextRenewal: partner.data_renovacao
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de atividade:', error);
      return null;
    }
  }

  /**
   * Obtém status de atividade
   */
  private getActivityStatus(daysInactive: number): string {
    if (daysInactive < 40) return 'ativo';
    if (daysInactive < 60) return 'atencao';
    if (daysInactive < 90) return 'penalizado';
    return 'critico';
  }
}

export const activityService = new ActivityService();
