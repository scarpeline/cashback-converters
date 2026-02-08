/**
 * API Integration Configuration
 * Gerenciamento centralizado de APIs com suporte a sandbox/produção
 */

export type Environment = 'sandbox' | 'production';
export type ServiceName = 'asaas' | 'resend';

export interface ApiConfig {
  service: ServiceName;
  environment: Environment;
  apiKey: string;
  webhookSecret?: string;
  baseUrl: string;
  fromEmail?: string;
  isActive: boolean;
}

// Base URLs por serviço e ambiente
export const SERVICE_BASE_URLS: Record<ServiceName, Record<Environment, string>> = {
  asaas: {
    sandbox: 'https://sandbox.asaas.com/api/v3',
    production: 'https://api.asaas.com/api/v3',
  },
  resend: {
    sandbox: 'https://api.resend.com',
    production: 'https://api.resend.com',
  },
};

// Configuração de validação de chaves
export const KEY_VALIDATION_PATTERNS: Record<ServiceName, Record<Environment, RegExp>> = {
  asaas: {
    sandbox: /^\$aact_[a-zA-Z0-9]+$/,  // Sandbox key pattern
    production: /^\$aact_[a-zA-Z0-9]+$/, // Production key pattern
  },
  resend: {
    sandbox: /^re_[a-zA-Z0-9]+$/,
    production: /^re_[a-zA-Z0-9]+$/,
  },
};

/**
 * Valida se a chave está no formato correto para o ambiente
 */
export function validateApiKey(service: ServiceName, environment: Environment, key: string): boolean {
  const pattern = KEY_VALIDATION_PATTERNS[service]?.[environment];
  if (!pattern) return true; // Se não houver padrão, aceita
  return pattern.test(key);
}

/**
 * Retorna a URL base para o serviço no ambiente especificado
 */
export function getBaseUrl(service: ServiceName, environment: Environment): string {
  return SERVICE_BASE_URLS[service][environment];
}

/**
 * Valida se não está misturando chaves de ambiente
 */
export function isEnvironmentMismatch(service: ServiceName, apiKey: string, targetEnv: Environment): boolean {
  // Asaas não diferencia chaves por prefixo, então precisamos confiar na configuração
  // Resend também usa o mesmo prefixo para ambos
  return false;
}

/**
 * Log de integração
 */
export interface IntegrationLog {
  service: ServiceName;
  environment: Environment;
  eventType: 'API_CALL' | 'API_FAIL' | 'WEBHOOK';
  status: 'success' | 'error';
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Formata log para console
 */
export function formatIntegrationLog(log: IntegrationLog): string {
  const prefix = log.status === 'success' ? '[API_CALL]' : '[API_FAIL]';
  return `${prefix}
  service: ${log.service.toUpperCase()}
  env: ${log.environment}
  status: ${log.status}
  ${log.errorMessage ? `error: ${log.errorMessage}` : ''}`;
}
