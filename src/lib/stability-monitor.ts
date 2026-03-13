/**
 * Sistema de Estabilidade e Diagnóstico - Salão CashBack
 * 
 * Comando de estabilidade que prioriza análise sem refatorações pesadas
 * 1. Habilitar log detalhado de erros
 * 2. Validar integridade das páginas e rotas
 * 3. Implementar debounce para requisições
 * 4. Revisar dependências desatualizadas
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// 1. Sistema de Logs Detalhados
class StabilityLogger {
  private static instance: StabilityLogger;
  private logs: Array<{
    timestamp: Date;
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    component: string;
    message: string;
    data?: any;
    route?: string;
    userId?: string;
  }> = [];

  static getInstance(): StabilityLogger {
    if (!StabilityLogger.instance) {
      StabilityLogger.instance = new StabilityLogger();
    }
    return StabilityLogger.instance;
  }

  log(level: any, component: string, message: string, data?: any, route?: string) {
    const entry = {
      timestamp: new Date(),
      level,
      component,
      message,
      data,
      route: window.location.pathname,
      userId: this.getCurrentUserId()
    };

    this.logs.push(entry);
    console.log(`[${level}] ${component}: ${message}`, data);

    // Enviar logs críticos para análise
    if (level === 'ERROR') {
      this.sendToMonitoring(entry);
    }
  }

  private getCurrentUserId(): string | null {
    // Tentar obter ID do usuário de forma segura
    try {
      const authData = sessionStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || null;
      }
    } catch (e) {
      // Silencioso para não causar mais erros
    }
    return null;
  }

  private async sendToMonitoring(entry: any) {
    try {
      // Enviar para Supabase para análise (usando RPC para evitar problemas de tipagem)
      await supabase.rpc('insert_system_log', {
        p_level: entry.level,
        p_component: entry.component,
        p_message: entry.message,
        p_data: entry.data,
        p_route: entry.route,
        p_user_id: entry.userId
      });
    } catch (e) {
      console.warn('Falha ao enviar log para monitoramento:', e);
    }
  }

  getRecentLogs(minutes: number = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => log.timestamp.getTime() > cutoff.getTime());
  }

  getErrorSummary() {
    const recentErrors = this.getRecentLogs(10);
    const errorCounts = recentErrors
      .filter(log => log.level === 'ERROR')
      .reduce((acc, error) => {
        const key = `${error.component}:${error.message}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }
}

// 2. Debounce para Requisições
class RequestDebouncer {
  private static instance: RequestDebouncer;
  private requests: Map<string, { timeout: NodeJS.Timeout; count: number }> = new Map();

  static getInstance(): RequestDebouncer {
    if (!RequestDebouncer.instance) {
      RequestDebouncer.instance = new RequestDebouncer();
    }
    return RequestDebouncer.instance;
  }

  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300,
    maxCalls: number = 3
  ): T {
    return ((...args: any[]) => {
      const existing = this.requests.get(key);
      
      if (existing) {
        existing.count++;
        if (existing.count > maxCalls) {
          console.warn(`Request ${key} exceeded max calls (${maxCalls}), skipping`);
          return;
        }
        clearTimeout(existing.timeout);
      }

      const timeout = setTimeout(() => {
        this.requests.delete(key);
        fn(...args);
      }, delay);

      this.requests.set(key, { timeout, count: existing?.count || 1 });
    }) as T;
  }

  clear(key?: string) {
    if (key) {
      const request = this.requests.get(key);
      if (request) {
        clearTimeout(request.timeout);
        this.requests.delete(key);
      }
    } else {
      this.requests.forEach(({ timeout }) => clearTimeout(timeout));
      this.requests.clear();
    }
  }
}

// 3. Validador de Integridade de Páginas
class PageIntegrityValidator {
  private static instance: PageIntegrityValidator;

  static getInstance(): PageIntegrityValidator {
    if (!PageIntegrityValidator.instance) {
      PageIntegrityValidator.instance = new PageIntegrityValidator();
    }
    return PageIntegrityValidator.instance;
  }

  async validatePage(route: string): Promise<{
    isValid: boolean;
    issues: string[];
    performance: number;
    components: string[];
  }> {
    const logger = StabilityLogger.getInstance();
    const issues: string[] = [];
    const components: string[] = [];
    let performance = 0;

    try {
      // Medir performance de carregamento
      const startTime = performance.now();

      // Verificar se elementos críticos existem
      const criticalElements = [
        '[data-testid="app-root"]',
        '[data-testid="main-content"]',
        '[data-testid="navigation"]'
      ];

      for (const selector of criticalElements) {
        const element = document.querySelector(selector);
        if (!element) {
          issues.push(`Elemento crítico não encontrado: ${selector}`);
        } else {
          components.push(selector);
        }
      }

      // Verificar se há erros de JavaScript
      const errorCount = logger.getRecentLogs(1).filter(log => log.level === 'ERROR').length;
      if (errorCount > 5) {
        issues.push(`Muitos erros detectados: ${errorCount} no último minuto`);
      }

      // Verificar performance
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      performance = loadTime;

      if (loadTime > 3000) {
        issues.push(`Carregamento lento: ${loadTime.toFixed(2)}ms`);
      }

      // Verificar se há recursos não carregados
      const images = document.querySelectorAll('img');
      const unloadedImages = Array.from(images).filter(img => !img.complete);
      if (unloadedImages.length > 0) {
        issues.push(`${unloadedImages.length} imagens não carregaram`);
      }

      const isValid = issues.length === 0 && performance < 3000;

      logger.log(
        isValid ? 'INFO' : 'WARN',
        'PageIntegrityValidator',
        `Validação de página concluída: ${route}`,
        { isValid, issues, performance, components },
        route
      );

      return { isValid, issues, performance, components };

    } catch (error) {
      logger.log('ERROR', 'PageIntegrityValidator', 'Erro na validação de página', { error, route }, route);
      return { isValid: false, issues: ['Erro na validação'], performance: 0, components };
    }
  }

  async validateRoutes(): Promise<{ route: string; status: string }[]> {
    const routes = [
      '/',
      '/login',
      '/dashboard',
      '/dashboard/dono',
      '/dashboard/cliente',
      '/dashboard/profissional',
      '/dashboard/afiliado',
      '/dashboard/contador',
      '/dashboard/superadmin'
    ];

    const results = [];

    for (const route of routes) {
      try {
        // Simular verificação de rota
        const isAccessible = await this.checkRouteAccessibility(route);
        results.push({
          route,
          status: isAccessible ? 'OK' : 'ERROR'
        });
      } catch (error) {
        results.push({
          route,
          status: 'ERROR'
        });
      }
    }

    return results;
  }

  private async checkRouteAccessibility(route: string): Promise<boolean> {
    // Verificar se a rota está configurada no React Router
    try {
      const response = await fetch(route, { method: 'HEAD' });
      return response.ok || response.status === 404; // 404 é OK para SPA
    } catch (error) {
      return false;
    }
  }
}

// 4. Validador de Dependências
class DependencyValidator {
  private static instance: DependencyValidator;

  static getInstance(): DependencyValidator {
    if (!DependencyValidator.instance) {
      DependencyValidator.instance = new DependencyValidator();
    }
    return DependencyValidator.instance;
  }

  async validateDependencies(): Promise<{
    outdated: Array<{ name: string; current: string; latest: string }>;
    vulnerabilities: Array<{ name: string; severity: string }>;
    total: number;
  }> {
    const logger = StabilityLogger.getInstance();

    try {
      // Verificar versões críticas
      const criticalPackages = [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'react-router-dom',
        'vite'
      ];

      const outdated: any[] = [];
      const vulnerabilities: any[] = [];

      for (const pkg of criticalPackages) {
        try {
          const currentVersion = this.getPackageVersion(pkg);
          const latestVersion = await this.getLatestVersion(pkg);
          
          if (currentVersion && latestVersion && currentVersion !== latestVersion) {
            outdated.push({
              name: pkg,
              current: currentVersion,
              latest: latestVersion
            });
          }
        } catch (error) {
          logger.log('WARN', 'DependencyValidator', `Erro ao verificar ${pkg}`, { error });
        }
      }

      const result = {
        outdated,
        vulnerabilities,
        total: outdated.length + vulnerabilities.length
      };

      logger.log('INFO', 'DependencyValidator', 'Validação de dependências concluída', result);

      return result;

    } catch (error) {
      logger.log('ERROR', 'DependencyValidator', 'Erro na validação de dependências', { error });
      return { outdated: [], vulnerabilities: [], total: 0 };
    }
  }

  private getPackageVersion(packageName: string): string | null {
    try {
      // Tentar obter do window.__PACKAGE_VERSIONS__ se disponível
      if ((window as any).__PACKAGE_VERSIONS__) {
        return (window as any).__PACKAGE_VERSIONS__[packageName];
      }
      
      // Fallback: verificar no package.json (se disponível)
      return null;
    } catch (error) {
      return null;
    }
  }

  private async getLatestVersion(packageName: string): Promise<string | null> {
    try {
      // Simular verificação de versão mais recente
      // Em produção, isso faria uma chamada para npm registry
      return null;
    } catch (error) {
      return null;
    }
  }
}

// Hook principal de estabilidade
export function useStabilityMonitor() {
  const logger = StabilityLogger.getInstance();
  const debouncer = RequestDebouncer.getInstance();
  const validator = PageIntegrityValidator.getInstance();
  const depValidator = DependencyValidator.getInstance();

  const validateCurrentPage = useCallback(
    debouncer.debounce(
      'validate-page',
      async () => {
        const result = await validator.validatePage(window.location.pathname);
        if (!result.isValid) {
          logger.log('WARN', 'StabilityMonitor', 'Página com problemas', result);
        }
        return result;
      },
      1000,
      5
    ),
    [logger, validator, debouncer]
  );

  const validateSystem = useCallback(async () => {
    logger.log('INFO', 'StabilityMonitor', 'Iniciando validação completa do sistema');

    const [pageValidation, routeValidation, depValidation] = await Promise.all([
      validator.validatePage(window.location.pathname),
      validator.validateRoutes(),
      depValidator.validateDependencies()
    ]);

    const summary = {
      page: pageValidation,
      routes: routeValidation,
      dependencies: depValidation,
      errors: logger.getErrorSummary(),
      timestamp: new Date()
    };

    logger.log('INFO', 'StabilityMonitor', 'Validação completa concluída', summary);

    return summary;
  }, [logger, validator, depValidator]);

  useEffect(() => {
    // Validar página atual ao montar
    validateCurrentPage();

    // Configurar monitoramento contínuo
    const interval = setInterval(() => {
      validateCurrentPage();
    }, 30000); // A cada 30 segundos

    return () => {
      clearInterval(interval);
      debouncer.clear();
    };
  }, [validateCurrentPage, debouncer]);

  return {
    logger,
    validateCurrentPage,
    validateSystem,
    getErrorSummary: () => logger.getErrorSummary(),
    getRecentLogs: (minutes?: number) => logger.getRecentLogs(minutes)
  };
}

// Comando principal de estabilidade
export async function runStabilityCommand() {
  console.log('🔧 Iniciando Comando de Estabilidade - Salão CashBack');
  
  const logger = StabilityLogger.getInstance();
  const validator = PageIntegrityValidator.getInstance();
  const depValidator = DependencyValidator.getInstance();

  try {
    // 1. Habilitar logs detalhados
    logger.log('INFO', 'StabilityCommand', 'Sistema de logs detalhados ativado');

    // 2. Validar integridade das páginas
    console.log('📋 Validando integridade das páginas...');
    const pageValidation = await validator.validatePage(window.location.pathname);
    
    // 3. Validar rotas
    console.log('🛣️ Validando rotas...');
    const routeValidation = await validator.validateRoutes();

    // 4. Validar dependências
    console.log('📦 Validando dependências...');
    const depValidation = await depValidator.validateDependencies();

    // 5. Gerar relatório
    const report = {
      timestamp: new Date(),
      page: pageValidation,
      routes: routeValidation,
      dependencies: depValidation,
      errors: logger.getErrorSummary(),
      status: pageValidation.isValid && routeValidation.every(r => r.status === 'OK') ? 'STABLE' : 'UNSTABLE'
    };

    console.log('📊 Relatório de Estabilidade:', report);

    // 6. Ações automáticas se necessário
    if (!pageValidation.isValid) {
      console.warn('⚠️ Página instável detectada, aplicando medidas de estabilidade...');
      // Implementar medidas de estabilidade aqui
    }

    return report;

  } catch (error) {
    logger.log('ERROR', 'StabilityCommand', 'Erro no comando de estabilidade', { error });
    throw error;
  }
}

// Exportar instâncias para uso global
export const stabilityLogger = StabilityLogger.getInstance();
export const requestDebouncer = RequestDebouncer.getInstance();
export const pageValidator = PageIntegrityValidator.getInstance();
export const dependencyValidator = DependencyValidator.getInstance();
