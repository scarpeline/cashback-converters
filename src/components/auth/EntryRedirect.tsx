import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/lib/auth";
import { getDashboardForRole } from "@/lib/debug/route-config";
import { logRedirectCheck } from "@/lib/debug/auth-logger";

interface EntryRedirectProps {
  loggedOutTo: string;
  loggedInTo?: string;
  requiredRoles?: AppRole[];
}

/**
 * EntryRedirect - Decide login vs dashboard
 * REGRA: Não redireciona até authResolved = true
 */
export function EntryRedirect({ loggedOutTo, loggedInTo, requiredRoles }: EntryRedirectProps) {
  const { user, authResolved, roles, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authResolved) return;

    if (!user) {
      if (location.pathname !== loggedOutTo) {
        logRedirectCheck({ from: location.pathname, to: loggedOutTo, motivo: 'usuario_nao_autenticado' });
        navigate(loggedOutTo, { replace: true });
      }
      return;
    }

    if (roles.length === 0) return;

    const primaryRole = getPrimaryRole();
    const userDashboard = getDashboardForRole(primaryRole);

    if (requiredRoles?.length) {
      const hasAnyRequired = requiredRoles.some((r) => roles.includes(r));
      if (!hasAnyRequired) {
        if (location.pathname !== userDashboard) {
          logRedirectCheck({ from: location.pathname, to: userDashboard, motivo: 'perfil_sem_permissao_para_rota' });
          navigate(userDashboard, { replace: true });
        }
        return;
      }
    }

    const target = loggedInTo || userDashboard;
    if (location.pathname !== target) {
      logRedirectCheck({ from: location.pathname, to: target, motivo: 'redirecionamento_pos_login' });
      navigate(target, { replace: true });
    }
  }, [authResolved, user, roles, getPrimaryRole, loggedOutTo, loggedInTo, requiredRoles, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}
