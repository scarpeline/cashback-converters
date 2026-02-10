import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { logRouteCheck, logRedirectCheck } from "@/lib/debug/auth-logger";
import { getLoginPathFromRoute, getDashboardForRole, isLoginRoute } from "@/lib/debug/route-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Protege rotas que requerem autenticação
 * 
 * REGRA: Nenhum redirect até authResolved = true E profileLoading = false
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, roles, getPrimaryRole, authResolved, profileLoading } = useAuth();
  const location = useLocation();
  const [roleLoadTimeout, setRoleLoadTimeout] = useState(false);
  const hasLoggedRef = useRef(false);

  // Log route access once
  useEffect(() => {
    if (!hasLoggedRef.current && authResolved) {
      hasLoggedRef.current = true;
      logRouteCheck({
        rota: location.pathname,
        existe: true,
        perfil_permitido: allowedRoles ? allowedRoles.some(r => roles.includes(r)) : true,
      });
    }
  }, [location.pathname, roles, allowedRoles, authResolved]);

  // Timeout for roles that never arrive
  useEffect(() => {
    if (authResolved && user && roles.length === 0 && !profileLoading) {
      const timer = setTimeout(() => setRoleLoadTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, roles, authResolved, profileLoading]);

  useEffect(() => {
    if (roles.length > 0) setRoleLoadTimeout(false);
  }, [roles]);

  // STEP 1: Wait for auth to fully resolve
  if (!authResolved || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // STEP 2: Not authenticated
  if (!user) {
    const loginPath = redirectTo || getLoginPathFromRoute(location.pathname);
    if (isLoginRoute(location.pathname)) return <>{children}</>;

    logRedirectCheck({ from: location.pathname, to: loginPath, motivo: 'usuario_nao_autenticado' });
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Authenticated but no roles
  if (roles.length === 0) {
    if (roleLoadTimeout) {
      const loginPath = getLoginPathFromRoute(location.pathname);
      if (isLoginRoute(location.pathname)) return <>{children}</>;

      logRedirectCheck({ from: location.pathname, to: loginPath, motivo: 'roles_nao_encontradas_timeout' });
      return <Navigate to={loginPath} state={{ from: location, error: "no_roles" }} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // STEP 4: Check permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => roles.includes(role));
    if (!hasAllowedRole) {
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
      logRedirectCheck({ from: location.pathname, to: correctPath, motivo: 'perfil_sem_permissao' });
      return <Navigate to={correctPath} replace />;
    }
  }

  // STEP 5: All checks passed
  return <>{children}</>;
}
