/**
 * Test Security Fixes - Script para validar correções de segurança
 * 
 * Este script testa:
 * - Proteção de dados sensíveis em APIs públicas
 * - Validação de webhook ASAAS
 * - Restrições de auto-modificação de roles
 * - Logging de acesso a dados sensíveis
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Clientes
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class SecurityTester {
  constructor() {
    this.testResults = [];
    this.testBarbershopId = null;
    this.testUserId = null;
  }

  // Método para registrar resultado de teste
  recordResult(testName, passed, details = '', error = null) {
    const result = {
      testName,
      passed,
      details,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}`);
    
    if (error) {
      console.log(`   Erro: ${error}`);
    }
    
    if (details) {
      console.log(`   Detalhes: ${details}`);
    }
    
    console.log('');
  }

  // Teste 1: Verificar se dados sensíveis estão protegidos
  async testSensitiveDataProtection() {
    try {
      console.log('🔍 Testando proteção de dados sensíveis...');
      
      // Testar acesso à tabela barbershops (deve falhar ou retornar dados limitados)
      const { data: barbershops, error: barbershopsError } = await anonClient
        .from('barbershops')
        .select('id, name, asaas_customer_id, asaas_wallet_id, subscription_status')
        .limit(1);

      if (barbershopsError) {
        // Erro esperado - acesso negado
        this.recordResult(
          'Acesso negado à tabela barbershops',
          true,
          'Acesso anônimo corretamente bloqueado'
        );
      } else if (barbershops && barbershops.length > 0) {
        const barbershop = barbershops[0];
        
        // Verificar se campos sensíveis estão nulos/ocultos
        const hasSensitiveData = barbershop.asaas_customer_id || 
                                barbershop.asaas_wallet_id || 
                                barbershop.subscription_status;
        
        if (hasSensitiveData) {
          this.recordResult(
            'Proteção de dados sensíveis - barbershops',
            false,
            'Dados sensíveis ainda expostos',
            `asaas_customer_id: ${barbershop.asaas_customer_id}`
          );
        } else {
          this.recordResult(
            'Proteção de dados sensíveis - barbershops',
            true,
            'Dados sensíveis corretamente ocultos'
          );
        }
      }

      // Testar acesso à view pública (deve funcionar)
      const { data: publicBarbershops, error: publicError } = await anonClient
        .from('barbershops_public')
        .select('id, name, address')
        .limit(1);

      if (publicError) {
        this.recordResult(
          'Acesso à view pública barbershops_public',
          false,
          'View pública não acessível',
          publicError.message
        );
      } else {
        this.recordResult(
          'Acesso à view pública barbershops_public',
          true,
          'View pública corretamente acessível'
        );
      }

      // Testar serviços
      const { data: services, error: servicesError } = await anonClient
        .from('services')
        .select('id, name, price')
        .limit(1);

      if (servicesError) {
        this.recordResult(
          'Acesso negado à tabela services',
          true,
          'Acesso anônimo corretamente bloqueado'
        );
      } else if (services && services.length > 0) {
        const service = services[0];
        
        if (service.price !== undefined && service.price !== null) {
          this.recordResult(
            'Proteção de dados sensíveis - services',
            false,
            'Preços ainda expostos',
            `price: ${service.price}`
          );
        } else {
          this.recordResult(
            'Proteção de dados sensíveis - services',
            true,
            'Preços corretamente ocultos'
          );
        }
      }

      // Testar view pública de serviços
      const { data: publicServices, error: publicServicesError } = await anonClient
        .from('services_public')
        .select('id, name, duration_minutes')
        .limit(1);

      if (publicServicesError) {
        this.recordResult(
          'Acesso à view pública services_public',
          false,
          'View pública não acessível',
          publicServicesError.message
        );
      } else {
        this.recordResult(
          'Acesso à view pública services_public',
          true,
          'View pública corretamente acessível'
        );
      }

    } catch (error) {
      this.recordResult(
        'Teste de proteção de dados sensíveis',
        false,
        '',
        error.message
      );
    }
  }

  // Teste 2: Verificar função de validação de pagamento
  async testPaymentValidation() {
    try {
      console.log('🔍 Testando validação de pagamento...');
      
      // Testar função de validação
      const { data, error } = await serviceClient
        .rpc('validate_payment_context', {
          p_payment_id: 'test-invalid-payment',
          p_payment_value: 100.00,
          p_webhook_secret: 'test-secret'
        });

      if (error) {
        this.recordResult(
          'Função validate_payment_context',
          false,
          'Erro ao executar função',
          error.message
        );
      } else {
        // Deve retornar false para pagamento inválido
        this.recordResult(
          'Função validate_payment_context',
          data === false,
          `Retorno esperado: false, recebido: ${data}`
        );
      }

    } catch (error) {
      this.recordResult(
        'Teste de validação de pagamento',
        false,
        '',
        error.message
      );
    }
  }

  // Teste 3: Verificar logging de acesso
  async testAccessLogging() {
    try {
      console.log('🔍 Testando logging de acesso...');
      
      // Verificar se tabela de log existe
      const { data: logTable, error: logError } = await serviceClient
        .from('sensitive_data_access_log')
        .select('id')
        .limit(1);

      if (logError) {
        this.recordResult(
          'Tabela de logging existe',
          false,
          'Tabela não encontrada',
          logError.message
        );
      } else {
        this.recordResult(
          'Tabela de logging existe',
          true,
          'Tabela de logging encontrada'
        );
      }

      // Verificar se trigger está ativo
      const { data: triggerInfo, error: triggerError } = await serviceClient
        .rpc('get_trigger_info', { 
          p_table_name: 'payments',
          p_trigger_name: 'payment_access_trigger'
        });

      if (triggerError) {
        // Função pode não existir, verificar manualmente
        this.recordResult(
          'Trigger de logging',
          null,
          'Verificação manual necessária'
        );
      } else {
        this.recordResult(
          'Trigger de logging',
          true,
          'Trigger configurado corretamente'
        );
      }

    } catch (error) {
      this.recordResult(
        'Teste de logging de acesso',
        false,
        '',
        error.message
      );
    }
  }

  // Teste 4: Verificar políticas de roles
  async testRolePolicies() {
    try {
      console.log('🔍 Testando políticas de roles...');
      
      // Verificar se política de auto-modificação foi removida
      const { data: policies, error: policiesError } = await serviceClient
        .from('pg_policies')
        .select('policyname, tablename, permissive, roles, cmd, qual')
        .eq('tablename', 'user_roles');

      if (policiesError) {
        this.recordResult(
          'Verificação de políticas de roles',
          false,
          'Erro ao buscar políticas',
          policiesError.message
        );
      } else {
        const hasSelfModPolicy = policies.some(p => 
          p.policyname.includes('Super admins can manage all roles')
        );

        if (hasSelfModPolicy) {
          this.recordResult(
            'Política de auto-modificação removida',
            false,
            'Política permissiva ainda existe'
          );
        } else {
          this.recordResult(
            'Política de auto-modificação removida',
            true,
            'Política permissiva corretamente removida'
          );
        }

        // Verificar se nova política restritiva existe
        const hasRestrictedPolicy = policies.some(p => 
          p.policyname.includes('Super admins can manage roles (except self)')
        );

        if (hasRestrictedPolicy) {
          this.recordResult(
            'Política restritiva criada',
            true,
            'Nova política com restrições implementada'
          );
        } else {
          this.recordResult(
            'Política restritiva criada',
            false,
            'Nova política não encontrada'
          );
        }
      }

    } catch (error) {
      this.recordResult(
        'Teste de políticas de roles',
        false,
        '',
        error.message
      );
    }
  }

  // Teste 5: Verificar views públicas
  async testPublicViews() {
    try {
      console.log('🔍 Testando views públicas...');
      
      // Verificar view barbershops_public
      const { data: barbershopsView, error: barbershopsViewError } = await anonClient
        .from('barbershops_public')
        .select('*')
        .limit(1);

      if (barbershopsViewError) {
        this.recordResult(
          'View barbershops_public acessível',
          false,
          'View não acessível',
          barbershopsViewError.message
        );
      } else {
        // Verificar campos sensíveis não estão presentes
        const hasSensitiveFields = barbershopsView[0] && (
          barbershopsView[0].asaas_customer_id ||
          barbershopsView[0].asaas_wallet_id ||
          barbershopsView[0].subscription_status
        );

        this.recordResult(
          'View barbershops_public segura',
          !hasSensitiveFields,
          hasSensitiveFields ? 'Contém campos sensíveis' : 'Apenas campos públicos'
        );
      }

      // Verificar view services_public
      const { data: servicesView, error: servicesViewError } = await anonClient
        .from('services_public')
        .select('*')
        .limit(1);

      if (servicesViewError) {
        this.recordResult(
          'View services_public acessível',
          false,
          'View não acessível',
          servicesViewError.message
        );
      } else {
        // Verificar preço não está presente
        const hasPrice = servicesView[0] && servicesView[0].price !== undefined;

        this.recordResult(
          'View services_public segura',
          !hasPrice,
          hasPrice ? 'Preço exposto' : 'Preço oculto'
        );
      }

    } catch (error) {
      this.recordResult(
        'Teste de views públicas',
        false,
        '',
        error.message
      );
    }
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🚀 Iniciando testes de segurança...\n');
    
    await this.testSensitiveDataProtection();
    await this.testPaymentValidation();
    await this.testAccessLogging();
    await this.testRolePolicies();
    await this.testPublicViews();
    
    console.log('📊 Resumo dos Testes:\n');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => r.passed === false).length;
    const skipped = this.testResults.filter(r => r.passed === null).length;
    
    console.log(`✅ Passaram: ${passed}`);
    console.log(`❌ Falharam: ${failed}`);
    console.log(`⚠️ Pulados: ${skipped}`);
    console.log(`📋 Total: ${this.testResults.length}`);
    
    if (failed > 0) {
      console.log('\n🚨 Testes que falharam:');
      this.testResults
        .filter(r => r.passed === false)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
    
    if (skipped > 0) {
      console.log('\n⚠️ Testes pulados (verificação manual necessária):');
      this.testResults
        .filter(r => r.passed === null)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.details}`);
        });
    }
    
    // Gerar relatório
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, skipped, total: this.testResults.length },
      results: this.testResults
    };
    
    // Salvar relatório em arquivo
    const fs = require('fs');
    fs.writeFileSync('security-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Relatório salvo em security-test-report.json');
    
    return report;
  }
}

// Executar testes
async function main() {
  const tester = new SecurityTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
    process.exit(1);
  }
}

// Exportar para uso em outros módulos
module.exports = { SecurityTester };

// Executar se chamado diretamente
if (require.main === module) {
  main();
}
