import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { getDashboardForRole, getLoginPathFromRoute } from "@/lib/debug/route-config";
import { logRouteError } from "@/lib/debug/auth-logger";

/**
 * NotFoundPage - Página de fallback para rotas inexistentes
 * 
 * Comportamento inteligente:
 * - Usuário logado → redireciona para o dashboard correspondente ao perfil
 * - Usuário não logado → mostra página 404 com opções
 */
const NotFoundPage = () => {
  const { user, loading, getPrimaryRole, initialLoadComplete, roles } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Wait for auth to complete
    if (loading || !initialLoadComplete) return;

    // Log 404 access
    logRouteError("404 Page Accessed", { 
      pathname: window.location.pathname,
      user_logged_in: !!user,
      has_roles: roles.length > 0
    });

    // If user is logged in with roles, redirect to their dashboard
    if (user && roles.length > 0) {
      const role = getPrimaryRole();
      const dashboardPath = getDashboardForRole(role);
      navigate(dashboardPath, { replace: true });
      return;
    }

    // Show 404 content after a brief delay
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, [user, loading, initialLoadComplete, roles, getPrimaryRole, navigate]);

  // Show loading while checking auth
  if (loading || !initialLoadComplete || (user && roles.length > 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show 404 for non-authenticated users
  if (!showContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine appropriate login path based on attempted URL
  const attemptedPath = window.location.pathname;
  const loginPath = getLoginPathFromRoute(attemptedPath);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        {/* Logo */}
        <img src={logo} alt="SalãoCashBack" className="w-20 h-20 mx-auto opacity-50" />
        
        {/* Error Icon */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
        </div>
        
        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold">404</h1>
          <h2 className="font-display text-xl font-semibold text-muted-foreground">
            Página não encontrada
          </h2>
        </div>
        
        {/* Description */}
        <p className="text-muted-foreground">
          A página que você tentou acessar não existe ou você não tem permissão para visualizá-la.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Página Inicial
            </Link>
          </Button>
          <Button variant="gold" asChild>
            <Link to={loginPath}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Fazer Login
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground pt-4">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
