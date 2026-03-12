import { createClient } from '@/lib/supabase';
import { Database } from '@/integrations/supabase/types';

type DatabaseType = Database;

export interface CommissionCalculation {
  partnerId: string;
  clientId: string;
  commissionType: 'adesao' | 'recorrente' | 'indicacao_direta' | 'indicacao_indireta';
  baseValue: number;
  percentage: number;
  calculatedValue: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'diretor_franqueado' | 'franqueado' | 'afiliado';
  parentId?: string;
  level: number;
  children: NetworkNode[];
  totalCommissions: number;
  activeClients: number;
}

export class CommissionService {
  private supabase = createClient();

  /**
   * Calcula comissão baseada no tipo de parceria e configuração
   */
  async calculateCommission(data: CommissionCalculation): Promise<number> {
    try {
      // Buscar configuração de comissão
      const { data: config, error } = await this.supabase
        .from('config_comissoes')
        .select('percentual_padrao, regras')
        .eq('tipo_parceria', this.getPartnerTypeFromId(data.partnerId))
        .eq('tipo_comissao', data.commissionType)
        .eq('ativo', true)
        .single();

      if (error || !config) {
        console.error('Erro ao buscar configuração de comissão:', error);
        return 0;
      }

      // Aplicar regras específicas se existirem
      const rules = config.regras as any;
      let finalPercentage = config.percentual_padrao;

      if (rules && rules.minimo_indicacoes) {
        // Verificar se parceiro atende ao mínimo de indicações
        const { data: partner } = await this.supabase
          .from('parceiros')
          .select('indicacoes_diretas')
          .eq('id', data.partnerId)
          .single();

        if (partner && partner.indicacoes_diretas < rules.minimo_indicacoes) {
          // Aplicar penalidade ou reduzir comissão
          finalPercentage = finalPercentage * 0.8; // Reduz 20%
        }
      }

      return data.baseValue * (finalPercentage / 100);
    } catch (error) {
      console.error('Erro ao calcular comissão:', error);
      return 0;
    }
  }

  /**
   * Gera comissões automáticas para novos clientes
   */
  async generateCommissionsForClient(clientId: string, subscriptionValue: number): Promise<void> {
    try {
      // Buscar todos os parceiros ativos
      const { data: partners, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('status', 'ativo');

      if (error || !partners) {
        console.error('Erro ao buscar parceiros:', error);
        return;
      }

      // Gerar comissões para cada tipo de parceiro
      for (const partner of partners) {
        const commissionData: CommissionCalculation = {
          partnerId: partner.id,
          clientId,
          commissionType: 'adesao',
          baseValue: subscriptionValue,
          percentage: 0,
          calculatedValue: 0
        };

        // Calcular comissão baseada no tipo de parceria
        const calculatedValue = await this.calculateCommission(commissionData);

        if (calculatedValue > 0) {
          // Inserir comissão no banco
          await this.supabase
            .from('comissoes')
            .insert({
              parceiro_id: partner.id,
              cliente_id: clientId,
              tipo_comissao: 'adesao',
              valor_comissao: calculatedValue,
              percentual_aplicado: (calculatedValue / subscriptionValue) * 100,
              valor_base: subscriptionValue,
              status: 'pendente',
              data_comissao: new Date().toISOString(),
              periodo_referencia: new Date().toISOString().slice(0, 7) // YYYY-MM
            });

          // Atualizar total de comissões do parceiro
          await this.supabase
            .from('parceiros')
            .update({
              total_comissoes: partner.total_comissoes + calculatedValue,
              indicacoes_diretas: partner.indicacoes_diretas + 1,
              data_ultima_indicacao: new Date().toISOString()
            })
            .eq('id', partner.id);

          // Registrar log
          await this.logActivity(partner.id, 'comissao_gerada', `Comissão de R$${calculatedValue.toFixed(2)} gerada para cliente ${clientId}`);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar comissões:', error);
    }
  }

  /**
   * Constrói árvore de rede de um parceiro
   */
  async buildPartnerNetwork(partnerId: string): Promise<NetworkNode | null> {
    try {
      // Buscar dados do parceiro raiz
      const { data: rootPartner, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error || !rootPartner) {
        return null;
      }

      // Buscar indicações diretas
      const { data: directIndications } = await this.supabase
        .from('rede_indicacoes')
        .select(`
          indicado_id,
          parceiros!rede_indicacoes_indicado_id_fkey(
            id,
            tipo_parceria,
            total_comissoes
          )
        `)
        .eq('parceiro_id', partnerId)
        .eq('status', 'ativa');

      const rootNode: NetworkNode = {
        id: rootPartner.id,
        name: `Parceiro ${rootPartner.id.slice(0, 8)}`,
        type: rootPartner.tipo_parceria,
        level: 0,
        children: [],
        totalCommissions: rootPartner.total_comissoes,
        activeClients: rootPartner.indicacoes_diretas
      };

      // Construir recursivamente os nós filhos
      if (directIndications) {
        for (const indication of directIndications) {
          const childNode = await this.buildPartnerNetwork(indication.indicado_id);
          if (childNode) {
            childNode.level = rootNode.level + 1;
            childNode.parentId = rootNode.id;
            rootNode.children.push(childNode);
          }
        }
      }

      return rootNode;
    } catch (error) {
      console.error('Erro ao construir rede:', error);
      return null;
    }
  }

  /**
   * Calcula comissões recorrentes mensais
   */
  async calculateMonthlyRecurringCommissions(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Buscar todas as barbearias ativas
      const { data: barbershops, error } = await this.supabase
        .from('barbershops')
        .select('id, monthly_fee, sms_active, whatsapp_active')
        .eq('status', 'active');

      if (error || !barbershops) {
        console.error('Erro ao buscar barbearias:', error);
        return;
      }

      // Para cada barbearia, calcular comissões recorrentes
      for (const barbershop of barbershops) {
        const totalValue = barbershop.monthly_fee + 
                          (barbershop.sms_active ? 29 : 0) + 
                          (barbershop.whatsapp_active ? 39 : 0);

        // Buscar parceiros que devem receber comissão recorrente
        const { data: partners } = await this.supabase
          .from('parceiros')
          .select('*')
          .eq('status', 'ativo')
          .in('tipo_parceria', ['afiliado', 'diretor_franqueado']);

        if (partners) {
          for (const partner of partners) {
            const commissionData: CommissionCalculation = {
              partnerId: partner.id,
              clientId: barbershop.id,
              commissionType: 'recorrente',
              baseValue: totalValue,
              percentage: 0,
              calculatedValue: 0
            };

            const calculatedValue = await this.calculateCommission(commissionData);

            if (calculatedValue > 0) {
              // Verificar se já existe comissão para este período
              const { data: existingCommission } = await this.supabase
                .from('comissoes')
                .select('id')
                .eq('parceiro_id', partner.id)
                .eq('cliente_id', barbershop.id)
                .eq('tipo_comissao', 'recorrente')
                .eq('periodo_referencia', currentMonth)
                .single();

              if (!existingCommission) {
                // Inserir nova comissão recorrente
                await this.supabase
                  .from('comissoes')
                  .insert({
                    parceiro_id: partner.id,
                    cliente_id: barbershop.id,
                    tipo_comissao: 'recorrente',
                    valor_comissao: calculatedValue,
                    percentual_aplicado: (calculatedValue / totalValue) * 100,
                    valor_base: totalValue,
                    status: 'pendente',
                    data_comissao: new Date().toISOString(),
                    periodo_referencia: currentMonth
                  });

                // Atualizar total do parceiro
                await this.supabase
                  .from('parceiros')
                  .update({
                    total_comissoes: partner.total_comissoes + calculatedValue
                  })
                  .eq('id', partner.id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao calcular comissões recorrentes:', error);
    }
  }

  /**
   * Atualiza rankings mensais de parceiros
   */
  async updateMonthlyRankings(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Buscar todos os parceiros ativos
      const { data: partners, error } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('status', 'ativo');

      if (error || !partners) {
        console.error('Erro ao buscar parceiros:', error);
        return;
      }

      // Agrupar por tipo de parceria e ordenar por comissões
      const partnerTypes = ['afiliado', 'franqueado', 'diretor_franqueado'];

      for (const type of partnerTypes) {
        const typePartners = partners
          .filter(p => p.tipo_parceria === type)
          .sort((a, b) => b.total_comissoes - a.total_comissoes);

        // Atualizar rankings
        for (let i = 0; i < typePartners.length; i++) {
          const partner = typePartners[i];
          const position = i + 1;

          // Buscar comissões do mês
          const { data: monthlyCommissions } = await this.supabase
            .from('comissoes')
            .select('valor_comissao')
            .eq('parceiro_id', partner.id)
            .eq('periodo_referencia', currentMonth);

          const monthlyTotal = monthlyCommissions?.reduce((sum, c) => sum + c.valor_comissao, 0) || 0;

          // Verificar se já existe ranking
          const { data: existingRanking } = await this.supabase
            .from('rankings_parceiros')
            .select('id')
            .eq('parceiro_id', partner.id)
            .eq('tipo_ranking', type)
            .eq('periodo_referencia', currentMonth)
            .single();

          if (existingRanking) {
            // Atualizar ranking existente
            await this.supabase
              .from('rankings_parceiros')
              .update({
                posicao: position,
                pontuacao: monthlyTotal,
                comissoes_totais: monthlyTotal,
                indicacoes_totais: partner.indicacoes_diretas,
                meta_batingida: partner.indicacoes_diretas >= partner.meta_mensual
              })
              .eq('id', existingRanking.id);
          } else {
            // Criar novo ranking
            await this.supabase
              .from('rankings_parceiros')
              .insert({
                parceiro_id: partner.id,
                tipo_ranking: type,
                posicao: position,
                pontuacao: monthlyTotal,
                periodo_referencia: currentMonth,
                comissoes_totais: monthlyTotal,
                indicacoes_totais: partner.indicacoes_diretas,
                meta_batingida: partner.indicacoes_diretas >= partner.meta_mensual
              });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar rankings:', error);
    }
  }

  /**
   * Aplica penalidades de atividade
   */
  async applyActivityPenalties(): Promise<void> {
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
        if (partner.data_ultima_indicacao) {
          const daysSinceLastIndication = Math.floor(
            (new Date().getTime() - new Date(partner.data_ultima_indicacao).getTime()) / 
            (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastIndication >= 40) {
            // Calcular penalidade
            const penalty = this.calculatePenalty(daysSinceLastIndication);

            // Aplicar penalidade nas próximas comissões
            await this.supabase
              .from('parceiros')
              .update({
                dias_parado: daysSinceLastIndication,
                nivel_penalidade: Math.floor(penalty / 10)
              })
              .eq('id', partner.id);

            // Registrar log
            await this.logActivity(
              partner.id, 
              'penalidade_aplicada', 
              `Penalidade de ${penalty}% aplicada por ${daysSinceLastIndication} dias sem indicação`
            );
          }
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar penalidades:', error);
    }
  }

  /**
   * Calcula penalidade baseada nos dias parado
   */
  private calculatePenalty(daysInactive: number): number {
    if (daysInactive >= 40 && daysInactive < 60) return 10;
    if (daysInactive >= 60 && daysInactive < 90) return 15;
    if (daysInactive >= 90 && daysInactive < 120) return 25;
    if (daysInactive >= 120) {
      return Math.min(40 + Math.floor((daysInactive - 120) / 30) * 10, 90);
    }
    return 0;
  }

  /**
   * Obtém tipo de parceiro a partir do ID
   */
  private async getPartnerTypeFromId(partnerId: string): Promise<string> {
    const { data: partner } = await this.supabase
      .from('parceiros')
      .select('tipo_parceria')
      .eq('id', partnerId)
      .single();

    return partner?.tipo_parceria || '';
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
   * Obtém estatísticas do parceiro
   */
  async getPartnerStats(partnerId: string) {
    try {
      const { data: partner } = await this.supabase
        .from('parceiros')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (!partner) return null;

      // Buscar comissões do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyCommissions } = await this.supabase
        .from('comissoes')
        .select('valor_comissao, status')
        .eq('parceiro_id', partnerId)
        .eq('periodo_referencia', currentMonth);

      const monthlyTotal = monthlyCommissions?.reduce((sum, c) => sum + c.valor_comissao, 0) || 0;
      const pendingAmount = monthlyCommissions?.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor_comissao, 0) || 0;

      // Buscar ranking atual
      const { data: ranking } = await this.supabase
        .from('rankings_parceiros')
        .select('posicao, pontuacao')
        .eq('parceiro_id', partnerId)
        .eq('periodo_referencia', currentMonth)
        .single();

      return {
        partner,
        monthlyStats: {
          totalCommissions: monthlyTotal,
          pendingCommissions: pendingAmount,
          totalIndications: monthlyCommissions?.length || 0
        },
        ranking: ranking || { posicao: 0, pontuacao: 0 },
        networkSize: partner.indicacoes_diretas + partner.indicacoes_indiretas
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  }
}

export const commissionService = new CommissionService();
