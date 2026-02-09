/**
 * App.tsx - SALÃO CASHBACK
 * 
 * Roteamento principal da aplicação
 * 
 * MAPEAMENTO DE ROTAS:
 * - cliente → /app
 * - dono → /painel-dono
 * - profissional → /painel-profissional
 * - afiliado_saas → /afiliado-saas
 * - contador → /contador2026
 * - super_admin → /admin
 * 
 * REGRA ABSOLUTA:
 * - Nunca remover sessão ativa
 * - Nunca redirecionar sem validar role
 */

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

// ============================================
// LAZY LOADED PAGES
// ============================================

// Public pages
const Index = lazy(() => import("./pages/Index"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));

// Login pages
const PublicLoginPage = lazy(() => import("./pages/public/LoginPage"));
const AfiliadoSaasLoginPage = lazy(() => import("./pages/afiliado-saas/LoginPage"));
const ContadorLoginPage = lazy(() => import("./pages/contador2026/LoginPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage"));

// Dashboard pages
const ClienteDashboard = lazy(() => import("./pages/dashboards/ClienteDashboard"));
const DonoDashboard = lazy(() => import("./pages/dashboards/DonoDashboard"));
const ProfissionalDashboard = lazy(() => import("./pages/dashboards/ProfissionalDashboard"));
const AfiliadoDashboard = lazy(() => import("./pages/dashboards/AfiliadoDashboard"));
const ContadorDashboard = lazy(() => import("./pages/dashboards/ContadorDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/dashboards/SuperAdminDashboard"));

// ============================================
// QUERY CLIENT
// ============================================

const queryClient = new QueryClient();

// ============================================
// PAGE LOADER
// ============================================

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  </div>
);

// ============================================
// APP ROUTES
// ============================================

function AppRoutes() {
  const { loading, initialLoadComplete } = useAuth();

  return (
    <FirstLoadGuard isLoading={loading || !initialLoadComplete}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ============================================ */}
          {/* ROTAS PÚBLICAS */}
          {/* ============================================ */}
          
          {/* Landing page */}
          <Route path="/" element={<Index />} />
          
          {/* Login público (Cliente, Profissional, Dono) */}
          <Route path="/login" element={
            <AuthGuard>
              <PublicLoginPage />
            </AuthGuard>
          } />
          
          {/* 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          
          {/* ============================================ */}
          {/* AFILIADO SAAS */}
          {/* ============================================ */}
          
          {/* Entry point - decide login vs dashboard */}
          <Route
            path="/afiliado-saas"
            element={
              <EntryRedirect
                loggedOutTo="/afiliado-saas/login"
                loggedInTo="/afiliado-saas"
                requiredRoles={['afiliado_saas']}
              />
            }
          />
          
          {/* Login page */}
          <Route path="/afiliado-saas/login" element={
            <AuthGuard>
              <AfiliadoSaasLoginPage />
            </AuthGuard>
          } />
          
          {/* Dashboard - protected */}
          <Route 
            path="/afiliado-saas/*" 
            element={
              <ProtectedRoute allowedRoles={['afiliado_saas']}>
                <AfiliadoDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* CONTADOR */}
          {/* ============================================ */}
          
          {/* Entry point */}
          <Route
            path="/contador2026"
            element={
              <EntryRedirect
                loggedOutTo="/contador2026/login"
                loggedInTo="/contador2026"
                requiredRoles={['contador']}
              />
            }
          />
          
          {/* Login page */}
          <Route path="/contador2026/login" element={
            <AuthGuard>
              <ContadorLoginPage />
            </AuthGuard>
          } />
          
          {/* Dashboard - protected */}
          <Route 
            path="/contador2026/*" 
            element={
              <ProtectedRoute allowedRoles={['contador']}>
                <ContadorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* SUPER ADMIN */}
          {/* ============================================ */}
          
          {/* Entry point */}
          <Route
            path="/admin"
            element={
              <EntryRedirect
                loggedOutTo="/admin/login"
                loggedInTo="/admin"
                requiredRoles={['super_admin']}
              />
            }
          />
          
          {/* Login page */}
          <Route path="/admin/login" element={
            <AuthGuard>
              <AdminLoginPage />
            </AuthGuard>
          } />
          
          {/* Dashboard - protected */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* CLIENTE */}
          {/* ============================================ */}
          
          <Route 
            path="/app/*" 
            element={
              <ProtectedRoute allowedRoles={['cliente', 'afiliado_barbearia']}>
                <ClienteDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* DONO DE BARBEARIA */}
          {/* ============================================ */}
          
          <Route 
            path="/painel-dono/*" 
            element={
              <ProtectedRoute allowedRoles={['dono']}>
                <DonoDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* PROFISSIONAL */}
          {/* ============================================ */}
          
          <Route 
            path="/painel-profissional/*" 
            element={
              <ProtectedRoute allowedRoles={['profissional']}>
                <ProfissionalDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ============================================ */}
          {/* LEGACY REDIRECTS */}
          {/* ============================================ */}
          
          {/* Old login routes */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/public/login" element={<Navigate to="/login" replace />} />
          <Route path="/public/404" element={<Navigate to="/404" replace />} />
          
          {/* Old dashboard routes */}
          <Route path="/app/dashboard/*" element={<Navigate to="/painel-dono" replace />} />
          <Route path="/app/cliente/*" element={<Navigate to="/app" replace />} />
          <Route path="/app/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
          <Route path="/afiliado-saas/dashboard/*" element={<Navigate to="/afiliado-saas" replace />} />
          <Route path="/contador2026/dashboard/*" element={<Navigate to="/contador2026" replace />} />
          <Route path="/admin/dashboard/*" element={<Navigate to="/admin" replace />} />
          
          {/* Very old routes */}
          <Route path="/cliente/*" element={<Navigate to="/app" replace />} />
          <Route path="/dono/*" element={<Navigate to="/painel-dono" replace />} />
          <Route path="/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
          <Route path="/afiliado/*" element={<Navigate to="/afiliado-saas" replace />} />
          <Route path="/contador/*" element={<Navigate to="/contador2026" replace />} />
          <Route path="/super-admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="/super-admin2026ok" element={<Navigate to="/admin/login" replace />} />
          
          {/* ============================================ */}
          {/* CATCH ALL - 404 */}
          {/* ============================================ */}
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </FirstLoadGuard>
  );
}

// ============================================
// APP COMPONENT
// ============================================

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
