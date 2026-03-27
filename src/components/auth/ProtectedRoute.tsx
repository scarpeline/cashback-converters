import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Loader2 } from "lucide-react";
import { getDashboardForRole, getLoginForRoute } from "@/lib/route-config";
import { useEffect, useState, useRef } from "react";

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
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs para evitar múltiplas execuções
  const authCheckedRef = useRef(false);
  const rolesCheckedRef = useRef(false);

  // Global safety timeout: se algo demorar >15s, força redirect
  useEffect(() => {
    if (authCheckedRef.current) return;
    
    const timer = setTimeout(() => {
      if (!authResolved || (user && roles.length === 0)) {
        console.warn('[ProtectedRoute] Global timeout reached');
        setGlobalTimeout(true);
        authCheckedRef.current = true;
      }
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [authResolved, user, roles]);

  // Timeout específico para roles: se não carregar em 10s após auth resolved
  useEffect(() => {
    if (rolesCheckedRef.current) return;
    
    if (authResolved && user && roles.length === 0) {
      const timer = setTimeout(() => {
        console.warn('[ProtectedRoute] Roles timeout reached');
        setRolesTimeout(true);
        rolesCheckedRef.current = true;
      }, 10000);
      
      return () => clearTimeout(timer);
    }
    
    if (roles.length > 0) {
      setRolesTimeout(false);
      rolesCheckedRef.current = true;
    }
  }, [authResolved, user, roles]);

  // Resetar estados quando mudar de rota
  useEffect(() => {
    setRolesTimeout(false);
    setGlobalTimeout(false);
    setError(null);
    authCheckedRef.current = false;
    rolesCheckedRef.current = false;
  }, [location.pathname]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRolesTimeout(false);
    setGlobalTimeout(false);
    setError(null);
    authCheckedRef.current = false;
    rolesCheckedRef.current = false;
    
    // Força reload apenas após múltiplas tentativas
    if (retryCount >= 2) {
      window.location.reload();
    }
  };

  // Global timeout: força redirect para login
  if (globalTimeout && (!authResolved || (user && roles.length === 0))) {
    console.warn('[ProtectedRoute] Global timeout - forcing redirect to login');
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 1: Aguardar auth resolver
  if (!authResolved || (user && profileLoading && roles.length === 0 && !globalTimeout)) {
    return <LoadingScreen message="Carregando ambiente seguro..." showRetry={retryCount > 2} onRetry={handleRetry} />;
  }

  // STEP 2: Redirecionar para login se não autenticado
  if (!user) {
    const loginPath = redirectTo || getLoginForRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // STEP 3: Sessão OK mas sem roles → aguardar brevemente
  if (roles.length === 0) {
    if (rolesTimeout) {
      console.warn('[ProtectedRoute] Roles timeout - redirecting to login. User:', user?.email);
      const loginPath = redirectTo || getLoginForRoute(location.pathname);
      return <Navigate to={loginPath} state={{ from: location }} replace />;
    }
    return <LoadingScreen message="Validando permissões..." showRetry={retryCount > 1} onRetry={handleRetry} />;
  }

  // STEP 3b: Redirecionar para onboarding se for dono com status 'pending'
  if (
    barbershop &&
    barbershop.onboarding_status === "pending" &&
    roles.includes("dono") &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // STEP 4: Verificar permissão
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(r => roles.includes(r as any));
    if (!hasPermission) {
      const primaryRole = getPrimaryRole();
      const correctPath = getDashboardForRole(primaryRole);
      console.warn('[ProtectedRoute] Permission denied - redirecting to:', correctPath);
      return <Navigate to={correctPath} replace />;
    }
  }

  // STEP 5: Renderizar o conteúdo protegido
  return <>{children}</>;
}
