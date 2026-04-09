import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Scissors, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Check,
  Loader2,
  Store,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import LanguageSelector from '@/components/LanguageSelector';

// ── Sectors ──────────────────────────────────────────────────────────
const SECTORS = [
  { key: "beleza_estetica", label: "Beleza & Estética", icon: "✂️", description: "Salões, barbearias, nail designers, maquiadoras, esteticistas." },
  { key: "saude_bem_estar", label: "Saúde & Bem-Estar", icon: "❤️", description: "Clínicas, fisioterapeutas, psicólogos, massagistas, nutricionistas." },
  { key: "educacao_mentorias", label: "Educação & Mentorias", icon: "📚", description: "Professores, consultores, coaches, escolas de idiomas." },
  { key: "automotivo", label: "Automotivo", icon: "🚗", description: "Oficinas mecânicas, lava-rápidos, estética automotiva." },
  { key: "pets", label: "Pets", icon: "🐾", description: "Pet shops, veterinários, adestradores, cuidadores." },
  { key: "servicos_domiciliares", label: "Serviços Domiciliares", icon: "🏠", description: "Eletricistas, encanadores, diaristas, montadores." },
  { key: "juridico_financeiro", label: "Jurídico & Financeiro", icon: "💼", description: "Advogados, contadores, consultores financeiros." },
  { key: "espacos_locacao", label: "Espaços & Locação", icon: "🔑", description: "Salas de reunião, estúdios, quadras, coworking." },
];

// Sector key → sector_presets.sector mapping
const SECTOR_MAP: Record<string, string> = {
  beleza_estetica: "beleza",
  saude_bem_estar: "saude",
  educacao_mentorias: "educacao",
  automotivo: "automotivo",
  pets: "pets",
  servicos_domiciliares: "servicos",
  juridico_financeiro: "juridico",
  espacos_locacao: "espacos",
};

const OnboardingSelectionPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { selectedSector, setSelectedSector, selectedSpecialty, setSelectedSpecialty } = useOnboarding();
  
  const [step, setStep] = useState(1); // 1=type, 2=sector, 3=specialty, 4=business details
  const [userType, setUserType] = useState<'owner' | 'professional' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    cpf_cnpj: profile?.cpf_cnpj || "",
    phone: profile?.whatsapp || "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch specialties for selected sector
  const dbSector = selectedSector ? SECTOR_MAP[selectedSector] || selectedSector : null;
  const { data: specialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ["sector_specialties", dbSector],
    queryFn: async () => {
      if (!dbSector) return [];
      const { data, error } = await (supabase as any)
        .from("sector_presets")
        .select("*")
        .eq("sector", dbSector)
        .order("display_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!dbSector,
  });

  const handleSelectType = (type: 'owner' | 'professional') => {
    setUserType(type);
    if (type === 'professional') {
      navigate('/painel-profissional');
      return;
    }
    setStep(2);
  };

  const handleSelectSector = (key: string) => {
    setSelectedSector(key);
    setSelectedSpecialty(null);
    setStep(3);
  };

  const handleSelectSpecialty = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setStep(4);
  };

  const handleFinish = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) newErrors.name = "Nome obrigatório (mín. 2 caracteres)";
    if (!form.address || form.address.length < 5) newErrors.address = "Endereço obrigatório (mín. 5 caracteres)";
    if (form.cpf_cnpj.replace(/\D/g, "").length < 11) newErrors.cpf_cnpj = "CPF/CNPJ inválido";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (!user) return;
    setSaving(true);

    try {
      const baseSlug = form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `negocio-${user.id.slice(0, 8)}`;

      // Check existing
      const { data: existingList } = await (supabase as any).from("barbershops")
        .select("id, slug").eq("owner_user_id", user.id).order("created_at", { ascending: true }).limit(1);

      const existing = existingList?.[0];
      const payload = {
        owner_user_id: user.id,
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        description: form.description || null,
        sector: dbSector || null,
        specialty: selectedSpecialty || null,
        onboarding_status: "configured",
      };

      if (existing) {
        const { error } = await (supabase as any).from("barbershops").update({ ...payload, slug: existing.slug || baseSlug }).eq("id", existing.id);
        if (error) throw error;
      } else {
        let slugToUse = baseSlug;
        let { error } = await (supabase as any).from("barbershops").insert({ ...payload, slug: slugToUse });
        if (error?.message?.includes("barbershops_slug_key")) {
          slugToUse = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await (supabase as any).from("barbershops").insert({ ...payload, slug: slugToUse });
          error = retry.error;
        }
        if (error) throw error;
      }

      // Apply preset services if specialty selected
      if (selectedSpecialty && specialties?.length) {
        const preset = specialties.find((s: any) => s.specialty === selectedSpecialty);
        if (preset?.default_services?.length) {
          const { data: shop } = await (supabase as any).from("barbershops").select("id").eq("owner_user_id", user.id).order("created_at", { ascending: true }).limit(1).single();
          if (shop) {
            const servicesToInsert = preset.default_services.map((s: any) => ({
              barbershop_id: shop.id,
              name: s.name,
              duration_minutes: s.duration || 30,
              price: s.price || 0,
              is_active: true,
            }));
            await (supabase as any).from("services").insert(servicesToInsert);
          }
        }
      }

      if (form.cpf_cnpj) {
        await (supabase as any).from("profiles").update({ cpf_cnpj: form.cpf_cnpj }).eq("user_id", user.id);
      }

      toast.success("Cadastro concluído! 🎉");
      navigate("/painel-dono");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                s < step ? "bg-blue-500 text-white border-blue-500" : s === step ? "border-blue-500 text-blue-400" : "border-slate-700 text-slate-600"
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-blue-500" : "bg-slate-700"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: User Type */}
        {step === 1 && (
          <>
            <header className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Agenda Universal AI</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Como você deseja <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">utilizar</span>?
              </h1>
            </header>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <Card className="group relative overflow-hidden bg-slate-900/50 border-white/5 hover:border-blue-500/30 transition-all duration-500 cursor-pointer" onClick={() => handleSelectType('owner')}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Dono de Estabelecimento</h2>
                  <p className="text-slate-400 text-sm">Gerencie equipe, financeiro, marketing e clientes.</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">Começar <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-slate-900/50 border-white/5 hover:border-indigo-500/30 transition-all duration-500 cursor-pointer" onClick={() => handleSelectType('professional')}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Scissors className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Profissional / Autônomo</h2>
                  <p className="text-slate-400 text-sm">Agenda pessoal, ganhos e link de agendamento.</p>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">Começar <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* STEP 2: Sector Selection */}
        {step === 2 && (
          <>
            <header className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white">Qual é o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">seu setor</span>?</h1>
              <p className="text-slate-400">Escolha o segmento do seu negócio para personalizarmos tudo</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
              {SECTORS.map((sector) => (
                <button
                  key={sector.key}
                  onClick={() => handleSelectSector(sector.key)}
                  className={`group flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 text-center hover:scale-[1.03] ${
                    selectedSector === sector.key
                      ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                      : "bg-slate-900/50 border-white/5 hover:border-blue-500/20 hover:bg-slate-900/80"
                  }`}
                >
                  <span className="text-4xl mb-3">{sector.icon}</span>
                  <span className="font-bold text-white text-sm">{sector.label}</span>
                  <span className="text-slate-500 text-xs mt-1 leading-tight">{sector.description}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-start pt-4">
              <Button variant="ghost" className="text-slate-400" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Specialty Selection */}
        {step === 3 && (
          <>
            <header className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white">Qual é sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">especialidade</span>?</h1>
              <p className="text-slate-400">Selecionaremos serviços e configurações ideais para você</p>
            </header>

            {loadingSpecialties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : specialties && specialties.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4">
                {specialties.map((spec: any) => (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSpecialty(spec.specialty)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 text-center hover:scale-[1.03] ${
                      selectedSpecialty === spec.specialty
                        ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                        : "bg-slate-900/50 border-white/5 hover:border-blue-500/20"
                    }`}
                  >
                    <span className="font-bold text-white text-sm">{spec.display_name}</span>
                    {selectedSpecialty === spec.specialty && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">Não há especialidades pré-definidas para este setor.</p>
                <Button onClick={() => setStep(4)} className="bg-blue-600 hover:bg-blue-500 text-white">
                  Continuar sem especialidade <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="ghost" className="text-slate-400" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              {specialties && specialties.length > 0 && !selectedSpecialty && (
                <Button variant="ghost" className="text-blue-400" onClick={() => setStep(4)}>
                  Pular <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* STEP 4: Business Details */}
        {step === 4 && (
          <>
            <header className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-white">Dados do <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">seu negócio</span></h1>
              <p className="text-slate-400">Complete o cadastro para começar</p>
            </header>

            <Card className="bg-slate-900/50 border-white/5 max-w-lg mx-auto">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Nome do Estabelecimento *</label>
                  <Input
                    placeholder="Ex: Studio Maria"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`mt-1 bg-slate-800/50 border-slate-700 text-white ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Endereço Completo *</label>
                  <Input
                    placeholder="Rua, número, bairro, cidade"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={`mt-1 bg-slate-800/50 border-slate-700 text-white ${errors.address ? "border-red-500" : ""}`}
                  />
                  {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">CPF ou CNPJ *</label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf_cnpj}
                    onChange={(e) => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })}
                    className={`mt-1 bg-slate-800/50 border-slate-700 text-white ${errors.cpf_cnpj ? "border-red-500" : ""}`}
                  />
                  {errors.cpf_cnpj && <p className="text-xs text-red-400 mt-1">{errors.cpf_cnpj}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Telefone / WhatsApp</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: formatWhatsAppBR(e.target.value) })}
                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="text-slate-400" onClick={() => setStep(3)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={handleFinish} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {saving ? "Cadastrando..." : "Finalizar Cadastro"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="pt-4 flex items-center justify-center gap-6 text-slate-500 text-sm">
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
    </div>
  );
};

export default OnboardingSelectionPage;
