/**
 * Componente de Monitoramento de Estabilidade Global
 * Inicializa o sistema de monitoramento para toda a aplicação
 */

import React, { useEffect } from 'react';
import { useStabilityMonitor, runStabilityCommand } from '@/lib/stability-monitor';

export function StabilityMonitorProvider() {
  const { logger, validateSystem } = useStabilityMonitor();

  useEffect(() => {
    // Inicializar monitoramento global
    logger.log('INFO', 'StabilityMonitor', 'Sistema de monitoramento iniciado');

    // Executar comando de estabilidade inicial
    runStabilityCommand().catch(error => {
      logger.log('ERROR', 'StabilityMonitor', 'Erro na inicialização do monitoramento', { error });
    });

    // Configurar handlers de erro global
    const handleError = (event: ErrorEvent) => {
      logger.log('ERROR', 'GlobalErrorHandler', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.log('ERROR', 'UnhandledRejection', 'Promise rejeitada sem tratamento', {
        reason: event.reason
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Monitorar performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as any; // Type assertion para evitar erro de tipagem
          const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
          if (loadTime > 3000) {
            logger.log('WARN', 'PerformanceMonitor', 'Carregamento lento detectado', {
              loadTime,
              url: window.location.pathname
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      logger.log('WARN', 'PerformanceMonitor', 'Performance Observer não disponível', { error });
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      observer.disconnect();
    };
  }, [logger, validateSystem]);

  return null; // Componente invisible
}
