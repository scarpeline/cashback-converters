import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FirstLoadGuard } from "@/components/auth/FirstLoadGuard";
import { EntryRedirect } from "@/components/auth/EntryRedirect";
import { Loader2 } from "lucide-react";

// Lazy loading for pages - optimizes first load
const Index = lazy(() => import("./pages/Index"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));

// Public Auth pages
const PublicLoginPage = lazy(() => import("./pages/public/LoginPage"));
const AfiliadoSaasLoginPage = lazy(() => import("./pages/afiliado-saas/LoginPage"));
const ContadorLoginPage = lazy(() => import("./pages/contador2026/LoginPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage"));

// Dashboard pages with lazy loading
const ClienteDashboard = lazy(() => import("./pages/dashboards/ClienteDashboard"));
const DonoDashboard = lazy(() => import("./pages/dashboards/DonoDashboard"));
const ProfissionalDashboard = lazy(() => import("./pages/dashboards/ProfissionalDashboard"));
const AfiliadoDashboard = lazy(() => import("./pages/dashboards/AfiliadoDashboard"));
const ContadorDashboard = lazy(() => import("./pages/dashboards/ContadorDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/dashboards/SuperAdminDashboard"));

const queryClient = new QueryClient();

// Skeleton loader for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  </div>
);

// Inner app component that uses auth context
function AppRoutes() {
  const { loading, initialLoadComplete } = useAuth();

  return (
    <FirstLoadGuard isLoading={loading || !initialLoadComplete}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES */}
          {/* ============================================ */}
          
          {/* Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Public login page (Cliente, Profissional, Dono) - wrapped with AuthGuard */}
          <Route path="/public/login" element={
            <AuthGuard>
              <PublicLoginPage />
            </AuthGuard>
          } />
          
          {/* Legacy auth route - redirect to new structure */}
          <Route path="/auth" element={<Navigate to="/public/login" replace />} />
          
          {/* ============================================ */}
          {/* AFILIADO SAAS ROUTES */}
          {/* ============================================ */}
          
          {/* Afiliado SaaS login - wrapped with AuthGuard */}
          <Route
            path="/afiliado-saas"
            element={
              <EntryRedirect
                loggedOutTo="/afiliado-saas/login"
                loggedInTo="/afiliado-saas/dashboard"
                requiredRoles={['afiliado_saas']}
              />
            }
          />
          <Route path="/afiliado-saas/login" element={
            <AuthGuard>
              <AfiliadoSaasLoginPage />
            </AuthGuard>
          } />
          
          {/* Afiliado SaaS dashboard - protected */}
          <Route 
            path="/afiliado-saas/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['afiliado_saas']}>
                <AfiliadoDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* CONTADOR ROUTES */}
          {/* ============================================ */}
          
          {/* Contador login (magic link) - wrapped with AuthGuard */}
          <Route
            path="/contador2026"
            element={
              <EntryRedirect
                loggedOutTo="/contador2026/login"
                loggedInTo="/contador2026/dashboard"
                requiredRoles={['contador']}
              />
            }
          />
          <Route path="/contador2026/login" element={
            <AuthGuard>
              <ContadorLoginPage />
            </AuthGuard>
          } />
          
          {/* Contador dashboard - protected */}
          <Route 
            path="/contador2026/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['contador']}>
                <ContadorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* SUPER ADMIN ROUTES */}
          {/* ============================================ */}
          
          {/* Admin login (magic link, authorized emails only) - wrapped with AuthGuard */}
          <Route
            path="/admin"
            element={
              <EntryRedirect
                loggedOutTo="/admin/login"
                loggedInTo="/admin/dashboard"
                requiredRoles={['super_admin']}
              />
            }
          />
          <Route path="/admin/login" element={
            <AuthGuard>
              <AdminLoginPage />
            </AuthGuard>
          } />
          
          {/* Super Admin dashboard - protected */}
          <Route 
            path="/admin/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Legacy super admin routes - redirect */}
          <Route path="/super-admin2026ok" element={<Navigate to="/admin/login" replace />} />
          <Route path="/super-admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* ============================================ */}
          {/* APP ROUTES (Cliente, Dono, Profissional) */}
          {/* ============================================ */}
          
          {/* App dashboard - Dono only */}
          <Route 
            path="/app/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['dono']}>
                <DonoDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Cliente and Afiliado Barbearia routes */}
          <Route 
            path="/app/cliente/*" 
            element={
              <ProtectedRoute allowedRoles={['cliente', 'afiliado_barbearia']}>
                <ClienteDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Profissional dashboard */}
          <Route 
            path="/app/profissional/dashboard/*" 
            element={
              <ProtectedRoute allowedRoles={['profissional']}>
                <ProfissionalDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* LEGACY ROUTES - Redirects */}
          {/* ============================================ */}
          
          <Route path="/cliente/*" element={<Navigate to="/app/cliente" replace />} />
          <Route path="/dono/*" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/profissional/*" element={<Navigate to="/app/profissional/dashboard" replace />} />
          <Route path="/afiliado/*" element={<Navigate to="/afiliado-saas/dashboard" replace />} />
          <Route path="/contador/*" element={<Navigate to="/contador2026/dashboard" replace />} />
          
          {/* ============================================ */}
          {/* 404 - Catch all (PUBLIC, no session required) */}
          {/* ============================================ */}
          
          <Route path="/public/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </FirstLoadGuard>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
