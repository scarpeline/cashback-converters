import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardForRole, getLoginForRoute } from "@/lib/route-config";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, roles, getPrimaryRole, authResolved, profileLoading } = useAuth();
  const location = useLocation();
  const [rolesTimeout, setRolesTimeout] = useState(false);
  const [globalTimeout, setGlobalTimeout] = useState(false);

  // Global safety timeout: if anything takes >15s, force redirect
  useEffect(() => {
    const timer = setTimeout(() => setGlobalTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  // Timeout: if roles don't load within 8s after auth resolved, show error
  useEffect(() => {
    if (authResolved && user && roles.length === 0 && !profileLoading) {
      const timer = setTimeout(() => setRolesTimeout(true), 8000);
      return () => clearTimeout(timer);
    }
    if (roles.length > 0) setRolesTimeout(false);
  }, [authResolved, user, roles, profileLoading]);

  // Global timeout: force redirect to login
  if (globalTimeout && (!authResolved || (user && roles.length === 0))) {
    console.warn('[ProtectedRoute] Global timeout reached - forcing redirect to login');
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 1: Aguardar auth resolver E carregamento de perfil (profileLoading)
  if (!authResolved || (user && profileLoading && roles.length === 0 && !globalTimeout)) {
    return <LoadingScreen message="Carregando ambiente seguro..." />;
  }

  // Debug log for routing decisions
  console.log(`[ProtectedRoute] Path: ${location.pathname} | User: ${!!user} | Roles: ${roles.join(',')} | Resolved: ${authResolved}`);

  // STEP 2: Sem sessão → login
  if (!user) {
    console.warn('[ProtectedRoute] No user found - redirecting to login');
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Sessão OK mas sem roles → aguardar brevemente (com timeout)
  if (roles.length === 0) {
    if (globalTimeout || rolesTimeout) {
      console.warn('[ProtectedRoute] Roles missing for authenticated user:', user?.email);

      // Se ainda estiver carregando perfil, esperamos o globalTimeout
      if (profileLoading && !globalTimeout) {
        return <LoadingScreen message="Sincronizando permissões..." />;
      }

      // Em vez de expulsar para o login, mostramos uma tela de erro com opção de retry
      // Isso quebra o loop Dashboard -> Login -> Dashboard
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border shadow-lg">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Perfil não localizado</h2>
              <p className="text-sm text-muted-foreground">
                Sua sessão está ativa, mas não conseguimos carregar suas permissões de acesso.
                Isso pode ser uma instabilidade temporária.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/login'} className="w-full">
                Voltar para o Login
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">ID: {user.id.substring(0, 8)}...</p>
          </div>
        </div>
      );
    }
    return <LoadingScreen message="Validando permissões de acesso..." />;
  }

  // STEP 4: Verificar permissão
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(r => roles.includes(r as any));
    console.log(`[ProtectedRoute] Permission Check | Allowed: ${allowedRoles.join(',')} | Has: ${hasPermission}`);
    if (!hasPermission) {
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
      console.warn(`[ProtectedRoute] Access Denied - Redirecting to dashboard: ${correctPath}`);
      return <Navigate to={correctPath} replace />;
    }
  }

  // STEP 5: Autorizado
  return <>{children}</>;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
