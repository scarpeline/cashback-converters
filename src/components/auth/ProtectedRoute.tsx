import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { getDashboardForRole, getLoginForRoute } from "@/lib/route-config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Único guard do sistema
 * 
 * Fluxo:
 * 1. authResolved = false → loading spinner
 * 2. Sem user → redirect para login contextual
 * 3. Sem roles ainda → loading (com timeout)
 * 4. Role não permitida → redirect para dashboard correto
 * 5. Tudo OK → renderiza children
 */
export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, roles, getPrimaryRole, authResolved, profileLoading } = useAuth();
  const location = useLocation();

  // STEP 1: Aguardar auth resolver
  if (!authResolved || profileLoading) {
    return <LoadingScreen message="Carregando..." />;
  }

  // STEP 2: Sem sessão → login
  if (!user) {
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Sessão OK mas sem roles → aguardar brevemente
  if (roles.length === 0) {
    return <LoadingScreen message="Carregando permissões..." />;
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
