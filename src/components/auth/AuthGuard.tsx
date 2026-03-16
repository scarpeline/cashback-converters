import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getDashboardForRole, isLoginRoute } from "@/lib/route-config";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Para páginas de LOGIN apenas
 * Se já logado com roles → redireciona para dashboard
 * Se não logado → renderiza children (formulário de login)
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, authResolved, roles, getPrimaryRole } = useAuth();
  const location = useLocation();

  if (!authResolved) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        aria-hidden="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logado + tem roles + está em rota de login → vai pro dashboard
  if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
    const role = getPrimaryRole();
    const dashboard = getDashboardForRole(role);
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}
