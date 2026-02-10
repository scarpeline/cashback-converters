import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getDashboardForRole, isLoginRoute } from "@/lib/debug/route-config";
import { logRedirectCheck } from "@/lib/debug/auth-logger";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Redireciona usuários autenticados para fora de páginas de login
 * 
 * REGRA: Só redireciona APÓS authResolved = true
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, authResolved, getPrimaryRole, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    // Wait until auth is fully resolved
    if (!authResolved) return;
    if (hasRedirectedRef.current) return;

    // User is logged in with roles - redirect to dashboard
    if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
      const role = getPrimaryRole();
      const redirectPath = getDashboardForRole(role);

      if (isLoginRoute(redirectPath)) return;

      hasRedirectedRef.current = true;
      logRedirectCheck({
        from: location.pathname,
        to: redirectPath,
        motivo: 'usuario_ja_autenticado',
      });
      navigate(redirectPath, { replace: true });
    }
  }, [user, authResolved, navigate, getPrimaryRole, roles, location.pathname]);

  // Show loading while auth resolves
  if (!authResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // User logged in with roles on login page - show loading while redirect happens
  if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
