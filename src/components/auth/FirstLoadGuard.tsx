import { useEffect, useState, useRef } from "react";
import { logFirstLoad } from "@/lib/debug/auth-logger";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface FirstLoadGuardProps {
  children: React.ReactNode;
  isLoading: boolean;
  timeoutMs?: number;
}

/**
 * FirstLoadGuard - Previne tela branca durante carregamento inicial
 * Exibe skeleton loader até que a autenticação seja validada
 */
export function FirstLoadGuard({ 
  children, 
  isLoading, 
  timeoutMs = 5000 
}: FirstLoadGuardProps) {
  const [showTimeout, setShowTimeout] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isLoading) {
      logFirstLoad({ status: 'aguardando_auth' });
      
      const timer = setTimeout(() => {
        setShowTimeout(true);
        logFirstLoad({ 
          status: 'timeout', 
          duration_ms: Date.now() - startTimeRef.current 
        });
      }, timeoutMs);

      return () => clearTimeout(timer);
    } else {
      logFirstLoad({ 
        status: 'liberado', 
        duration_ms: Date.now() - startTimeRef.current 
      });
    }
  }, [isLoading, timeoutMs]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-border px-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-6 w-full max-w-md">
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          
          {/* Status Message */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {showTimeout 
                ? "Carregamento lento. Aguarde ou tente novamente."
                : "Validando sessão..."
              }
            </p>
          </div>

          {/* Skeleton Cards */}
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>

          {/* Retry button after timeout */}
          {showTimeout && (
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Recarregar página
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
