import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardForRole, getLoginForRoute } from "@/lib/route-config";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, roles, getPrimaryRole, authResolved, profileLoading, barbershop } =
    useAuth();
  const location = useLocation();
  const [rolesTimeout, setRolesTimeout] = useState(false);
  const [globalTimeout, setGlobalTimeout] = useState(false);

  // Global safety timeout: if anything takes >15s, force redirect
  useEffect(() => {
    const timer = setTimeout(() => setGlobalTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  // Timeout: if roles don't load within 8s after auth resolved, show error
  useEffect(() => {
    if (authResolved && user && roles.length === 0 && !profileLoading) {
      const timer = setTimeout(() => setRolesTimeout(true), 8000);
      return () => clearTimeout(timer);
    }
    if (roles.length > 0) setRolesTimeout(false);
  }, [authResolved, user, roles, profileLoading]);

  // Global timeout: force redirect to login
  if (globalTimeout && (!authResolved || (user && roles.length === 0))) {
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 1: Aguardar auth resolver E carregamento de perfil (profileLoading)
  if (
    !authResolved ||
    (user && profileLoading && roles.length === 0 && !globalTimeout)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // STEP 2: Redirecionar para login se não autenticado
  if (!user) {
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Redirecionar para onboarding se for dono sem barbershop ou com status 'pending'
  if (
    roles.includes("dono") &&
    location.pathname !== "/onboarding" &&
    (!barbershop || barbershop.onboarding_status === "pending")
  ) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // STEP 4: Redirecionar para o dashboard principal se não houver roles ou roles inválidas
  if (roles.length === 0 || (allowedRoles && !roles.some((r) => allowedRoles.includes(r)))) {
    const primaryRole = getPrimaryRole();
    if (primaryRole) {
      const dashboardPath = getDashboardForRole(primaryRole);
      if (dashboardPath && dashboardPath !== location.pathname) {
        return <Navigate to={dashboardPath} replace />;
      }
    }
    // Se não houver role primária ou dashboard, redireciona para o login
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 5: Renderizar o conteúdo protegido
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
