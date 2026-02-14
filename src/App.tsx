/**
 * App.tsx - SALÃO CASHBACK
 * 
 * REGRA: authResolved controla montagem de rotas protegidas
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
import { Loader2 } from "lucide-react";

// Lazy pages
const Index = lazy(() => import("./pages/Index"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));
const PublicLoginPage = lazy(() => import("./pages/public/LoginPage"));
const AfiliadoSaasLoginPage = lazy(() => import("./pages/afiliado-saas/LoginPage"));
const ContadorLoginPage = lazy(() => import("./pages/contador2026/LoginPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage"));
const ClienteDashboard = lazy(() => import("./pages/dashboards/ClienteDashboard"));
const DonoDashboard = lazy(() => import("./pages/dashboards/DonoDashboard"));
const ProfissionalDashboard = lazy(() => import("./pages/dashboards/ProfissionalDashboard"));
const AfiliadoDashboard = lazy(() => import("./pages/dashboards/AfiliadoDashboard"));
const ContadorDashboard = lazy(() => import("./pages/dashboards/ContadorDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/dashboards/SuperAdminDashboard"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { authResolved } = useAuth();

  return (
    <FirstLoadGuard isLoading={!authResolved}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<AuthGuard><PublicLoginPage /></AuthGuard>} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* AFILIADO SAAS */}
          <Route path="/afiliado-saas/login" element={<AuthGuard><AfiliadoSaasLoginPage /></AuthGuard>} />
          <Route path="/afiliado-saas/*" element={
            <ProtectedRoute allowedRoles={['afiliado_saas']}><AfiliadoDashboard /></ProtectedRoute>
          } />

          {/* CONTADOR */}
          <Route path="/contador2026/login" element={<AuthGuard><ContadorLoginPage /></AuthGuard>} />
          <Route path="/contador2026/*" element={
            <ProtectedRoute allowedRoles={['contador']}><ContadorDashboard /></ProtectedRoute>
          } />

          {/* SUPER ADMIN */}
          <Route path="/admin/login" element={<AuthGuard><AdminLoginPage /></AuthGuard>} />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>
          } />

          {/* CLIENTE */}
          <Route path="/app/*" element={
            <ProtectedRoute allowedRoles={['cliente', 'afiliado_barbearia']}><ClienteDashboard /></ProtectedRoute>
          } />

          {/* DONO */}
          <Route path="/painel-dono/*" element={
            <ProtectedRoute allowedRoles={['dono']}><DonoDashboard /></ProtectedRoute>
          } />

          {/* PROFISSIONAL */}
          <Route path="/painel-profissional/*" element={
            <ProtectedRoute allowedRoles={['profissional']}><ProfissionalDashboard /></ProtectedRoute>
          } />

          {/* LEGACY REDIRECTS */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/public/login" element={<Navigate to="/login" replace />} />
          <Route path="/public/404" element={<Navigate to="/404" replace />} />
          <Route path="/app/dashboard/*" element={<Navigate to="/painel-dono" replace />} />
          <Route path="/app/cliente/*" element={<Navigate to="/app" replace />} />
          <Route path="/app/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
          <Route path="/afiliado-saas/dashboard/*" element={<Navigate to="/afiliado-saas" replace />} />
          <Route path="/contador2026/dashboard/*" element={<Navigate to="/contador2026" replace />} />
          <Route path="/admin/dashboard/*" element={<Navigate to="/admin" replace />} />
          <Route path="/cliente/*" element={<Navigate to="/app" replace />} />
          <Route path="/dono/*" element={<Navigate to="/painel-dono" replace />} />
          <Route path="/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
          <Route path="/afiliado/*" element={<Navigate to="/afiliado-saas" replace />} />
          <Route path="/contador/*" element={<Navigate to="/contador2026" replace />} />
          <Route path="/super-admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="/super-admin2026ok" element={<Navigate to="/admin/login" replace />} />

          {/* 404 */}
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
