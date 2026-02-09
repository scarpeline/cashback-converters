import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";
import { getDashboardForRole, getLoginPathFromRoute } from "@/lib/debug/route-config";
import { logRedirectCheck } from "@/lib/debug/auth-logger";

interface EntryRedirectProps {
  loggedOutTo: string;
  loggedInTo?: string;
  requiredRoles?: AppRole[];
}

/**
 * EntryRedirect
 * Usado em rotas "raiz" (ex.: /admin) para decidir login vs dashboard.
 * 
 * REGRA ABSOLUTA:
 * - Nunca redirecionar sem validar role
 * - Se autenticado mas sem role correta, vai para seu dashboard
 */
export function EntryRedirect({ loggedOutTo, loggedInTo, requiredRoles }: EntryRedirectProps) {
  const { user, loading, initialLoadComplete, roles, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !initialLoadComplete) return;

    // Not authenticated → login
    if (!user) {
      if (location.pathname !== loggedOutTo) {
        logRedirectCheck({
          from: location.pathname,
          to: loggedOutTo,
          motivo: 'usuario_nao_autenticado',
        });
        navigate(loggedOutTo, { replace: true });
      }
      return;
    }

    // Authenticated but roles not loaded yet
    if (roles.length === 0) return;

    const primaryRole = getPrimaryRole();
    const userDashboard = getDashboardForRole(primaryRole);

    // If route requires specific roles but user doesn't have it
    if (requiredRoles?.length) {
      const hasAnyRequired = requiredRoles.some((r) => roles.includes(r));
      if (!hasAnyRequired) {
        if (location.pathname !== userDashboard) {
          logRedirectCheck({
            from: location.pathname,
            to: userDashboard,
            motivo: 'perfil_sem_permissao_para_rota',
          });
          navigate(userDashboard, { replace: true });
        }
        return;
      }
    }

    // Go to intended destination or user's dashboard
    const target = loggedInTo || userDashboard;
    if (location.pathname !== target) {
      logRedirectCheck({
        from: location.pathname,
        to: target,
        motivo: 'redirecionamento_pos_login',
      });
      navigate(target, { replace: true });
    }
  }, [loading, initialLoadComplete, user, roles, getPrimaryRole, loggedOutTo, loggedInTo, requiredRoles, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}
