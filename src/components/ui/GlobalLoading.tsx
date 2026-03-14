import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GlobalLoadingProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  timeout?: number;
  minDisplayTime?: number;
}

/**
 * Componente de loading global com detecção de problemas
 */
export const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  message = "Carregando...",
  showRetry = false,
  onRetry,
  timeout = 20000,
  minDisplayTime = 1000
}) => {
  const [showError, setShowError] = useState(false);
  const [startTime] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();
  const minDisplayTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Timeout para mostrar erro
    timeoutRef.current = setTimeout(() => {
      setShowError(true);
    }, timeout);

    // Timeout mínimo de exibição
    minDisplayTimeoutRef.current = setTimeout(() => {
      // Não faz nada, apenas garante tempo mínimo
    }, minDisplayTime);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (minDisplayTimeoutRef.current) clearTimeout(minDisplayTimeoutRef.current);
    };
  }, [timeout, minDisplayTime]);

  const handleRetry = () => {
    setShowError(false);
    onRetry?.();
  };

  const elapsedTime = Date.now() - startTime;

  if (showError) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h3 className="text-lg font-medium text-foreground mb-2">
              Demorando mais que o esperado
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              O sistema está demorando para responder. 
              Tempo de carregamento: {Math.round(elapsedTime / 1000)}s
            </p>
            
            <div className="space-y-2">
              {showRetry && onRetry && (
                <Button 
                  onClick={handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com o suporte.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4 max-w-md mx-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          
          {/* Indicadores de progresso */}
          <div className="absolute -inset-4">
            <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {message}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Carregando... ({Math.round(elapsedTime / 1000)}s)</span>
          </div>
        </div>
        
        {/* Dicas enquanto carrega */}
        <div className="bg-muted/50 rounded-lg p-3 text-left">
          <p className="text-xs text-muted-foreground mb-2">
            💡 <strong>Dica:</strong> Enquanto espera, verifique se:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Sua conexão com a internet está estável</li>
            <li>• O navegador está atualizado</li>
            <li>• Não há bloqueadores de script ativos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para controle programático do loading global
 */
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const showLoading = (message?: string) => {
    setLoadingMessage(message || "Carregando...");
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage("");
  };

  const withLoading = async <T,>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message);
    try {
      const result = await operation();
      return result;
    } finally {
      hideLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    withLoading
  };
}

export default GlobalLoading;
