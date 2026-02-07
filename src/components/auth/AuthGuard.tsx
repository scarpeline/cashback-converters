import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, getRedirectPath } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Redirects authenticated users away from login pages
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect to their dashboard
      const role = getPrimaryRole();
      const redirectPath = getRedirectPath(role);
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, navigate, getPrimaryRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is NOT logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
