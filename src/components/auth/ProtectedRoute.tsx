import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { 
  logRouteCheck, 
  logRedirectCheck, 
  logRouteError 
} from "@/lib/debug/auth-logger";
import { 
  getLoginPathFromRoute, 
  getDashboardForRole,
  roleCanAccessRoute,
  isPublicRoute
} from "@/lib/debug/route-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Protege rotas que requerem autenticação
 * 
 * Fluxo de validação:
 * 1. Verifica se está carregando
 * 2. Verifica se usuário está autenticado
 * 3. Verifica se roles foram carregadas (com timeout)
 * 4. Verifica se usuário tem permissão para a rota
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading, roles, getPrimaryRole, initialLoadComplete } = useAuth();
  const location = useLocation();
  const [roleLoadTimeout, setRoleLoadTimeout] = useState(false);

  // Log route check
  useEffect(() => {
    logRouteCheck({
      rota: location.pathname,
      existe: true,
      perfil_permitido: allowedRoles ? allowedRoles.some(r => roles.includes(r)) : true,
    });
  }, [location.pathname, roles, allowedRoles]);

  // Set a timeout to prevent infinite loading when roles never arrive
  useEffect(() => {
    if (user && roles.length === 0 && !loading && initialLoadComplete) {
      const timer = setTimeout(() => {
        setRoleLoadTimeout(true);
        logRouteError("Role load timeout", { 
          user_id: user.id,
          pathname: location.pathname 
        });
      }, 3000); // 3 seconds max wait for roles

      return () => clearTimeout(timer);
    }
  }, [user, roles, loading, initialLoadComplete, location.pathname]);

  // Reset timeout when roles arrive
  useEffect(() => {
    if (roles.length > 0) {
      setRoleLoadTimeout(false);
    }
  }, [roles]);

  // Still loading auth state
  if (loading || !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    const loginPath = redirectTo || getLoginPathFromRoute(location.pathname);
    
    logRedirectCheck({
      from: location.pathname,
      to: loginPath,
      motivo: 'usuario_nao_autenticado',
    });
    
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // User authenticated but no roles assigned yet - wait briefly, then redirect
  if (roles.length === 0) {
    if (roleLoadTimeout) {
      // Timeout expired - redirect to login with error
      const loginPath = getLoginPathFromRoute(location.pathname);
      
      logRedirectCheck({
        from: location.pathname,
        to: loginPath,
        motivo: 'roles_nao_encontradas',
      });
      
      return <Navigate to={loginPath} state={{ from: location, error: "no_roles" }} replace />;
    }

    // Still waiting for roles
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => roles.includes(role));
    
    if (!hasAllowedRole) {
      // Redirect to appropriate dashboard based on user's role
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
      
      logRedirectCheck({
        from: location.pathname,
        to: correctPath,
        motivo: 'perfil_incorreto',
      });
      
      return <Navigate to={correctPath} replace />;
    }
  }

  // Log successful access
  logRouteCheck({
    rota: location.pathname,
    existe: true,
    perfil_permitido: true,
  });

  return <>{children}</>;
}
