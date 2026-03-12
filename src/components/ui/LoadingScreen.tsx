import React from 'react';
import { useAuth } from '@/lib/auth';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingScreenProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Carregando...", 
  showRetry = false,
  onRetry 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md mx-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">
            Por favor, aguarde enquanto processamos sua solicitação...
          </p>
        </div>
        
        {showRetry && (
          <div className="pt-4">
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AuthLoadingProps {
  message?: string;
}

export const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = "Autenticando..." 
}) => {
  const { user, session, roles, authResolved } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md mx-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">
            Verificando suas credenciais e preparando seu ambiente...
          </p>
        </div>

        {/* Debug info em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-muted rounded-lg text-left">
            <p className="text-xs font-mono space-y-1">
              <div>User: {user ? '✓' : '✗'}</div>
              <div>Session: {session ? '✓' : '✗'}</div>
              <div>Roles: {roles.length}</div>
              <div>Resolved: {authResolved ? '✓' : '✗'}</div>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ErrorLoadingProps {
  error?: Error;
  onRetry?: () => void;
  context?: string;
}

export const ErrorLoading: React.FC<ErrorLoadingProps> = ({ 
  error, 
  onRetry, 
  context = "carregamento" 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md mx-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            Erro no {context}
          </p>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
        </div>

        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}
        
        {onRetry && (
          <div className="pt-2">
            <Button 
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Loading específico para dashboards
export const DashboardLoading: React.FC<{ role: string }> = ({ role }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              Carregando Dashboard
            </p>
            <p className="text-sm text-muted-foreground">
              Preparando seu painel {role}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading para skeleton screens
export const SkeletonLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 space-y-4">
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-card rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
