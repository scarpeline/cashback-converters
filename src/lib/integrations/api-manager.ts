/**
 * API Manager - Gerenciador centralizado de integrações
 * Controla chaves de API, alternância de ambiente e logs
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Environment, ServiceName, IntegrationLog } from "./api-config";
import { getBaseUrl, formatIntegrationLog } from "./api-config";

interface IntegrationSetting {
  id: string;
  service_name: string;
  environment: string;
  api_key_hash: string | null;
  webhook_secret_hash: string | null;
  base_url: string | null;
  from_email: string | null;
  is_active: boolean;
}

interface AppEnvironment {
  id: string;
  current_env: string;
  updated_at: string;
}

class ApiManager {
  private currentEnvironment: Environment = 'sandbox';
  private settings: Map<string, IntegrationSetting> = new Map();
  private initialized = false;

  /**
   * Inicializa o manager carregando configurações do banco
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Carregar ambiente atual
      const { data: envData } = await (supabase as any)
        .from('app_environment')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (envData) {
        this.currentEnvironment = envData.current_env as Environment;
      }

      // Carregar configurações de integração
      const { data: settingsData } = await (supabase as any)
        .from('integration_settings')
        .select('*');

      if (settingsData) {
        settingsData.forEach((setting) => {
          const key = `${setting.service_name}_${setting.environment}`;
          this.settings.set(key, setting as IntegrationSetting);
        });
      }

      this.initialized = true;
      console.log(`[API_MANAGER] Initialized with environment: ${this.currentEnvironment}`);
    } catch (error) {
      console.error('[API_MANAGER] Failed to initialize:', error);
    }
  }

  /**
   * Retorna o ambiente atual (sandbox ou production)
   */
  getEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Alterna o ambiente global
   */
  async setEnvironment(env: Environment): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('app_environment')
        .update({ 
          current_env: env, 
          updated_at: new Date().toISOString() 
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;

      this.currentEnvironment = env;
      console.log(`[API_MANAGER] Environment switched to: ${env}`);
      return true;
    } catch (error) {
      console.error('[API_MANAGER] Failed to set environment:', error);
      return false;
    }
  }

  /**
   * Obtém configuração de um serviço para o ambiente atual
   */
  getServiceConfig(service: ServiceName): IntegrationSetting | null {
    const key = `${service}_${this.currentEnvironment}`;
    return this.settings.get(key) || null;
  }

  /**
   * Verifica se um serviço está ativo no ambiente atual
   */
  isServiceActive(service: ServiceName): boolean {
    const config = this.getServiceConfig(service);
    return config?.is_active ?? false;
  }

  /**
   * Retorna a URL base de um serviço para o ambiente atual
   */
  getServiceBaseUrl(service: ServiceName): string {
    const config = this.getServiceConfig(service);
    return config?.base_url || getBaseUrl(service, this.currentEnvironment);
  }

  /**
   * Registra log de integração
   */
  async logIntegration(log: IntegrationLog): Promise<void> {
    // Log no console
    console.log(formatIntegrationLog(log));

    // Tentar salvar no banco (não bloqueia a execução)
    try {
      await (supabase as any).from('integration_logs').insert([{
        service: log.service,
        environment: log.environment,
        event_type: log.eventType,
        status: log.status,
        request_data: (log.requestData as Json) ?? null,
        response_data: (log.responseData as Json) ?? null,
        error_message: log.errorMessage ?? null,
      }]);
    } catch (error) {
      console.error('[API_MANAGER] Failed to save log:', error);
    }
  }

  /**
   * Limpa cache e reinicializa
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    this.settings.clear();
    await this.initialize();
  }
}

// Instância singleton
export const apiManager = new ApiManager();

// Hook para React
export function useApiManager() {
  return apiManager;
}
