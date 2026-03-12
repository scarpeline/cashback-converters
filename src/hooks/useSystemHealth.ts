import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    functions: boolean;
  };
  timestamp: string;
  errors: string[];
}

export function useSystemHealth() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();

  const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  };

  const checkAuthHealth = async (): Promise<boolean> => {
    try {
      if (!session) return false;
      
      const { error } = await supabase.auth.getSession();
      return !error;
    } catch (error) {
      console.error('Auth health check failed:', error);
      return false;
    }
  };

  const checkStorageHealth = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      
      return !error;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  };

  const checkFunctionsHealth = async (): Promise<boolean> => {
    try {
      // Pular verificação de função para evitar CORS em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      const { error } = await supabase.functions.invoke('health-check');
      return !error;
    } catch (error) {
      console.error('Functions health check failed:', error);
      return false;
    }
  };

  const performHealthCheck = async (): Promise<HealthCheck> => {
    setLoading(true);
    const errors: string[] = [];

    try {
      const [database, auth, storage, functions] = await Promise.all([
        checkDatabaseHealth().catch(e => { errors.push('Database: ' + e.message); return false; }),
        checkAuthHealth().catch(e => { errors.push('Auth: ' + e.message); return false; }),
        checkStorageHealth().catch(e => { errors.push('Storage: ' + e.message); return false; }),
        checkFunctionsHealth().catch(e => { errors.push('Functions: ' + e.message); return false; })
      ]);

      const checks = { database, auth, storage, functions };
      const healthyCount = Object.values(checks).filter(Boolean).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === 4) status = 'healthy';
      else if (healthyCount >= 2) status = 'degraded';
      else status = 'unhealthy';

      return {
        status,
        checks,
        timestamp: new Date().toISOString(),
        errors
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        checks: { database: false, auth: false, storage: false, functions: false },
        timestamp: new Date().toISOString(),
        errors: ['Health check failed: ' + error.message]
      };
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    const result = await performHealthCheck();
    setHealth(result);
    return result;
  };

  // Auto-check on mount and user change
  useEffect(() => {
    if (user) {
      checkSystemHealth();
    }
  }, [user]);

  return {
    health,
    loading,
    checkSystemHealth,
    isHealthy: health?.status === 'healthy',
    isDegraded: health?.status === 'degraded',
    isUnhealthy: health?.status === 'unhealthy'
  };
}

// Hook para diagnóstico de login
export function useLoginDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, session, roles, profile, authResolved } = useAuth();

  const runDiagnostics = async () => {
    setLoading(true);
    
    try {
      const results = {
        timestamp: new Date().toISOString(),
        auth: {
          user: !!user,
          session: !!session,
          authResolved,
          userId: user?.id || null,
          userEmail: user?.email || null
        },
        profile: {
          exists: !!profile,
          profileId: profile?.id || null,
          profileName: profile?.name || null
        },
        roles: {
          hasRoles: roles.length > 0,
          roleCount: roles.length,
          primaryRole: roles[0] || null,
          allRoles: roles
        },
        localStorage: {
          hasToken: !!localStorage.getItem('supabase.auth.token'),
          hasRefreshToken: !!localStorage.getItem('supabase.auth.refreshToken'),
          storageSize: new Blob([JSON.stringify(localStorage)]).size
        },
        network: {
          online: navigator.onLine,
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        },
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled
        }
      };

      // Testar conexão com Supabase
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        results.supabase = { connected: !error, error: error?.message || null };
      } catch (error) {
        results.supabase = { connected: false, error: error.message };
      }

      setDiagnostics(results);
      return results;
    } catch (error) {
      console.error('Diagnostics failed:', error);
      const errorResults = {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'failed'
      };
      setDiagnostics(errorResults);
      return errorResults;
    } finally {
      setLoading(false);
    }
  };

  return {
    diagnostics,
    loading,
    runDiagnostics
  };
}

// Componente de diagnóstico para desenvolvimento
export const SystemDiagnostics: React.FC = () => {
  const { health, loading: healthLoading, checkSystemHealth } = useSystemHealth();
  const { diagnostics, loading: diagLoading, runDiagnostics } = useLoginDiagnostics();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return React.createElement('div', {
    className: 'fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50'
  }, [
    React.createElement('div', {
      key: 'title',
      className: 'font-bold mb-2'
    }, '🔍 Diagnóstico do Sistema'),
    
    React.createElement('div', {
      key: 'health',
      className: 'mb-2'
    }, [
      React.createElement('div', {
        key: 'health-title',
        className: 'font-semibold'
      }, 'Saúde:'),
      healthLoading ? 
        React.createElement('div', { key: 'health-loading' }, 'Verificando...') :
        health ? React.createElement('div', {
          key: 'health-status',
          className: health.status === 'healthy' ? 'text-green-400' : 
                     health.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
        }, [
          health.status.toUpperCase(),
          health.errors.length > 0 && React.createElement('div', {
            key: 'health-errors',
            className: 'text-xs mt-1'
          }, `Erros: ${health.errors.length}`)
        ]) :
        React.createElement('div', { key: 'health-not-checked' }, 'Não verificado')
    ]),

    React.createElement('div', {
      key: 'auth',
      className: 'mb-2'
    }, [
      React.createElement('div', {
        key: 'auth-title',
        className: 'font-semibold'
      }, 'Autenticação:'),
      diagnostics ? React.createElement('div', {
        key: 'auth-details'
      }, [
        React.createElement('div', { key: 'auth-user' }, `Usuário: ${diagnostics.auth.user ? '✓' : '✗'}`),
        React.createElement('div', { key: 'auth-session' }, `Sessão: ${diagnostics.auth.session ? '✓' : '✗'}`),
        React.createElement('div', { key: 'auth-roles' }, `Roles: ${diagnostics.roles.roleCount}`)
      ]) :
      React.createElement('div', { key: 'auth-not-checked' }, 'Não verificado')
    ]),

    React.createElement('div', {
      key: 'buttons',
      className: 'flex gap-2 mt-3'
    }, [
      React.createElement('button', {
        key: 'health-btn',
        onClick: checkSystemHealth,
        disabled: healthLoading,
        className: 'bg-blue-600 px-2 py-1 rounded text-xs disabled:opacity-50'
      }, 'Verificar Saúde'),
      
      React.createElement('button', {
        key: 'diag-btn',
        onClick: runDiagnostics,
        disabled: diagLoading,
        className: 'bg-green-600 px-2 py-1 rounded text-xs disabled:opacity-50'
      }, 'Diagnóstico')
    ])
  ]);
};
