import { useEffect, useState, useRef } from "react";
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
  isLoginRoute
} from "@/lib/debug/route-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Protege rotas que requerem autenticação
 * 
 * Fluxo de validação (ordem obrigatória):
 * 1. Aguarda carregamento inicial completo
 * 2. Verifica se usuário está autenticado
 * 3. Aguarda carregamento de roles (com timeout de segurança)
 * 4. Verifica se usuário tem permissão para a rota
 * 5. Redireciona se necessário
 * 
 * REGRAS ANTI-LOOP:
 * - Nunca redireciona para página de login se já estiver nela
 * - Usa replace para evitar histórico de redirecionamentos
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading, roles, getPrimaryRole, initialLoadComplete } = useAuth();
  const location = useLocation();
  const [roleLoadTimeout, setRoleLoadTimeout] = useState(false);
  const hasLoggedRef = useRef(false);

  // Log route access once
  useEffect(() => {
    if (!hasLoggedRef.current && initialLoadComplete) {
      hasLoggedRef.current = true;
      logRouteCheck({
        rota: location.pathname,
        existe: true,
        perfil_permitido: allowedRoles ? allowedRoles.some(r => roles.includes(r)) : true,
      });
    }
  }, [location.pathname, roles, allowedRoles, initialLoadComplete]);

  // Set a timeout to prevent infinite loading when roles never arrive
  useEffect(() => {
    if (user && roles.length === 0 && !loading && initialLoadComplete) {
      const timer = setTimeout(() => {
        setRoleLoadTimeout(true);
        logRouteError("Role load timeout - user has no roles", { 
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

  // STEP 1: Still loading auth state - show loader
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

  // STEP 2: Not authenticated - redirect to login
  if (!user) {
    const loginPath = redirectTo || getLoginPathFromRoute(location.pathname);
    
    // ANTI-LOOP: Don't redirect if already on login page
    if (isLoginRoute(location.pathname)) {
      return <>{children}</>;
    }
    
    logRedirectCheck({
      from: location.pathname,
      to: loginPath,
      motivo: 'usuario_nao_autenticado',
    });
    
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: User authenticated but no roles - wait or timeout
  if (roles.length === 0) {
    if (roleLoadTimeout) {
      // Timeout expired - redirect to login with error
      const loginPath = getLoginPathFromRoute(location.pathname);
      
      // ANTI-LOOP: Don't redirect if already on login page
      if (isLoginRoute(location.pathname)) {
        return <>{children}</>;
      }
      
      logRedirectCheck({
        from: location.pathname,
        to: loginPath,
        motivo: 'roles_nao_encontradas_timeout',
      });
      
      return <Navigate to={loginPath} state={{ from: location, error: "no_roles" }} replace />;
    }

    // Still waiting for roles - show loader
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // STEP 4: Check if user has permission for this route
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => roles.includes(role));
    
    if (!hasAllowedRole) {
      // Redirect to user's correct dashboard
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
      
      logRedirectCheck({
        from: location.pathname,
        to: correctPath,
        motivo: 'perfil_sem_permissao',
      });
      
      return <Navigate to={correctPath} replace />;
    }
  }

  // STEP 5: All checks passed - render children
  return <>{children}</>;
}
