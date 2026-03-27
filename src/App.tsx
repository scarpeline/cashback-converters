/**
 * App.tsx - SALÃO CASHBACK
 * Rotas centralizadas. Sem guards duplicados.
 */

import { Suspense, lazy, useEffect, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { SystemDiagnostics } from "@/hooks/useSystemHealth";
import { StabilityMonitorProvider } from "@/components/monitoring/StabilityMonitorProvider";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { startAutomationWorker } from "@/lib/automation-worker";
import "@/styles/landing.css";

// Lazy pages
const Index = lazy(() => import("./pages/IndexNew"));
const PartnershipPage = lazy(() => import("./pages/public/PartnershipPage"));
const DemoPage = lazy(() => import("./pages/public/DemoPage"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));
const PublicLoginPage = lazy(() => import("./pages/public/LoginPage"));
const AfiliadoSaasLoginPage = lazy(
  () => import("./pages/afiliado-saas/LoginPage"),
);
const ContadorLoginPage = lazy(() => import("./pages/contador2026/LoginPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/LoginPage"));
const ClienteDashboard = lazy(
  () => import("./pages/dashboards/ClienteDashboard"),
);
const DonoDashboard = lazy(() => import("./pages/dashboards/DonoDashboard"));
const ProfissionalDashboard = lazy(() => import("./pages/dashboards/ProfissionalDashboard"));
const AfiliadoDashboard = lazy(() => import("./pages/dashboards/AfiliadoDashboard"));
const ContadorDashboard = lazy(() => import("./pages/dashboards/ContadorDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/dashboards/SuperAdminDashboard"));
const AutomationDashboard = lazy(() => import("./pages/dashboard/superadmin/AutomationDashboard"));
const PaymentSimulationPage = lazy(() => import("./pages/public/PaymentSimulationPage"));
const InstallPage = lazy(() => import("./pages/public/InstallPage"));
const CostAnalysisPage = lazy(() => import("./pages/public/CostAnalysisPage"));
const VitrinePage = lazy(() => import("./pages/public/VitrinePage"));
const ClientReactivationPage = lazy(
  () => import("./pages/dashboards/ClientReactivationPage"),
);
const PartnerManagementPage = lazy(
  () => import("./pages/dashboards/PartnerManagementPage"),
);
const PartnerDashboard = lazy(
  () => import("./components/partners/PartnerDashboard"),
);
const NotificationsPage = lazy(
  () => import("./pages/partners/NotificationsPage"),
);
const BookingPoliciesPage = lazy(
  () => import("./components/settings/BookingPoliciesPanel"),
);
const LandingPageB2B = lazy(
  () => import("./components/landing/LandingPageB2B"),
);
const OnboardingSelectionPage = lazy(
  () => import("./pages/onboarding/OnboardingSelectionPage"),
);

/**
 * QueryClient configurado para produção:
 * - staleTime: 60s → não refaz fetch se dado foi buscado há menos de 60s
 * - gcTime: 5min → mantém cache em memória por 5 minutos após componente desmontar
 * - retry: 1 → tenta apenas 1 vez extra em caso de erro (padrão 3)
 * - refetchOnWindowFocus: false → não refaz fetch ao focar a janela (reduz requisições)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
));
PageLoader.displayName = "PageLoader";

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ========== PUBLIC ========== */}
          <Route path="/" element={<Index />} />
          <Route path="/seja-um-franqueado" element={<PartnershipPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/simulacao-pagamento" element={<PaymentSimulationPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/analise-custos" element={<CostAnalysisPage />} />
          <Route path="/v/:barbershopId" element={<VitrinePage />} />
          <Route path="/para-empresas" element={<LandingPageB2B />} />
          <Route path="/onboarding" element={<OnboardingSelectionPage />} />

          {/* ========== LOGIN (AuthGuard) ========== */}
          <Route path="/login" element={<AuthGuard><PublicLoginPage /></AuthGuard>} />
          <Route path="/afiliado-saas/login" element={<AuthGuard><AfiliadoSaasLoginPage /></AuthGuard>} />
          <Route path="/contador2026/login" element={<AuthGuard><ContadorLoginPage /></AuthGuard>} />
          <Route path="/super-admin2026ok" element={<AuthGuard><AdminLoginPage /></AuthGuard>} />

          {/* ========== PROTECTED ========== */}
          <Route path="/app/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['cliente', 'afiliado_barberia', 'afiliado_barbearia']}>
                <ClienteDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/painel-dono/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['dono']}>
                <DonoDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/painel-profissional/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['profissional']}>
                <ProfissionalDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/reativacao-clientes" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['profissional', 'dono']}>
                <ClientReactivationPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/gestao-parceiros" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['dono', 'super_admin']}>
                <PartnerManagementPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/painel-parceiro" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['afiliado_saas', 'afiliado_barbearia']}>
                <PartnerDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/painel-parceiro/notificacoes" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['afiliado_saas', 'afiliado_barbearia']}>
                <NotificationsPage />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/afiliado-saas/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['afiliado_saas']}>
                <AfiliadoDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/contador2026/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['contador']}>
                <ContadorDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/admin/*" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/admin/automacao" element={
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AutomationDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
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
    </ErrorBoundary>
  );
}

const App = () => {
  useEffect(() => {
    startAutomationWorker();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <AuthProvider>
                <SubscriptionProvider>
                  <OnboardingProvider>
                    <StabilityMonitorProvider />
                    <AppRoutes />
                    <SystemDiagnostics />
                  </OnboardingProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
