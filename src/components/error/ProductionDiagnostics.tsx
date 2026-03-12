import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useSystemHealth, useLoginDiagnostics } from '@/hooks/useSystemHealth';

// Componente de diagnóstico para produção (apenas em modo desenvolvimento)
export const ProductionDiagnostics: React.FC = () => {
  const { health, loading: healthLoading, checkSystemHealth } = useSystemHealth();
  const { diagnostics, loading: diagLoading, runDiagnostics } = useLoginDiagnostics();
  const { user, session, roles, profile, authResolved } = useAuth();

  // Apenas mostrar em desenvolvimento ou se houver erros
  if (process.env.NODE_ENV === 'production' && health?.status !== 'unhealthy') {
    return null;
  }

  const hasIssues = !authResolved || health?.status === 'unhealthy' || !user || roles.length === 0;

  return (
    <div className="fixed bottom-4 left-4 bg-red-900 text-white p-3 rounded-lg text-xs max-w-sm z-50 border border-red-700">
      <div className="font-bold mb-2 text-red-300">🚨 DIAGNÓSTICO DE ERROS</div>
      
      <div className="space-y-2 mb-3">
        <div>
          <span className="font-semibold text-red-300">Sistema:</span>{' '}
          <span className={health?.status === 'healthy' ? 'text-green-300' : 
                          health?.status === 'degraded' ? 'text-yellow-300' : 'text-red-300'}>
            {health?.status?.toUpperCase() || 'VERIFICANDO...'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold text-red-300">Auth:</span>{' '}
          <span className={authResolved ? 'text-green-300' : 'text-red-300'}>
            {authResolved ? 'OK' : 'ERRO'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold text-red-300">Usuário:</span>{' '}
          <span className={user ? 'text-green-300' : 'text-red-300'}>
            {user ? 'OK' : 'ERRO'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold text-red-300">Roles:</span>{' '}
          <span className={roles.length > 0 ? 'text-green-300' : 'text-red-300'}>
            {roles.length > 0 ? `${roles.length}` : 'ERRO'}
          </span>
        </div>
      </div>

      {health?.errors && health.errors.length > 0 && (
        <div className="mb-3 p-2 bg-red-800 rounded">
          <div className="font-semibold text-red-300 mb-1">Erros Detectados:</div>
          {health.errors.map((error, i) => (
            <div key={i} className="text-xs text-red-200 break-all">{error}</div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={checkSystemHealth}
          disabled={healthLoading}
          className="bg-red-700 px-2 py-1 rounded text-xs disabled:opacity-50 hover:bg-red-600"
        >
          Verificar
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-700 px-2 py-1 rounded text-xs hover:bg-red-600"
        >
          Recarregar
        </button>
      </div>

      <div className="mt-2 text-xs text-red-400">
        Timestamp: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

// Hook de tratamento de erros
export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error: Error, context?: string) => {
    console.error(`🚨 ERRO MANUAL (${context || 'desconhecido'}):`, error);
    
    // Salvar erro no localStorage
    try {
      const errorLog = {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        type: 'manual'
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(errorLog);
      
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.warn('Não foi possível salvar erro no localStorage:', e);
    }

    // Em caso de erro crítico, redirecionar para página segura
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      window.location.reload();
    }
  };

  return { handleError };
};

// Hook para capturar erros globais
export const useGlobalErrorHandler = () => {
  const { handleError } = useErrorHandler();

  React.useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('🚨 Erro global não tratado:', event.error);
      handleError(event.error, 'global_unhandled');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Rejeição não tratada:', event.reason);
      handleError(new Error(event.reason), 'global_unhandled_promise');
    };

    // Capturar erros globais
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);
};
