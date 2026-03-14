import { useState, useEffect, useRef } from 'react';

interface WhiteScreenDetectorOptions {
  timeout?: number;
  onWhiteScreen?: () => void;
  onRecovery?: () => void;
}

/**
 * Hook para detectar e prevenir telas brancas
 */
export function useWhiteScreenDetector(options: WhiteScreenDetectorOptions = {}) {
  const { timeout = 5000, onWhiteScreen, onRecovery } = options;
  const [isWhiteScreen, setIsWhiteScreen] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Verifica se a tela está realmente branca (sem conteúdo renderizado)
  const checkForWhiteScreen = () => {
    const root = document.getElementById('root');
    if (!root) return false;

    // Verifica se o root está vazio ou só tem elementos vazios
    const hasContent = Array.from(root.children).some(child => {
      const element = child as HTMLElement;
      return element.textContent?.trim() || 
             element.tagName === 'IMG' || 
             element.tagName === 'CANVAS' ||
             element.tagName === 'VIDEO' ||
             window.getComputedStyle(element).backgroundImage !== 'none';
    });

    return !hasContent;
  };

  // Inicia detecção
  const startDetection = () => {
    // Limpa timeouts anteriores
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    // Timeout principal
    timeoutRef.current = setTimeout(() => {
      if (checkForWhiteScreen()) {
        setIsWhiteScreen(true);
        onWhiteScreen?.();
        
        // Tenta recuperação automática
        attemptRecovery();
      }
    }, timeout);

    // Verificações periódicas
    checkIntervalRef.current = setInterval(() => {
      if (checkForWhiteScreen()) {
        if (!isWhiteScreen) {
          setIsWhiteScreen(true);
          onWhiteScreen?.();
          attemptRecovery();
        }
      } else if (isWhiteScreen) {
        // Recuperado
        setIsWhiteScreen(false);
        setIsRecovering(false);
        onRecovery?.();
      }
    }, 1000);
  };

  // Tenta recuperar da tela branca
  const attemptRecovery = () => {
    setIsRecovering(true);
    
    // Estratégias de recuperação
    const recoveryStrategies = [
      // 1. Força re-render do root
      () => {
        const root = document.getElementById('root');
        if (root) {
          const originalDisplay = root.style.display;
          root.style.display = 'none';
          setTimeout(() => {
            root.style.display = originalDisplay || 'block';
          }, 100);
        }
      },
      
      // 2. Recarrega componentes críticos
      () => {
        window.dispatchEvent(new Event('resize'));
      },
      
      // 3. Força atualização do estado global
      () => {
        window.location.reload();
      }
    ];

    // Executa estratégias em sequência
    recoveryStrategies.forEach((strategy, index) => {
      setTimeout(() => {
        try {
          strategy();
        } catch (error) {
          console.error('Recovery strategy failed:', error);
        }
      }, index * 1000);
    });
  };

  // Para detecção
  const stopDetection = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
  };

  useEffect(() => {
    startDetection();
    return stopDetection;
  }, [timeout]);

  return {
    isWhiteScreen,
    isRecovering,
    attemptRecovery,
    stopDetection,
    startDetection
  };
}

/**
 * Hook para monitorar performance e prevenir problemas
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0  // Cumulative Layout Shift
  });

  useEffect(() => {
    // Monitora First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Paint performance monitoring not supported');
    }

    return () => observer.disconnect();
  }, []);

  // Detecta problemas de performance
  const detectPerformanceIssues = () => {
    const issues = [];

    if (metrics.fcp > 3000) {
      issues.push('First Contentful Paint muito lento');
    }

    if (metrics.lcp > 4000) {
      issues.push('Largest Contentful Paint muito lento');
    }

    if (metrics.fid > 300) {
      issues.push('First Input Delay muito alto');
    }

    if (metrics.cls > 0.25) {
      issues.push('Cumulative Layout Shift muito alto');
    }

    return issues;
  };

  return {
    metrics,
    detectPerformanceIssues,
    hasIssues: detectPerformanceIssues().length > 0
  };
}

export default useWhiteScreenDetector;
