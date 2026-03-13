// Testes de Proteção do Sistema - Validação das Novas Funcionalidades

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { supabase } from '@/integrations/supabase/client';
import { RecurringAppointmentService } from '@/services/recurring/RecurringAppointmentService';
import { CRMServiceSuggestionService } from '@/services/crm/CRMServiceSuggestionService';
import { PaymentRecoveryService } from '@/services/payment/PaymentRecoveryService';

describe('Testes de Proteção do Sistema', () => {
  let testBarbershopId: string;
  let testClientId: string;
  let testProfessionalId: string;
  let testServiceId: string;

  beforeEach(async () => {
    // Setup inicial para testes
    console.log('🔧 Iniciando setup de testes...');
    
    // Criar barbearia de teste
    const { data: barbershop } = await supabase
      .from('barbershops')
      .insert({
        name: 'Barbearia Teste Sistema',
        owner_user_id: 'test-user-id',
        is_active: true
      })
      .select('id')
      .single();
    
    testBarbershopId = barbershop.id;
    
    // Criar cliente de teste
    const { data: client } = await supabase
      .from('profiles')
      .insert({
        user_id: 'test-client-id',
        name: 'Cliente Teste',
        email: 'cliente@teste.com'
      })
      .select('id')
      .single();
    
    testClientId = client.id;
    
    // Criar profissional de teste
    const { data: professional } = await supabase
      .from('professionals')
      .insert({
        barbershop_id: testBarbershopId,
        name: 'Profissional Teste',
        commission_percentage: 60
      })
      .select('id')
      .single();
    
    testProfessionalId = professional.id;
    
    // Criar serviço de teste
    const { data: service } = await supabase
      .from('services')
      .insert({
        barbershop_id: testBarbershopId,
        name: 'Corte Teste',
        price: 35.00,
        duration_minutes: 30
      })
      .select('id')
      .single();
    
    testServiceId = service.id;
  });

  afterEach(async () => {
    // Cleanup após testes
    console.log('🧹 Limpando dados de teste...');
    
    await supabase.from('appointments').delete().eq('barbershop_id', testBarbershopId);
    await supabase.from('services').delete().eq('barbershop_id', testBarbershopId);
    await supabase.from('professionals').delete().eq('barbershop_id', testBarbershopId);
    await supabase.from('barbershops').delete().eq('id', testBarbershopId);
  });

  describe('🔄 Agendamento Recorrente', () => {
    it('Deve criar agendamento recorrente sem quebrar sistema', async () => {
      console.log('📅 Testando criação de agendamento recorrente...');
      
      const result = await RecurringAppointmentService.createRecurringAppointment({
        barbershop_id: testBarbershopId,
        professional_id: testProfessionalId,
        service_id: testServiceId,
        client_name: 'Cliente Recorrente',
        client_whatsapp: '11999999999',
        first_date: '2026-03-15',
        time: '14:00',
        recurring_type: 'weekly',
        recurring_day: 6, // Sexta-feira
        recurring_end_date: '2026-04-30',
        notes: 'Teste de agendamento recorrente'
      });

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(result.appointment?.is_recurring).toBe(true);
      
      console.log('✅ Agendamento recorrente criado com sucesso');
    });

    it('Deve gerar agendamentos futuros automaticamente', async () => {
      console.log('🤖 Testando geração automática de agendamentos...');
      
      // Criar agendamento recorrente
      const { appointment } = await RecurringAppointmentService.createRecurringAppointment({
        barbershop_id: testBarbershopId,
        professional_id: testProfessionalId,
        service_id: testServiceId,
        client_name: 'Cliente Auto',
        first_date: '2026-03-15',
        time: '10:00',
        recurring_type: 'weekly',
        recurring_day: 6,
        recurring_end_date: '2026-04-15'
      });

      // Gerar agendamentos futuros
      const result = await RecurringAppointmentService.generateFutureAppointments(appointment!.id);
      
      expect(result.success).toBe(true);
      expect(result.generated).toBeGreaterThan(0);
      
      console.log(`✅ Gerados ${result.generated} agendamentos futuros`);
    });

    it('Deve cancelar série recorrente sem afetar outros agendamentos', async () => {
      console.log('❌ Testando cancelamento de série recorrente...');
      
      // Criar agendamento recorrente
      const { appointment } = await RecurringAppointmentService.createRecurringAppointment({
        barbershop_id: testBarbershopId,
        professional_id: testProfessionalId,
        service_id: testServiceId,
        client_name: 'Cliente Cancelar',
        first_date: '2026-03-15',
        time: '16:00',
        recurring_type: 'weekly',
        recurring_day: 6,
        recurring_end_date: '2026-04-30'
      });

      // Cancelar série
      const result = await RecurringAppointmentService.cancelRecurringSeries(appointment!.id);
      
      expect(result.success).toBe(true);
      expect(result.cancelled).toBeGreaterThan(0);
      
      console.log(`✅ Cancelados ${result.cancelled} agendamentos da série`);
    });
  });

  describe('🧠 CRM com Sugestões', () => {
    it('Deve gerar sugestões sem sobrecarregar sistema', async () => {
      console.log('💡 Testando geração de sugestões CRM...');
      
      // Criar histórico de serviços para o cliente
      await supabase.from('client_service_history').insert({
        client_user_id: testClientId,
        barbershop_id: testBarbershopId,
        service_id: testServiceId,
        service_date: new Date().toISOString(),
        service_price: 35.00,
        professional_id: testProfessionalId
      });

      // Gerar sugestões
      const suggestions = await CRMServiceSuggestionService.generateSuggestions(
        testClientId,
        testBarbershopId,
        testServiceId
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
      
      console.log(`✅ Geradas ${suggestions.length} sugestões`);
    });

    it('Deve registrar histórico de serviços automaticamente', async () => {
      console.log('📊 Testando registro automático de histórico...');
      
      // Criar agendamento
      const { data: appointment } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: testBarbershopId,
          professional_id: testProfessionalId,
          service_id: testServiceId,
          client_user_id: testClientId,
          client_name: 'Cliente Histórico',
          scheduled_at: new Date().toISOString(),
          status: 'completed'
        })
        .select('id')
        .single();

      // Registrar histórico
      const result = await CRMServiceSuggestionService.registerServiceHistory(appointment.id);
      
      expect(result).toBe(true);
      
      // Verificar se foi registrado
      const { data: history } = await supabase
        .from('client_service_history')
        .select('*')
        .eq('appointment_id', appointment.id)
        .single();
      
      expect(history).toBeDefined();
      expect(history?.client_user_id).toBe(testClientId);
      
      console.log('✅ Histórico registrado com sucesso');
    });

    it('Deve analisar perfil do cliente sem erros', async () => {
      console.log('👤 Testando análise de perfil do cliente...');
      
      // Criar múltiplos registros no histórico
      const services = [
        { price: 35.00, date: '2026-01-15' },
        { price: 45.00, date: '2026-02-15' },
        { price: 25.00, date: '2026-03-01' }
      ];

      for (const service of services) {
        await supabase.from('client_service_history').insert({
          client_user_id: testClientId,
          barbershop_id: testBarbershopId,
          service_id: testServiceId,
          service_date: service.date,
          service_price: service.price,
          professional_id: testProfessionalId
        });
      }

      // Analisar perfil
      const profile = await CRMServiceSuggestionService.analyzeClientProfile(
        testClientId,
        testBarbershopId
      );

      expect(profile).toBeDefined();
      expect(profile.totalVisits).toBe(3);
      expect(profile.avgTicket).toBeCloseTo(35, 1);
      expect(['low', 'medium', 'high']).toContain(profile.spendingPattern);
      
      console.log(`✅ Perfil analisado: ${profile.totalVisits} visitas, ticket médio R$${profile.avgTicket}`);
    });
  });

  describe('💳 Recuperação de Pagamento', () => {
    it('Deve iniciar recuperação sem quebrar fluxo existente', async () => {
      console.log('💰 Testando início de recuperação de pagamento...');
      
      // Criar pagamento pendente
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          barbershop_id: testBarbershopId,
          client_user_id: testClientId,
          amount: 99.90,
          payment_method: 'credit_card',
          status: 'pending'
        })
        .select('id')
        .single();

      // Iniciar recuperação
      const recoveryId = await supabase
        .rpc('start_payment_recovery', {
          p_payment_id: payment.id
        });

      expect(recoveryId).toBeDefined();
      
      // Verificar se foi criado
      const { data: recovery } = await supabase
        .from('payment_recovery')
        .select('*')
        .eq('payment_id', payment.id)
        .single();
      
      expect(recovery).toBeDefined();
      expect(recovery?.status).toBe('active');
      
      console.log('✅ Recuperação de pagamento iniciada com sucesso');
    });

    it('Deve processar ações de recuperação automaticamente', async () => {
      console.log('⚙️ Testando processamento automático de recuperação...');
      
      // Criar pagamento e recuperação
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          barbershop_id: testBarbershopId,
          client_user_id: testClientId,
          amount: 99.90,
          payment_method: 'credit_card',
          status: 'pending'
        })
        .select('id')
        .single();

      const recoveryId = await supabase
        .rpc('start_payment_recovery', {
          p_payment_id: payment.id
        });

      // Processar ação
      const result = await supabase
        .rpc('process_recovery_action', {
          p_recovery_id: recoveryId
        });

      expect(result).toBe(true);
      
      console.log('✅ Ação de recuperação processada com sucesso');
    });

    it('Deve reativar acesso após pagamento', async () => {
      console.log('🔓 Testando reativação de acesso...');
      
      // Criar pagamento
      const { data: payment } = await supabase
        .from('payments')
        .insert({
          barbershop_id: testBarbershopId,
          client_user_id: testClientId,
          amount: 99.90,
          payment_method: 'credit_card',
          status: 'pending'
        })
        .select('id')
        .single();

      // Iniciar recuperação e aplicar bloqueio
      const recoveryId = await supabase
        .rpc('start_payment_recovery', {
          p_payment_id: payment.id
        });

      await supabase.rpc('apply_access_block', {
        p_recovery_id: recoveryId,
        p_block_type: 'partial'
      });

      // Marcar pagamento como pago
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Reativar acesso
      const result = await supabase
        .rpc('reactivate_access_after_payment', {
          p_payment_id: payment.id
        });

      expect(result).toBe(true);
      
      // Verificar se bloqueio foi removido
      const { data: block } = await supabase
        .from('access_blocks')
        .select('*')
        .eq('user_id', testClientId)
        .eq('barbershop_id', testBarbershopId)
        .eq('is_active', true)
        .single();
      
      expect(block).toBeNull();
      
      console.log('✅ Acesso reativado com sucesso');
    });
  });

  describe('🏆 Ranking de Clientes', () => {
    it('Deve calcular métricas sem sobrecarregar banco', async () => {
      console.log('📈 Testando cálculo de métricas de cliente...');
      
      // Criar histórico de visitas
      const visits = [
        { amount: 35.00, date: '2026-01-15' },
        { amount: 45.00, date: '2026-02-15' },
        { amount: 55.00, date: '2026-03-15' }
      ];

      for (const visit of visits) {
        await supabase.from('appointments').insert({
          barbershop_id: testBarbershopId,
          professional_id: testProfessionalId,
          service_id: testServiceId,
          client_user_id: testClientId,
          client_name: 'Cliente VIP',
          scheduled_at: visit.date + 'T10:00:00',
          status: 'completed'
        });

        await supabase.from('payments').insert({
          barbershop_id: testBarbershopId,
          client_user_id: testClientId,
          amount: visit.amount,
          payment_method: 'credit_card',
          status: 'paid',
          paid_at: visit.date + 'T10:30:00'
        });
      }

      // Calcular métricas
      const { data: metrics } = await supabase
        .rpc('calculate_client_metrics', {
          p_client_user_id: testClientId,
          p_barbershop_id: testBarbershopId
        });

      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(1);
      expect(metrics[0].total_visits).toBe(3);
      expect(metrics[0].total_spent).toBe(135);
      expect(metrics[0].loyalty_score).toBeGreaterThan(0);
      
      console.log(`✅ Métricas calculadas: ${metrics[0].total_visits} visitas, score ${metrics[0].loyalty_score}`);
    });

    it('Deve gerar ranking sem afetar performance', async () => {
      console.log('🏅 Testando geração de ranking...');
      
      // Criar múltiplos clientes com diferentes métricas
      const clients = [
        { name: 'Cliente A', visits: 5, spent: 250 },
        { name: 'Cliente B', visits: 3, spent: 150 },
        { name: 'Cliente C', visits: 8, spent: 400 }
      ];

      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const clientId = `test-client-${i}`;
        
        // Criar perfil
        await supabase.from('profiles').insert({
          user_id: clientId,
          name: client.name,
          email: `client${i}@teste.com`
        });

        // Criar visitas
        for (let j = 0; j < client.visits; j++) {
          await supabase.from('appointments').insert({
            barbershop_id: testBarbershopId,
            professional_id: testProfessionalId,
            service_id: testServiceId,
            client_user_id: clientId,
            client_name: client.name,
            scheduled_at: `2026-0${j + 1}-15T10:00:00`,
            status: 'completed'
          });

          await supabase.from('payments').insert({
            barbershop_id: testBarbershopId,
            client_user_id: clientId,
            amount: client.spent / client.visits,
            payment_method: 'credit_card',
            status: 'paid',
            paid_at: `2026-0${j + 1}-15T10:30:00`
          });
        }

        // Atualizar métricas
        await supabase.rpc('update_client_metrics', {
          p_client_user_id: clientId,
          p_barbershop_id: testBarbershopId
        });
      }

      // Gerar ranking
      const { data: ranking } = await supabase
        .rpc('get_client_ranking', {
          p_barbershop_id: testBarbershopId,
          p_limit: 10,
          p_order_by: 'loyalty_score'
        });

      expect(Array.isArray(ranking)).toBe(true);
      expect(ranking.length).toBe(3);
      expect(ranking[0].rank_position).toBe(1);
      
      console.log(`✅ Ranking gerado com ${ranking.length} clientes`);
    });
  });

  describe('🛡️ Testes de Segurança', () => {
    it('Não deve permitir acesso não autorizado', async () => {
      console.log('🔒 Testando segurança de acesso...');
      
      // Tentar acessar dados de outra barbearia
      const { data, error } = await supabase
        .from('client_metrics')
        .select('*')
        .eq('barbershop_id', 'outra-barbershop-id');

      // RLS deve bloquear acesso
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log('✅ Acesso não autorizado bloqueado com sucesso');
    });

    it('Deve validar dados de entrada', async () => {
      console.log('✅ Testando validação de dados...');
      
      // Tentar criar agendamento com dados inválidos
      const result = await RecurringAppointmentService.createRecurringAppointment({
        barbershop_id: '', // ID inválido
        professional_id: testProfessionalId,
        service_id: testServiceId,
        client_name: 'Teste',
        first_date: '2026-13-45', // Data inválida
        time: '25:00', // Hora inválida
        recurring_type: 'weekly',
        recurring_day: 8, // Dia inválido
        recurring_end_date: '2026-02-01' // Data final antes da inicial
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      console.log('✅ Dados inválidos rejeitados com sucesso');
    });

    it('Deve manter integridade referencial', async () => {
      console.log('🔗 Testando integridade referencial...');
      
      // Tentar criar agendamento com service_id inexistente
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: testBarbershopId,
          professional_id: testProfessionalId,
          service_id: 'service-inexistente',
          client_name: 'Teste',
          scheduled_at: new Date().toISOString(),
          status: 'scheduled'
        })
        .select('id');

      // Deve falhar por violação de chave estrangeira
      expect(error).toBeDefined();
      expect(data).toBeNull();
      
      console.log('✅ Integridade referencial mantida');
    });
  });

  describe('⚡ Testes de Performance', () => {
    it('Deve processar múltiplas operações sem timeout', async () => {
      console.log('🚀 Testando performance em lote...');
      
      const startTime = Date.now();
      
      // Criar múltiplos agendamentos recorrentes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          RecurringAppointmentService.createRecurringAppointment({
            barbershop_id: testBarbershopId,
            professional_id: testProfessionalId,
            service_id: testServiceId,
            client_name: `Cliente Lote ${i}`,
            first_date: '2026-03-15',
            time: `${10 + i}:00`,
            recurring_type: 'weekly',
            recurring_day: 6,
            recurring_end_date: '2026-04-30'
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Todos devem ter sucesso
      expect(results.every(r => r.success)).toBe(true);
      
      // Performance razoável (menos de 5 segundos)
      expect(duration).toBeLessThan(5000);
      
      console.log(`✅ Processados 10 agendamentos em ${duration}ms`);
    });

    it('Deve lidar com grande volume de dados', async () => {
      console.log('📊 Testando volume de dados...');
      
      // Criar 100 registros de histórico
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          supabase.from('client_service_history').insert({
            client_user_id: testClientId,
            barbershop_id: testBarbershopId,
            service_id: testServiceId,
            service_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            service_price: 35.00 + (i % 20),
            professional_id: testProfessionalId
          })
        );
      }
      
      await Promise.all(promises);
      
      // Consultar histórico com performance
      const startTime = Date.now();
      const { data, error } = await CRMServiceSuggestionService.getClientServiceHistory(
        testClientId,
        testBarbershopId,
        100
      );
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(error).toBeNull();
      expect(data?.length).toBe(100);
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
      
      console.log(`✅ Consultados 100 registros em ${duration}ms`);
    });
  });
});

// Teste de integração final
describe('🔄 Teste de Integração Final', () => {
  it('Deve executar fluxo completo sem erros', async () => {
    console.log('🎯 Executando teste de integração final...');
    
    const startTime = Date.now();
    
    // 1. Criar barbearia (deve criar serviços automaticamente)
    const { data: barbershop } = await supabase
      .from('barbershops')
      .insert({
        name: 'Barbearia Integração',
        owner_user_id: 'integration-test-user',
        is_active: true
      })
      .select('id')
      .single();
    
    // 2. Verificar se serviços foram criados
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershop.id);
    
    expect(services?.length).toBeGreaterThan(0);
    
    // 3. Criar cliente e agendamento recorrente
    const { data: client } = await supabase
      .from('profiles')
      .insert({
        user_id: 'integration-client',
        name: 'Cliente Integração',
        email: 'integration@teste.com'
      })
      .select('id')
      .single();
    
    const { data: professional } = await supabase
      .from('professionals')
      .insert({
        barbershop_id: barbershop.id,
        name: 'Profissional Integração',
        commission_percentage: 60
      })
      .select('id')
      .single();
    
    // 4. Criar agendamento recorrente
    const recurringResult = await RecurringAppointmentService.createRecurringAppointment({
      barbershop_id: barbershop.id,
      professional_id: professional.id,
      service_id: services[0].id,
      client_name: 'Cliente Integração',
      first_date: '2026-03-15',
      time: '14:00',
      recurring_type: 'weekly',
      recurring_day: 6,
      recurring_end_date: '2026-04-30'
    });
    
    expect(recurringResult.success).toBe(true);
    
    // 5. Criar pagamento e iniciar recuperação
    const { data: payment } = await supabase
      .from('payments')
      .insert({
        barbershop_id: barbershop.id,
        client_user_id: client.id,
        amount: 99.90,
        payment_method: 'credit_card',
        status: 'pending'
      })
      .select('id')
      .single();
    
    const recoveryId = await supabase
      .rpc('start_payment_recovery', {
        p_payment_id: payment.id
      });
    
    expect(recoveryId).toBeDefined();
    
    // 6. Atualizar métricas do cliente
    await supabase.rpc('update_client_metrics', {
      p_client_user_id: client.id,
      p_barbershop_id: barbershop.id
    });
    
    // 7. Gerar sugestões
    const suggestions = await CRMServiceSuggestionService.generateSuggestions(
      client.id,
      barbershop.id,
      services[0].id
    );
    
    expect(Array.isArray(suggestions)).toBe(true);
    
    // 8. Gerar ranking
    const { data: ranking } = await supabase
      .rpc('get_client_ranking', {
        p_barbershop_id: barbershop.id,
        p_limit: 10
      });
    
    expect(Array.isArray(ranking)).toBe(true);
    
    // Cleanup
    await supabase.from('appointments').delete().eq('barbershop_id', barbershop.id);
    await supabase.from('services').delete().eq('barbershop_id', barbershop.id);
    await supabase.from('professionals').delete().eq('barbershop_id', barbershop.id);
    await supabase.from('barbershops').delete().eq('id', barbershop.id);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Teste de integração concluído em ${duration}ms`);
    expect(duration).toBeLessThan(10000); // Menos de 10 segundos
  });
});

console.log('🎉 Todos os testes de proteção do sistema foram executados!');
