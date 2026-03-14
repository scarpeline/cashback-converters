import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getDashboardForRole, isLoginRoute } from "@/lib/route-config";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

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
  const [redirectTimeout, setRedirectTimeout] = useState(false);
  const redirectAttemptedRef = useRef(false);

  // Timeout para redirect automático se demorar muito
  useEffect(() => {
    if (redirectAttemptedRef.current) return;
    
    if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
      const timer = setTimeout(() => {
        console.warn('[AuthGuard] Redirect timeout - forcing navigation');
        setRedirectTimeout(true);
        redirectAttemptedRef.current = true;
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, roles, location.pathname]);

  // Resetar estado quando mudar de rota
  useEffect(() => {
    if (!isLoginRoute(location.pathname)) {
      setRedirectTimeout(false);
      redirectAttemptedRef.current = false;
    }
  }, [location.pathname]);

  if (!authResolved) {
    return <LoadingScreen message="Preparando ambiente de autenticação..." />;
  }

  // Logado + tem roles + está em rota de login → vai pro dashboard
  if (user && roles.length > 0 && isLoginRoute(location.pathname)) {
    const dashboard = getDashboardForRole(getPrimaryRole());
    
    if (redirectTimeout) {
      // Força redirect se timeout
      return (
        <LoadingScreen 
          message="Redirecionando para seu dashboard..." 
          showRetry={true}
          onRetry={() => {
            redirectAttemptedRef.current = true;
            window.location.href = dashboard;
          }}
        />
      );
    }
    
    return <Navigate to={dashboard} replace />;
  }

  // Se está em rota de login mas demorando para redirect
  if (redirectTimeout) {
    return (
      <LoadingScreen 
        message="Redirecionando para seu dashboard..." 
        showRetry={true}
        onRetry={() => {
          redirectAttemptedRef.current = true;
          window.location.href = getDashboardForRole(getPrimaryRole());
        }}
      />
    );
  }

  // Renderiza children (formulário de login)
  return <>{children}</>;
}
