import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { SectorSelector } from "@/components/onboarding/SectorSelector";
import { SpecialtySelector } from "@/components/onboarding/SpecialtySelector";
import LanguageSelector from '@/components/LanguageSelector';

const SECTOR_LABELS: Record<string, string> = {
  beleza_estetica: "Beleza & Estética",
  saude_bem_estar: "Saúde & Bem-Estar",
  educacao_mentorias: "Educação & Mentorias",
  automotivo: "Automotivo",
  pets: "Pets",
  servicos_domiciliares: "Serviços Domiciliares",
  juridico_financeiro: "Jurídico & Financeiro",
  espacos_locacao: "Espaços & Locação",
};

const STEPS = [
  { id: 1, label: "Setor" },
  { id: 2, label: "Especialidade" },
  { id: 3, label: "Confirmar" },
];

const OnboardingSelectionPage = () => {
  const navigate = useNavigate();
  const { selectedSector, selectedSpecialty, resetOnboarding } = useOnboarding();
  const [step, setStep] = useState(1);

  const canAdvanceStep1 = !!selectedSector;
  const canAdvanceStep2 = !!selectedSpecialty || !!selectedSector;

  const handleConfirm = () => {
    navigate('/login');
  };

  const handleBack = () => {
    if (step === 1) {
      resetOnboarding();
      navigate('/');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col p-4 overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between py-4 max-w-5xl mx-auto w-full">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? "Voltar ao início" : "Etapa anterior"}
        </button>
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative z-10 flex items-center justify-center gap-2 py-6">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                step > s.id ? "bg-green-500 border-green-500 text-white" :
                step === s.id ? "border-blue-500 text-blue-400 bg-blue-500/10" :
                "border-slate-600 text-slate-500"
              }`}>
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.id ? "text-white" : "text-slate-500"}`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 transition-colors ${step > s.id ? "bg-green-500" : "bg-slate-700"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start max-w-5xl mx-auto w-full py-4">
        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Plataforma Multi-Nicho com IA</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Qual é o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">segmento?</span>
              </h1>
              <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                Configuramos todo o sistema automaticamente para o seu nicho, com serviços, automações e fluxos ideais.
              </p>
            </div>
            <SectorSelector />
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => canAdvanceStep1 && setStep(2)}
                disabled={!canAdvanceStep1}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <p className="text-blue-400 text-sm font-medium uppercase tracking-wider">
                {SECTOR_LABELS[selectedSector || ''] || selectedSector}
              </p>
              <h2 className="text-2xl md:text-4xl font-bold text-white">
                Qual é a sua especialidade?
              </h2>
              <p className="text-slate-400">Isso personaliza seus serviços e automações iniciais.</p>
            </div>
            <SpecialtySelector />
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setStep(3)}
                disabled={!canAdvanceStep2}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-lg disabled:opacity-40"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white">Tudo pronto!</h2>
              <p className="text-slate-400">Configuraremos sua plataforma com base no perfil selecionado.</p>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400">Segmento</span>
                <span className="text-white font-semibold">{SECTOR_LABELS[selectedSector || ''] || selectedSector || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400">Especialidade</span>
                <span className="text-white font-semibold">{selectedSpecialty || 'Geral'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400">Configuração automática</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Ativada
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-slate-300 text-sm">Serviços pré-configurados</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                <span className="text-slate-300 text-sm">Automações de WhatsApp</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                <span className="text-slate-300 text-sm">IA personalizada</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-slate-300 text-sm">7 dias grátis</span>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 text-lg rounded-xl"
            >
              Criar minha conta grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-center text-slate-500 text-xs">
              Sem cartão de crédito. Cancele a qualquer momento.
            </p>
          </div>
        )}
      </div>

      <footer className="relative z-10 py-6 text-center text-slate-600 text-xs max-w-5xl mx-auto w-full border-t border-white/5">
        &copy; {new Date().getFullYear()} SalãoCashBack. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default OnboardingSelectionPage;