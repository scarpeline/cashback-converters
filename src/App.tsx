import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Placeholder pages for dashboards
import ClienteDashboard from "./pages/dashboards/ClienteDashboard";
import DonoDashboard from "./pages/dashboards/DonoDashboard";
import ProfissionalDashboard from "./pages/dashboards/ProfissionalDashboard";
import AfiliadoDashboard from "./pages/dashboards/AfiliadoDashboard";
import SuperAdmin from "./pages/SuperAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboards */}
          <Route path="/cliente/*" element={<ClienteDashboard />} />
          <Route path="/dono/*" element={<DonoDashboard />} />
          <Route path="/profissional/*" element={<ProfissionalDashboard />} />
          <Route path="/afiliado/*" element={<AfiliadoDashboard />} />
          
          {/* Super Admin */}
          <Route path="/super-admin2026ok" element={<SuperAdmin />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
