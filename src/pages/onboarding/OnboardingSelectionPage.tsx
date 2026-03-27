import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Scissors, 
  Sparkles, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import LanguageSelector from '@/components/LanguageSelector';

const OnboardingSelectionPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setSelectedSector } = useOnboarding();

  const handleSelect = (type: 'owner' | 'barber') => {
    setSelectedSector(type === 'barber' ? 'barbearia' : 'business');
    if (type === 'owner') {
      navigate('/onboarding/owner');
    } else {
      navigate('/onboarding/barber');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Language Selector in Corner */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Agenda AI Premium v2.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Futuro do Agendamento</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Escolha como você deseja utilizar nossa plataforma potencializada por Inteligência Artificial.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 pt-8">
          {/* Card Dono */}
          <Card 
            className="group relative overflow-hidden bg-slate-900/50 border-white/5 hover:border-blue-500/30 transition-all duration-500 cursor-pointer"
            onClick={() => handleSelect('owner')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Dono de Estabelecimento</h2>
                <p className="text-slate-400 leading-relaxed">
                  Gerencie sua equipe, financeiro, marketing automático e fidelização de clientes em um só lugar.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500/50" />
                  <span>Dashboard Administrativo Completo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500/50" />
                  <span>IA para Campanhas de Marketing</span>
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none group-hover:gap-4 transition-all">
                Começar agora
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Card Profissional */}
          <Card 
            className="group relative overflow-hidden bg-slate-900/50 border-white/5 hover:border-indigo-500/30 transition-all duration-500 cursor-pointer"
            onClick={() => handleSelect('barber')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Scissors className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">Profissional / Autônomo</h2>
                <p className="text-slate-400 leading-relaxed">
                  Organize sua agenda pessoal, acompanhe seus ganhos e tenha um link exclusivo de agendamento.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500/50" />
                  <span>Agenda Digital Inteligente</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500/50" />
                  <span>Link de Agendamento Online</span>
                </li>
              </ul>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-none group-hover:gap-4 transition-all">
                Começar agora
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sistemas Online via Cloud
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Criptografia de Ponta-a-Ponta
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-8 text-center text-slate-500 text-sm border-t border-white/5">
        &copy; {new Date().getFullYear()} Agenda AI Premium. Todos os direitos reservados.
      </footer>
    </div>
  );
};

// Componente Lock não estava importado, corrigindo
const Lock = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default OnboardingSelectionPage;