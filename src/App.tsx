import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth pages
import AuthPage from "./pages/auth/AuthPage";
import AffiliateSaasPage from "./pages/auth/AffiliateSaasPage";
import ContadorPage from "./pages/auth/ContadorPage";
import SuperAdminLoginPage from "./pages/auth/SuperAdminLoginPage";

// Dashboard pages
import ClienteDashboard from "./pages/dashboards/ClienteDashboard";
import DonoDashboard from "./pages/dashboards/DonoDashboard";
import ProfissionalDashboard from "./pages/dashboards/ProfissionalDashboard";
import AfiliadoDashboard from "./pages/dashboards/AfiliadoDashboard";
import ContadorDashboard from "./pages/dashboards/ContadorDashboard";
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/afiliado-saas" element={<AffiliateSaasPage />} />
            <Route path="/contador2026" element={<ContadorPage />} />
            <Route path="/super-admin2026ok" element={<SuperAdminLoginPage />} />
            
            {/* Protected Dashboard Routes */}
            <Route 
              path="/cliente/*" 
              element={
                <ProtectedRoute allowedRoles={['cliente', 'afiliado_barbearia']}>
                  <ClienteDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dono/*" 
              element={
                <ProtectedRoute allowedRoles={['dono']}>
                  <DonoDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profissional/*" 
              element={
                <ProtectedRoute allowedRoles={['profissional']}>
                  <ProfissionalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/afiliado/*" 
              element={
                <ProtectedRoute allowedRoles={['afiliado_saas']}>
                  <AfiliadoDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contador/*" 
              element={
                <ProtectedRoute allowedRoles={['contador']}>
                  <ContadorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/super-admin/*" 
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Redirect old super-admin path */}
            <Route path="/super-admin2026ok" element={<SuperAdminLoginPage />} />
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
