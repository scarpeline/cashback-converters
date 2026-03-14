import React from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ComponentFallbackProps {
  componentName?: string;
  error?: Error;
  onRetry?: () => void;
}

/**
 * Componente de fallback para componentes ausentes ou com erro
 * Impede tela branca e mostra interface amigável
 */
export const ComponentFallback: React.FC<ComponentFallbackProps> = ({ 
  componentName, 
  error, 
  onRetry 
}) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  if (retryCount > 2) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-800">
            Componente {componentName || "carregando"} indisponível
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Tente recarregar a página
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-4 text-center">
        {error ? (
          <>
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-700 mb-2">
              Erro ao carregar {componentName || "componente"}
            </p>
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar novamente
              </Button>
            )}
          </>
        ) : (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Carregando {componentName || "componente"}...
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Fallback específico para componentes de dashboard
 */
export const DashboardFallback: React.FC<{ title?: string }> = ({ title }) => (
  <div className="p-6">
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Carregando {title || "painel"}...</p>
      </div>
    </div>
  </div>
);

/**
 * Fallback para seções críticas que não podem falhar
 */
export const CriticalFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="text-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Carregando...</p>
    </div>
  </div>
);

/**
 * Wrapper para componentes com tratamento de erro
 */
export const SafeComponent: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback, onError }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
      onError?.(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return fallback || <ComponentFallback error={error || undefined} />;
  }

  return <>{children}</>;
};

export default ComponentFallback;
