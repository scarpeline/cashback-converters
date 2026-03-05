/**
 * App.tsx - SALÃO CASHBACK
 * Rotas centralizadas. Sem guards duplicados.
 */

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
const PaymentSimulationPage = lazy(() => import("./pages/public/PaymentSimulationPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ========== PUBLIC ========== */}
        <Route path="/" element={<Index />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/simulacao-pagamento" element={<PaymentSimulationPage />} />

        {/* ========== LOGIN (AuthGuard: se logado, vai pro dashboard) ========== */}
        <Route path="/login" element={<PublicLoginPage />} />
        <Route path="/afiliado-saas/login" element={<AfiliadoSaasLoginPage />} />
        <Route path="/contador2026/login" element={<ContadorLoginPage />} />
        <Route path="/super-admin2026ok" element={<AdminLoginPage />} />

        {/* ========== PROTECTED ========== */}
        <Route path="/app/*" element={
          <ProtectedRoute allowedRoles={['cliente', 'afiliado_barbearia']}><ClienteDashboard /></ProtectedRoute>
        } />
        <Route path="/painel-dono/*" element={
          <ProtectedRoute allowedRoles={['dono']}><DonoDashboard /></ProtectedRoute>
        } />
        <Route path="/painel-profissional/*" element={
          <ProtectedRoute allowedRoles={['profissional']}><ProfissionalDashboard /></ProtectedRoute>
        } />
        <Route path="/afiliado-saas/*" element={
          <ProtectedRoute allowedRoles={['afiliado_saas']}><AfiliadoDashboard /></ProtectedRoute>
        } />
        <Route path="/contador2026/*" element={
          <ProtectedRoute allowedRoles={['contador']}><ContadorDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>
        } />

        {/* ========== LEGACY REDIRECTS ========== */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/public/login" element={<Navigate to="/login" replace />} />
        <Route path="/public/404" element={<Navigate to="/404" replace />} />
        <Route path="/app/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
        <Route path="/cliente/*" element={<Navigate to="/app" replace />} />
        <Route path="/dono/*" element={<Navigate to="/painel-dono" replace />} />
        <Route path="/profissional/*" element={<Navigate to="/painel-profissional" replace />} />
        <Route path="/afiliado/*" element={<Navigate to="/afiliado-saas" replace />} />
        <Route path="/contador/*" element={<Navigate to="/contador2026" replace />} />
        <Route path="/super-admin/*" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/login" element={<Navigate to="/super-admin2026ok" replace />} />
        <Route path="/notificacoes" element={<Navigate to="/painel-dono/notificacoes" replace />} />

        {/* ========== 404 ========== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
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
