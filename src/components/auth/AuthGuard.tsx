import { useEffect } from "react";
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
 * Usado em páginas de login para prevenir que usuários já logados
 * acessem a tela de login novamente.
 * 
 * REGRA ANTI-LOOP: Não redireciona se já estiver em página de login
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, getPrimaryRole, roles, initialLoadComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect while loading or before initial load is complete
    if (loading || !initialLoadComplete) return;

    // User is logged in and has roles - redirect to their dashboard
    if (user && roles.length > 0) {
      const role = getPrimaryRole();
      const redirectPath = getDashboardForRole(role);
      
      // Anti-loop: Don't redirect if already on a login page
      if (isLoginRoute(location.pathname)) {
        logRedirectCheck({
          from: location.pathname,
          to: redirectPath,
          motivo: 'usuario_ja_autenticado',
        });
        
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, loading, navigate, getPrimaryRole, roles, initialLoadComplete, location.pathname]);

  // Show loading state while checking auth
  if (loading || !initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // User is logged in with roles - show loading while redirect happens
  if (user && roles.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // User not logged in or no roles yet - show login page
  return <>{children}</>;
}
