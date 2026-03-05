import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
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

  // Timeout: if roles don't load within 10s after auth resolved, force redirect
  useEffect(() => {
    if (authResolved && user && roles.length === 0) {
      const timer = setTimeout(() => setRolesTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
    if (roles.length > 0) setRolesTimeout(false);
  }, [authResolved, user, roles]);

  // Global timeout: force redirect to login
  if (globalTimeout && (!authResolved || (user && roles.length === 0))) {
    console.warn('[ProtectedRoute] Global timeout reached - forcing redirect to login');
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 1: Aguardar auth resolver E carregamento de perfil (profileLoading)
  // Só bloqueia se auth não resolveu OU se tem usuário mas ainda estamos buscando o perfil/roles e não deu timeout
  if (!authResolved || (user && profileLoading && roles.length === 0 && !globalTimeout)) {
    return <LoadingScreen message="Carregando ambiente seguro..." />;
  }

  // STEP 2: Sem sessão → login
  if (!user) {
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Sessão OK mas sem roles → aguardar brevemente (com timeout)
  // Se profileLoading acabou e roles continuam 0, o timeout vai agir
  if (roles.length === 0) {
    if (rolesTimeout) {
      console.warn('[ProtectedRoute] Roles timeout (10s) - redirecting to login. User:', user?.email);
      const loginPath = redirectTo || getLoginForRoute(location.pathname);
      return <Navigate to={loginPath} state={{ from: location }} replace />;
    }
    return <LoadingScreen message="Validando permissões..." />;
  }

  // STEP 4: Verificar permissão
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(r => roles.includes(r as any));
    if (!hasPermission) {
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
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
