import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole, getRedirectPath } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading, roles, getPrimaryRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    const loginPath = redirectTo || getLoginPathFromRoute(location.pathname);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // User authenticated but no roles assigned yet - wait a bit for roles to load
  // or redirect to login if after a reasonable time no roles are found
  if (roles.length === 0) {
    // Give a small grace period for roles to be fetched
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => roles.includes(role));
    if (!hasAllowedRole) {
      // Redirect to appropriate dashboard based on user's role
      const primaryRole = getPrimaryRole();
      const correctPath = getRedirectPath(primaryRole);
      return <Navigate to={correctPath} replace />;
    }
  }

  return <>{children}</>;
}

// Helper to determine login path from current route
function getLoginPathFromRoute(pathname: string): string {
  if (pathname.startsWith('/admin')) {
    return '/admin/login';
  }
  if (pathname.startsWith('/contador2026')) {
    return '/contador2026/login';
  }
  if (pathname.startsWith('/afiliado-saas')) {
    return '/afiliado-saas/login';
  }
  return '/public/login';
}
