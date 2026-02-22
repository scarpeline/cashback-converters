import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getDashboardForRole, isLoginRoute } from "@/lib/route-config";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Para páginas de LOGIN apenas
 * Se já logado com roles → redireciona para dashboard
 * Se não logado → renderiza children (formulário de login)
 * Timeout de 6s para evitar loading infinito
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, authResolved, roles, getPrimaryRole } = useAuth();
  const location = useLocation();
  const [timeout, setTimeoutReached] = useState(false);

  // Safety timeout: if auth doesn't resolve in 6s, render children anyway
  useEffect(() => {
    if (authResolved) return;
    const timer = setTimeout(() => setTimeoutReached(true), 6000);
    return () => clearTimeout(timer);
  }, [authResolved]);

  if (!authResolved && !timeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Logado + tem roles + está em rota de login → vai pro dashboard
  if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
    const dashboard = getDashboardForRole(getPrimaryRole());
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
}
