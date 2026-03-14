// @ts-nocheck
/**
 * WaitlistTests - Testes Automatizados para Sistema de Fila Inteligente
 * 
 * Testa todos os cenários críticos:
 * - Entrada na fila
 * - Liberação de vagas
 * - Antecipação automática
 * - Preço dinâmico
 * - Notificações
 * - Permissões
 */

import { waitlistManager, type WaitlistPreferences } from "./WaitlistManager";
import { anticipationManager } from "../anticipation/AnticipationManager";
import { waitlistNotifications } from "../notifications/WaitlistNotifications";
import { supabase } from "@/integrations/supabase/client";

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

class WaitlistTests {
  /**
   * Executa todos os testes do sistema
   */
  async runAllTests(barbershopId: string): Promise<TestSuite[]> {
    console.log("[TESTS] Iniciando testes do sistema de fila inteligente...");
    
    const testSuites: TestSuite[] = [];
    
    // Suite 1: Testes de Fila de Espera
    testSuites.push(await this.testWaitlistQueue(barbershopId));
    
    // Suite 2: Testes de Antecipação
    testSuites.push(await this.testAnticipationSystem(barbershopId));
    
    // Suite 3: Testes de Preço Dinâmico
    testSuites.push(await this.testDynamicPricing(barbershopId));
    
    // Suite 4: Testes de Notificações
    testSuites.push(await this.testNotificationSystem(barbershopId));
    
    // Suite 5: Testes de Permissões
    testSuites.push(await this.testPermissionSystem(barbershopId));
    
    // Suite 6: Testes de Integração
    testSuites.push(await this.testIntegrationScenarios(barbershopId));
    
    console.log("[TESTS] Todos os testes concluídos!");
    
    return testSuites;
  }

  /**
   * Testes de Fila de Espera
   */
  private async testWaitlistQueue(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Cliente entra na fila com preferência específica
    tests.push(await this.runTest(
      "Cliente entra na fila - Apenas profissional específico",
      async () => {
        const testClientId = "test-client-1";
        const testServiceId = "test-service-1";
        const testProfessionalId = "test-professional-1";
        
        const preferences: WaitlistPreferences = {
          professional_preferred_id: testProfessionalId,
          accepts_other_professional: false,
          accepts_nearby_time: false,
          accepts_any_time: false,
          notes: "Teste - apenas profissional específico",
        };
        
        const result = await waitlistManager.addToWaitlist(
          barbershopId,
          testClientId,
          testServiceId,
          "2024-12-20",
          "14:00",
          preferences
        );
        
        if (!result.success) {
          throw new Error(`Falha ao entrar na fila: ${result.error}`);
        }
        
        // Verificar se foi criado corretamente
        const { data: waitlist } = await supabase
          .from("waitlist_queue")
          .select("*")
          .eq("id", result.waitlistId)
          .single();
        
        if (!waitlist || waitlist.status !== "waiting") {
          throw new Error("Entrada na fila não foi criada corretamente");
        }
        
        if (waitlist.accepts_other_professional !== false) {
          throw new Error("Preferência de profissional não foi salva corretamente");
        }
        
        return { waitlistId: result.waitlistId };
      }
    ));
    
    // Test 2: Cliente aceita qualquer profissional
    tests.push(await this.runTest(
      "Cliente entra na fila - Aceita qualquer profissional",
      async () => {
        const testClientId = "test-client-2";
        const testServiceId = "test-service-1";
        
        const preferences: WaitlistPreferences = {
          professional_preferred_id: null,
          accepts_other_professional: true,
          accepts_nearby_time: true,
          accepts_any_time: true,
          notes: "Teste - aceita qualquer profissional",
        };
        
        const result = await waitlistManager.addToWaitlist(
          barbershopId,
          testClientId,
          testServiceId,
          "2024-12-20",
          "15:00",
          preferences
        );
        
        if (!result.success) {
          throw new Error(`Falha ao entrar na fila: ${result.error}`);
        }
        
        // Verificar se foi criado corretamente
        const { data: waitlist } = await supabase
          .from("waitlist_queue")
          .select("*")
          .eq("id", result.waitlistId)
          .single();
        
        if (!waitlist || waitlist.accepts_other_professional !== true) {
          throw new Error("Preferência de aceitar outros profissionais não foi salva");
        }
        
        return { waitlistId: result.waitlistId };
      }
    ));
    
    // Test 3: Processamento de liberação de vaga
    tests.push(await this.runTest(
      "Processamento de liberação de vaga",
      async () => {
        // Simular liberação de vaga
        const result = await waitlistManager.processSlotRelease(
          barbershopId,
          "2024-12-20",
          "14:00",
          "test-professional-1",
          "test-service-1"
        );
        
        if (!result.processed) {
          throw new Error("Liberação de vaga não foi processada");
        }
        
        return { processed: true, nextClientId: result.nextClientId };
      }
    ));
    
    // Test 4: Processamento de resposta do cliente
    tests.push(await this.runTest(
      "Processamento de resposta - Aceite",
      async () => {
        // Criar uma oferta simulada
        const { data: waitlist } = await supabase
          .from("waitlist_queue")
          .select("id")
          .eq("status", "offered")
          .limit(1)
          .single();
        
        if (!waitlist) {
          throw new Error("Nenhuma oferta encontrada para testar");
        }
        
        const result = await waitlistManager.processOfferResponse(
          waitlist.id,
          "accepted"
        );
        
        if (!result.success) {
          throw new Error(`Falha ao processar resposta: ${result.error}`);
        }
        
        return { waitlistId: waitlist.id, response: "accepted" };
      }
    ));
    
    // Test 5: Cliente tenta entrar duplicado na fila
    tests.push(await this.runTest(
      "Cliente duplicado na fila - Deve falhar",
      async () => {
        const testClientId = "test-client-duplicate";
        const testServiceId = "test-service-1";
        
        const preferences: WaitlistPreferences = {
          professional_preferred_id: null,
          accepts_other_professional: true,
          accepts_nearby_time: false,
          accepts_any_time: false,
        };
        
        // Primeira entrada
        const result1 = await waitlistManager.addToWaitlist(
          barbershopId,
          testClientId,
          testServiceId,
          "2024-12-20",
          "16:00",
          preferences
        );
        
        if (!result1.success) {
          throw new Error("Primeira entrada deveria funcionar");
        }
        
        // Segunda entrada (deve falhar)
        const result2 = await waitlistManager.addToWaitlist(
          barbershopId,
          testClientId,
          testServiceId,
          "2024-12-20",
          "17:00",
          preferences
        );
        
        if (result2.success) {
          throw new Error("Segunda entrada deveria falhar");
        }
        
        return { firstEntry: result1.waitlistId, secondEntryFailed: true };
      }
    ));
    
    return this.createTestSuite("Fila de Espera", tests);
  }

  /**
   * Testes de Antecipação
   */
  private async testAnticipationSystem(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Busca oportunidades de antecipação
    tests.push(await this.runTest(
      "Busca oportunidades de antecipação",
      async () => {
        const opportunities = await anticipationManager.findAnticipationOpportunities(
          barbershopId,
          "test-client-anticipation",
          4 // 4 horas de janela
        );
        
        if (!Array.isArray(opportunities)) {
          throw new Error("Resultado deveria ser um array");
        }
        
        return { opportunities, count: opportunities.length };
      }
    ));
    
    // Test 2: Envio de oferta de antecipação
    tests.push(await this.runTest(
      "Envio de oferta de antecipação",
      async () => {
        const opportunity = {
          appointmentId: "test-appointment-1",
          clientId: "test-client-anticipation",
          currentScheduledAt: "2024-12-20T19:00:00Z",
          earlierSlot: {
            date: "2024-12-20",
            time: "17:30",
            professionalId: "test-professional-1",
            serviceId: "test-service-1",
          },
          timeDifference: 90, // 90 minutos
        };
        
        const result = await anticipationManager.sendAnticipationOffer(opportunity);
        
        if (!result.success) {
          throw new Error(`Falha ao enviar oferta: ${result.error}`);
        }
        
        return { offerId: result.offerId };
      }
    ));
    
    // Test 3: Processamento de aceite de antecipação
    tests.push(await this.runTest(
      "Processamento de aceite de antecipação",
      async () => {
        // Buscar oferta pendente
        const { data: offer } = await supabase
          .from("anticipation_offers")
          .select("id")
          .eq("status", "pending")
          .limit(1)
          .single();
        
        if (!offer) {
          throw new Error("Nenhuma oferta de antecipação encontrada");
        }
        
        const result = await anticipationManager.processAnticipationResponse(
          offer.id,
          "accepted"
        );
        
        if (!result.success) {
          throw new Error(`Falha ao processar aceite: ${result.error}`);
        }
        
        return { offerId: offer.id, response: "accepted" };
      }
    ));
    
    return this.createTestSuite("Antecipação Automática", tests);
  }

  /**
   * Testes de Preço Dinâmico
   */
  private async testDynamicPricing(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Cálculo de preço dinâmico - horário normal
    tests.push(await this.runTest(
      "Cálculo de preço dinâmico - Horário normal",
      async () => {
        const result = await waitlistManager.calculateDynamicPrice(
          barbershopId,
          "test-service-1",
          "2024-12-18", // Quarta-feira
          "10:00", // Manhã
          50 // Preço base R$ 50
        );
        
        if (result.finalPrice !== 50) {
          throw new Error(`Preço deveria ser R$ 50, mas foi R$ ${result.finalPrice}`);
        }
        
        return { basePrice: 50, finalPrice: result.finalPrice, adjustment: result.adjustment };
      }
    ));
    
    // Test 2: Cálculo de preço dinâmico - horário de pico
    tests.push(await this.runTest(
      "Cálculo de preço dinâmico - Horário de pico",
      async () => {
        // Criar regra de preço dinâmico para sexta à noite
        await waitlistManager.saveDynamicPricingRule({
          barbershop_id: barbershopId,
          service_id: null, // Aplica a todos os serviços
          day_of_week: 5, // Sexta-feira
          start_time: "18:00",
          end_time: "22:00",
          price_type: "percentage",
          price_adjustment: 20, // +20%
          is_active: true,
          min_capacity_threshold: 80,
          description: "Teste - horário de pico",
        });
        
        const result = await waitlistManager.calculateDynamicPrice(
          barbershopId,
          "test-service-1",
          "2024-12-20", // Sexta-feira
          "20:00", // Noite (horário de pico)
          50 // Preço base R$ 50
        );
        
        const expectedPrice = 50 * 1.2; // R$ 60
        if (Math.abs(result.finalPrice - expectedPrice) > 0.01) {
          throw new Error(`Preço deveria ser R$ ${expectedPrice}, mas foi R$ ${result.finalPrice}`);
        }
        
        return { basePrice: 50, finalPrice: result.finalPrice, adjustment: result.adjustment };
      }
    ));
    
    // Test 3: Preço dinâmico desativado
    tests.push(await this.runTest(
      "Preço dinâmico desativado",
      async () => {
        // Desativar preço dinâmico
        await waitlistManager.updateAgendaSettings(barbershopId, {
          enable_dynamic_pricing: false,
        });
        
        const result = await waitlistManager.calculateDynamicPrice(
          barbershopId,
          "test-service-1",
          "2024-12-20",
          "20:00",
          50
        );
        
        if (result.finalPrice !== 50) {
          throw new Error("Preço dinâmico desativado deveria manter preço base");
        }
        
        return { basePrice: 50, finalPrice: result.finalPrice };
      }
    ));
    
    return this.createTestSuite("Preço Dinâmico", tests);
  }

  /**
   * Testes de Notificações
   */
  private async testNotificationSystem(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Envio de notificação de oferta
    tests.push(await this.runTest(
      "Envio de notificação de oferta",
      async () => {
        const result = await waitlistNotifications.sendSlotOfferNotification(
          "test-waitlist-1",
          "test-client-notification",
          "2024-12-20",
          "14:00",
          "Profissional Teste",
          "Corte Masculino",
          10
        );
        
        if (!result.success) {
          throw new Error(`Falha ao enviar notificação: ${result.error}`);
        }
        
        return { notificationId: result.notificationId };
      }
    ));
    
    // Test 2: Envio de notificação de antecipação
    tests.push(await this.runTest(
      "Envio de notificação de antecipação",
      async () => {
        const result = await waitlistNotifications.sendAnticipationNotification(
          "test-appointment-1",
          "test-client-notification",
          "2024-12-20T19:00:00Z",
          "2024-12-20T17:30:00Z",
          90,
          "Corte Masculino",
          10
        );
        
        if (!result.success) {
          throw new Error(`Falha ao enviar notificação: ${result.error}`);
        }
        
        return { notificationId: result.notificationId };
      }
    ));
    
    // Test 3: Processamento de resposta de notificação
    tests.push(await this.runTest(
      "Processamento de resposta de notificação",
      async () => {
        const result = await waitlistNotifications.processNotificationResponse(
          "test-notification-1",
          "accept_offer",
          { waitlistId: "test-waitlist-1" }
        );
        
        if (!result.success) {
          throw new Error(`Falha ao processar resposta: ${result.error}`);
        }
        
        return { action: "accept_offer", processed: true };
      }
    ));
    
    return this.createTestSuite("Sistema de Notificações", tests);
  }

  /**
   * Testes de Permissões
   */
  private async testPermissionSystem(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Configurações de permissões
    tests.push(await this.runTest(
      "Configurações de permissões",
      async () => {
        const settings = await waitlistManager.getAgendaSettings(barbershopId);
        
        if (!settings) {
          throw new Error("Configurações não encontradas");
        }
        
        // Atualizar configurações
        const updateResult = await waitlistManager.updateAgendaSettings(barbershopId, {
          allow_professionals_view_queue: true,
          allow_professionals_offer_slots: false,
          enable_dynamic_pricing: true,
          allow_professionals_view_dynamic_pricing: false,
        });
        
        if (!updateResult.success) {
          throw new Error(`Falha ao atualizar configurações: ${updateResult.error}`);
        }
        
        // Verificar se foram salvas
        const updatedSettings = await waitlistManager.getAgendaSettings(barbershopId);
        
        if (!updatedSettings || !updatedSettings.allow_professionals_view_queue) {
          throw new Error("Configurações não foram salvas corretamente");
        }
        
        return { settings: updatedSettings };
      }
    ));
    
    // Test 2: Regras de preço dinâmico
    tests.push(await this.runTest(
      "CRUD de regras de preço dinâmico",
      async () => {
        // Criar regra
        const createResult = await waitlistManager.saveDynamicPricingRule({
          barbershop_id: barbershopId,
          service_id: "test-service-1",
          day_of_week: 6, // Sábado
          start_time: "09:00",
          end_time: "12:00",
          price_type: "fixed",
          price_adjustment: 10, // +R$ 10
          is_active: true,
          min_capacity_threshold: 90,
          description: "Teste - sábado manhã",
        });
        
        if (!createResult.success) {
          throw new Error(`Falha ao criar regra: ${createResult.error}`);
        }
        
        // Listar regras
        const rules = await waitlistManager.getDynamicPricingRules(barbershopId);
        
        if (!Array.isArray(rules)) {
          throw new Error("Lista de regras deveria ser um array");
        }
        
        // Excluir regra
        const deleteResult = await waitlistManager.deleteDynamicPricingRule(
          createResult.ruleId!,
          barbershopId
        );
        
        if (!deleteResult.success) {
          throw new Error(`Falha ao excluir regra: ${deleteResult.error}`);
        }
        
        return { 
          created: createResult.ruleId, 
          rulesCount: rules.length, 
          deleted: true 
        };
      }
    ));
    
    return this.createTestSuite("Sistema de Permissões", tests);
  }

  /**
   * Testes de Integração
   */
  private async testIntegrationScenarios(barbershopId: string): Promise<TestSuite> {
    const tests: TestResult[] = [];
    
    // Test 1: Fluxo completo - Cliente entra na fila e recebe oferta
    tests.push(await this.runTest(
      "Fluxo completo - Entrada na fila e oferta",
      async () => {
        // 1. Cliente entra na fila
        const preferences: WaitlistPreferences = {
          professional_preferred_id: "test-professional-1",
          accepts_other_professional: true,
          accepts_nearby_time: true,
          accepts_any_time: false,
        };
        
        const waitlistResult = await waitlistManager.addToWaitlist(
          barbershopId,
          "test-client-integration",
          "test-service-1",
          "2024-12-20",
          "15:00",
          preferences
        );
        
        if (!waitlistResult.success) {
          throw new Error(`Falha ao entrar na fila: ${waitlistResult.error}`);
        }
        
        // 2. Simular liberação de vaga
        const slotResult = await waitlistManager.processSlotRelease(
          barbershopId,
          "2024-12-20",
          "14:30",
          "test-professional-1",
          "test-service-1"
        );
        
        if (!slotResult.processed) {
          throw new Error("Liberação de vaga não foi processada");
        }
        
        // 3. Verificar se oferta foi criada
        const { data: updatedWaitlist } = await supabase
          .from("waitlist_queue")
          .select("status, offered_at")
          .eq("id", waitlistResult.waitlistId)
          .single();
        
        if (!updatedWaitlist || updatedWaitlist.status !== "offered") {
          throw new Error("Oferta não foi criada corretamente");
        }
        
        return {
          waitlistId: waitlistResult.waitlistId,
          slotProcessed: slotResult.processed,
          offerCreated: updatedWaitlist.status === "offered"
        };
      }
    ));
    
    // Test 2: Fluxo de antecipação completa
    tests.push(await this.runTest(
      "Fluxo completo - Antecipação automática",
      async () => {
        // 1. Buscar oportunidades
        const opportunities = await anticipationManager.findAnticipationOpportunities(
          barbershopId,
          "test-client-integration",
          4
        );
        
        // 2. Se houver oportunidade, enviar oferta
        if (opportunities.length > 0) {
          const offerResult = await anticipationManager.sendAnticipationOffer(
            opportunities[0]
          );
          
          if (!offerResult.success) {
            throw new Error(`Falha ao enviar oferta de antecipação: ${offerResult.error}`);
          }
          
          // 3. Processar aceite
          const responseResult = await anticipationManager.processAnticipationResponse(
            offerResult.offerId!,
            "accepted"
          );
          
          if (!responseResult.success) {
            throw new Error(`Falha ao processar aceite: ${responseResult.error}`);
          }
          
          return {
            opportunitiesFound: opportunities.length,
            offerSent: offerResult.success,
            offerAccepted: responseResult.success
          };
        }
        
        return { opportunitiesFound: 0, message: "Nenhuma oportunidade encontrada" };
      }
    ));
    
    return this.createTestSuite("Cenários de Integração", tests);
  }

  /**
   * Executa um teste individual
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[TEST] Executando: ${testName}`);
      
      const result = await testFunction();
      
      const duration = Date.now() - startTime;
      
      console.log(`[TEST] ✅ ${testName} (${duration}ms)`);
      
      return {
        testName,
        passed: true,
        details: result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`[TEST] ❌ ${testName} (${duration}ms): ${error}`);
      
      return {
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  /**
   * Cria uma suite de testes
   */
  private createTestSuite(name: string, tests: TestResult[]): TestSuite {
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
    
    console.log(`[SUITE] ${name}: ${passed}/${tests.length} passaram (${totalDuration}ms)`);
    
    return {
      name,
      tests,
      passed,
      failed,
      totalDuration
    };
  }

  /**
   * Limpa dados de teste
   */
  async cleanupTestData(barbershopId: string): Promise<void> {
    try {
      console.log("[CLEANUP] Limpando dados de teste...");
      
      // Limpar entradas na fila de teste
      await supabase
        .from("waitlist_queue")
        .delete()
        .like("client_id", "test-client-%");
      
      // Limpar ofertas de antecipação de teste
      await supabase
        .from("anticipation_offers")
        .delete()
        .like("client_id", "test-client-%");
      
      // Limpar notificações de teste
      await supabase
        .from("notifications")
        .delete()
        .like("user_id", "test-client-%");
      
      // Limpar regras de preço dinâmico de teste
      await supabase
        .from("dynamic_pricing")
        .delete()
        .like("description", "Teste - %");
      
      console.log("[CLEANUP] Dados de teste limpos com sucesso");
    } catch (error) {
      console.error("[CLEANUP] Erro ao limpar dados de teste:", error);
    }
  }

  /**
   * Gera relatório dos testes
   */
  generateReport(testSuites: TestSuite[]): string {
    let report = "# Relatório de Testes - Sistema de Fila Inteligente\n\n";
    
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
    const totalDuration = testSuites.reduce((sum, suite) => sum + suite.totalDuration, 0);
    
    report += `## Resumo\n\n`;
    report += `- **Total de Testes**: ${totalTests}\n`;
    report += `- **Passaram**: ${totalPassed} ✅\n`;
    report += `- **Falharam**: ${totalFailed} ❌\n`;
    report += `- **Taxa de Sucesso**: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`;
    report += `- **Duração Total**: ${totalDuration}ms\n\n`;
    
    for (const suite of testSuites) {
      report += `## ${suite.name}\n\n`;
      report += `- **Passaram**: ${suite.passed}/${suite.tests.length}\n`;
      report += `- **Duração**: ${suite.totalDuration}ms\n\n`;
      
      for (const test of suite.tests) {
        const status = test.passed ? "✅" : "❌";
        report += `### ${status} ${test.testName}\n`;
        report += `- **Duração**: ${test.duration}ms\n`;
        
        if (!test.passed) {
          report += `- **Erro**: ${test.error}\n`;
        }
        
        report += "\n";
      }
      
      report += "---\n\n";
    }
    
    return report;
  }
}

export const waitlistTests = new WaitlistTests();
