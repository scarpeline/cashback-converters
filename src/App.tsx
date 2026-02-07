import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ============================================ */}
              {/* PUBLIC ROUTES */}
              {/* ============================================ */}
              
              {/* Landing page */}
              <Route path="/" element={<Index />} />
              
              {/* Public login page (Cliente, Profissional, Dono) */}
              <Route path="/public/login" element={<PublicLoginPage />} />
              
              {/* Legacy auth route - redirect to new structure */}
              <Route path="/auth" element={<Navigate to="/public/login" replace />} />
              
              {/* ============================================ */}
              {/* AFILIADO SAAS ROUTES */}
              {/* ============================================ */}
              
              {/* Afiliado SaaS login */}
              <Route path="/afiliado-saas" element={<Navigate to="/afiliado-saas/login" replace />} />
              <Route path="/afiliado-saas/login" element={<AfiliadoSaasLoginPage />} />
              
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
              
              {/* Contador login (magic link) */}
              <Route path="/contador2026" element={<Navigate to="/contador2026/login" replace />} />
              <Route path="/contador2026/login" element={<ContadorLoginPage />} />
              
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
              
              {/* Admin login (magic link, authorized emails only) */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              
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
              
              {/* App dashboard - Cliente and Dono */}
              <Route 
                path="/app/dashboard/*" 
                element={
                  <ProtectedRoute allowedRoles={['cliente', 'dono', 'afiliado_barbearia']}>
                    <DonoDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Cliente specific routes */}
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
              {/* 404 - Catch all */}
              {/* ============================================ */}
              
              <Route path="/public/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
