// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IntegrationTest {
  id: string;
  name: string;
  type: 'payment' | 'sms' | 'whatsapp' | 'email' | 'webhook';
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export class IntegrationTester {
  private static tests: IntegrationTest[] = [];

  // Testar Gateway de Pagamento (Asaas)
  static async testPaymentGateway(): Promise<IntegrationTest> {
    const test: IntegrationTest = {
      id: 'payment-gateway',
      name: 'Gateway de Pagamento (Asaas)',
      type: 'payment',
      status: 'running'
    };

    try {
      const startTime = Date.now();

      // Buscar configuração do Asaas
      const { data: config, error: configError } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider_name', 'asaas')
        .eq('environment', 'production')
        .single();

      if (configError || !config) {
        throw new Error('Configuração do Asaas não encontrada');
      }

      if (!config.api_key_encrypted) {
        throw new Error('API Key não configurada');
      }

      // Testar conexão com API do Asaas
      const response = await fetch(`${config.base_url}/customers?limit=1`, {
        method: 'GET',
        headers: {
          'access_token': config.api_key_encrypted,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      test.status = 'success';
      test.result = {
        api_status: response.status,
        customers_count: data.totalCount || 0,
        connection: 'ok'
      };
      test.duration = Date.now() - startTime;

      toast.success('Gateway de pagamento testado com sucesso!');
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message;
      test.duration = Date.now() - Date.now();
      
      toast.error(`Erro no gateway de pagamento: ${error.message}`);
    }

    return test;
  }

  // Testar SMS (Twilio)
  static async testSMS(): Promise<IntegrationTest> {
    const test: IntegrationTest = {
      id: 'sms-twilio',
      name: 'SMS (Twilio)',
      type: 'sms',
      status: 'running'
    };

    try {
      const startTime = Date.now();

      // Buscar configuração do Twilio
      const { data: config, error: configError } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider_name', 'twilio')
        .eq('environment', 'production')
        .single();

      if (configError || !config) {
        throw new Error('Configuração do Twilio não encontrada');
      }

      if (!config.api_key_encrypted || !config.api_secret_encrypted) {
        throw new Error('Credenciais do Twilio não configuradas');
      }

      // Testar conexão com API do Twilio
      const auth = btoa(`${config.api_key_encrypted}:${config.api_secret_encrypted}`);
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      test.status = 'success';
      test.result = {
        account_sid: data.accounts?.[0]?.sid,
        account_status: 'active',
        connection: 'ok'
      };
      test.duration = Date.now() - startTime;

      toast.success('SMS Twilio testado com sucesso!');
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message;
      
      toast.error(`Erro no SMS Twilio: ${error.message}`);
    }

    return test;
  }

  // Testar Email (Resend)
  static async testEmail(): Promise<IntegrationTest> {
    const test: IntegrationTest = {
      id: 'email-resend',
      name: 'Email (Resend)',
      type: 'email',
      status: 'running'
    };

    try {
      const startTime = Date.now();

      // Buscar configuração do Resend
      const { data: config, error: configError } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider_name', 'resend')
        .eq('environment', 'production')
        .single();

      if (configError || !config) {
        throw new Error('Configuração do Resend não encontrada');
      }

      if (!config.api_key_encrypted) {
        throw new Error('API Key do Resend não configurada');
      }

      // Testar conexão com API do Resend
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_key_encrypted}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      test.status = 'success';
      test.result = {
        domains_count: data.data?.length || 0,
        connection: 'ok'
      };
      test.duration = Date.now() - startTime;

      toast.success('Email Resend testado com sucesso!');
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message;
      
      toast.error(`Erro no Email Resend: ${error.message}`);
    }

    return test;
  }

  // Testar Webhooks
  static async testWebhooks(): Promise<IntegrationTest> {
    const test: IntegrationTest = {
      id: 'webhooks',
      name: 'Webhooks Configurados',
      type: 'webhook',
      status: 'running'
    };

    try {
      const startTime = Date.now();

      // Buscar webhooks ativos
      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('is_active', true);

      if (webhooksError) {
        throw new Error('Erro ao buscar webhooks');
      }

      // Testar cada webhook
      const results = [];
      for (const webhook of webhooks || []) {
        try {
          const { data: testResult } = await supabase.rpc('test_webhook', {
            p_webhook_config_id: webhook.id
          });

          if (testResult && testResult.length > 0) {
            results.push({
              service: webhook.service_name,
              success: testResult[0].success,
              status_code: testResult[0].status_code,
              duration: testResult[0].duration_ms
            });
          }
        } catch (error) {
          results.push({
            service: webhook.service_name,
            success: false,
            error: error.message
          });
        }
      }

      test.status = 'success';
      test.result = {
        total_webhooks: webhooks?.length || 0,
        tested_webhooks: results.length,
        results
      };
      test.duration = Date.now() - startTime;

      toast.success('Webhooks testados com sucesso!');
    } catch (error: any) {
      test.status = 'error';
      test.error = error.message;
      
      toast.error(`Erro nos webhooks: ${error.message}`);
    }

    return test;
  }

  // Executar todos os testes
  static async runAllTests(): Promise<IntegrationTest[]> {
    this.tests = [];

    const tests = [
      this.testPaymentGateway(),
      this.testSMS(),
      this.testEmail(),
      this.testWebhooks()
    ];

    const results = await Promise.all(tests);
    this.tests = results;

    return results;
  }

  // Obter status dos testes
  static getTestResults(): IntegrationTest[] {
    return this.tests;
  }

  // Limpar resultados
  static clearResults(): void {
    this.tests = [];
  }

  // Verificar se todos os testes passaram
  static allTestsPassed(): boolean {
    return this.tests.every(test => test.status === 'success');
  }

  // Obter resumo dos testes
  static getTestSummary(): {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  } {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'success').length;
    const failed = this.tests.filter(t => t.status === 'error').length;
    const pending = this.tests.filter(t => t.status === 'pending').length;

    return { total, passed, failed, pending };
  }
}
