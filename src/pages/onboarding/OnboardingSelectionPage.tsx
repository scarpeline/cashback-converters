import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Scissors, ChevronRight, ChevronLeft,
  ArrowRight, Lock, Check, Loader2, Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import { applyInitialPreset } from "@/services/onboardingService";
import LanguageSelector from "@/components/LanguageSelector";

// ── Sectors ──────────────────────────────────────────────────────────────────
const SECTORS = [
  { key: "beleza_estetica",       label: "Beleza & Estética",       icon: "✂️",  desc: "Salões, barbearias, nail designers, esteticistas." },
  { key: "saude_bem_estar",       label: "Saúde & Bem-Estar",       icon: "❤️",  desc: "Clínicas, fisioterapeutas, psicólogos, nutricionistas." },
  { key: "educacao_mentorias",    label: "Educação & Mentorias",    icon: "📚",  desc: "Professores, coaches, consultores, idiomas." },
  { key: "automotivo",            label: "Automotivo",              icon: "🚗",  desc: "Oficinas, lava-rápidos, estética automotiva." },
  { key: "pets",                  label: "Pets",                    icon: "🐾",  desc: "Pet shops, veterinários, adestradores." },
  { key: "servicos_domiciliares", label: "Serviços Domiciliares",   icon: "🏠",  desc: "Eletricistas, encanadores, diaristas." },
  { key: "juridico_financeiro",   label: "Jurídico & Financeiro",   icon: "💼",  desc: "Advogados, contadores, consultores." },
  { key: "espacos_locacao",       label: "Espaços & Locação",       icon: "🔑",  desc: "Salas, estúdios, quadras, coworking." },
];

// Labels específicos por nicho para o dashboard
const NICHE_LABELS: Record<string, { professionals: string; services: string; appointments: string; clients: string }> = {
  beleza_estetica:       { professionals: "Profissionais",  services: "Serviços",          appointments: "Agendamentos", clients: "Clientes" },
  saude_bem_estar:       { professionals: "Especialistas",  services: "Sessões/Consultas",  appointments: "Consultas",    clients: "Pacientes" },
  educacao_mentorias:    { professionals: "Professores",    services: "Aulas/Sessões",      appointments: "Aulas",        clients: "Alunos" },
  automotivo:            { professionals: "Mecânicos",      services: "Serviços",           appointments: "Ordens",       clients: "Clientes" },
  pets:                  { professionals: "Profissionais",  services: "Serviços Pet",       appointments: "Atendimentos", clients: "Tutores" },
  servicos_domiciliares: { professionals: "Profissionais",  services: "Serviços",           appointments: "Visitas",      clients: "Clientes" },
  juridico_financeiro:   { professionals: "Especialistas",  services: "Consultorias",       appointments: "Consultas",    clients: "Clientes" },
  espacos_locacao:       { professionals: "Gestores",       services: "Espaços",            appointments: "Reservas",     clients: "Locatários" },
};

const STEPS = ["Perfil", "Setor", "Especialidade", "Negócio"];

const OnboardingSelectionPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { selectedSector, setSelectedSector, selectedSpecialty, setSelectedSpecialty } = useOnboarding();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"owner" | "professional" | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    address: "",
    cpf_cnpj: profile?.cpf_cnpj || "",
    phone: profile?.whatsapp || "",
    description: "",
  });

  // Fetch specialties from sector_presets using the sector key directly
  const { data: specialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ["sector_specialties", selectedSector],
    queryFn: async () => {
      if (!selectedSector) return [];
      // Try exact match first
      const { data, error } = await (supabase as any)
        .from("sector_presets")
        .select("id, sector, specialty, display_name, description, icon, default_services")
        .eq("sector", selectedSector)
        .order("display_name");
      if (!error && data && data.length > 0) return data;
      // Fallback: try legacy sector key mapping
      const altMap: Record<string, string> = {
        beleza_estetica: "beleza",
        saude_bem_estar: "saude",
        educacao_mentorias: "educacao",
        servicos_domiciliares: "servicos",
        juridico_financeiro: "juridico",
        espacos_locacao: "espacos",
      };
      const alt = altMap[selectedSector];
      if (alt) {
        const { data: d2 } = await (supabase as any)
          .from("sector_presets")
          .select("id, sector, specialty, display_name, description, icon, default_services")
          .eq("sector", alt)
          .order("display_name");
        return d2 || [];
      }
      return [];
    },
    enabled: !!selectedSector,
  });

  const handleSelectType = (type: "owner" | "professional") => {
    setUserType(type);
    if (type === "professional") {
      navigate("/painel-profissional");
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
    if (!form.address || form.address.length < 5) newErrors.address = "Endereço obrigatório";
    if (form.cpf_cnpj.replace(/\D/g, "").length < 11) newErrors.cpf_cnpj = "CPF/CNPJ inválido";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (!user) return;

    setSaving(true);
    try {
      const baseSlug = form.name
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `negocio-${user.id.slice(0, 8)}`;

      const nicheLabels = selectedSector ? NICHE_LABELS[selectedSector] : null;

      const payload = {
        owner_user_id: user.id,
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        description: form.description || null,
        sector: selectedSector || null,
        specialty: selectedSpecialty || null,
        onboarding_status: "configured",
        // Store niche labels in metadata for dynamic UI
        ...(nicheLabels ? { niche_labels: nicheLabels } : {}),
      };

      // Check existing barbershop
      const { data: existingList } = await (supabase as any)
        .from("barbershops").select("id, slug")
        .eq("owner_user_id", user.id).order("created_at", { ascending: true }).limit(1);

      const existing = existingList?.[0];
      let barbershopId: string;

      if (existing) {
        const { error } = await (supabase as any).from("barbershops")
          .update({ ...payload, slug: existing.slug || baseSlug }).eq("id", existing.id);
        if (error) throw error;
        barbershopId = existing.id;
      } else {
        let slugToUse = baseSlug;
        let { data: inserted, error } = await (supabase as any).from("barbershops")
          .insert({ ...payload, slug: slugToUse }).select("id").single();
        if (error?.message?.includes("barbershops_slug_key")) {
          slugToUse = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await (supabase as any).from("barbershops")
            .insert({ ...payload, slug: slugToUse }).select("id").single();
          if (retry.error) throw retry.error;
          inserted = retry.data;
        } else if (error) throw error;
        barbershopId = inserted.id;
      }

      // Apply full preset (services + automations + policies + resources)
      if (selectedSector && selectedSpecialty && specialties?.length) {
        const preset = specialties.find((s: any) =>
          s.specialty === selectedSpecialty || s.display_name === selectedSpecialty
        );
        if (preset) {
          await applyInitialPreset(user.id, barbershopId, selectedSector, selectedSpecialty, preset);
        } else {
          // Apply services only from any matching preset
          const anyPreset = specialties[0];
          if (anyPreset?.default_services?.length) {
            const svcs = anyPreset.default_services.map((s: any) => ({
              barbershop_id: barbershopId,
              name: s.name,
              duration_minutes: s.duration || 30,
              price: s.price || 0,
              is_active: true,
            }));
            await (supabase as any).from("services").insert(svcs);
          }
        }
      }

      // Update profile CPF
      if (form.cpf_cnpj) {
        await (supabase as any).from("profiles")
          .update({ cpf_cnpj: form.cpf_cnpj }).eq("user_id", user.id);
      }

      toast.success("Cadastro concluído! Bem-vindo ao sistema 🎉");
      navigate("/painel-dono");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Language selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-2xl">
        {/* Logo + title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-500 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Agenda Universal
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Configure seu negócio</h1>
          <p className="text-sm text-slate-500 mt-1">Leva menos de 2 minutos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const done = s < step;
            const active = s === step;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                    done ? "bg-orange-500 border-orange-500 text-white"
                    : active ? "border-orange-500 text-orange-500 bg-white"
                    : "border-slate-200 text-slate-400 bg-white"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-orange-500" : "text-slate-400"}`}>{label}</span>
                </div>
                {s < STEPS.length && (
                  <div className={`w-12 h-0.5 mb-4 mx-1 ${done ? "bg-orange-500" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: Tipo de usuário ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-6">Como você vai usar o sistema?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectType("owner")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Building2 className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Dono de Negócio</p>
                  <p className="text-xs text-slate-500 mt-0.5">Gerencie equipe, agenda e financeiro</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectType("professional")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Scissors className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Profissional Autônomo</p>
                  <p className="text-xs text-slate-500 mt-0.5">Agenda pessoal e link de agendamento</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Setor ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Qual é o seu setor?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">Vamos personalizar tudo para o seu tipo de negócio</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SECTORS.map((sector) => (
                <button
                  key={sector.key}
                  onClick={() => handleSelectSector(sector.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] text-center ${
                    selectedSector === sector.key
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-3xl">{sector.icon}</span>
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{sector.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-start pt-2">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Especialidade ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Qual é sua especialidade?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Vamos pré-configurar seus serviços, automações e políticas automaticamente
            </p>

            {loadingSpecialties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : specialties && specialties.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialties.map((spec: any) => (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSpecialty(spec.specialty)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] text-center ${
                      selectedSpecialty === spec.specialty
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                    }`}
                  >
                    {selectedSpecialty === spec.specialty && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-800">{spec.display_name || spec.specialty}</span>
                    {spec.default_services?.length > 0 && (
                      <span className="text-[10px] text-slate-400">{spec.default_services.length} serviços inclusos</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">Nenhuma especialidade pré-definida para este setor.</p>
                <p className="text-xs text-slate-400 mt-1">Você configurará seus serviços manualmente.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button onClick={() => setStep(4)} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors">
                {selectedSpecialty ? "Continuar" : "Pular"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Dados do negócio ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Dados do seu negócio</h2>
            {selectedSector && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">{SECTORS.find(s => s.key === selectedSector)?.icon}</span>
                <span className="text-sm font-medium text-slate-700">
                  {SECTORS.find(s => s.key === selectedSector)?.label}
                  {selectedSpecialty && ` · ${selectedSpecialty}`}
                </span>
              </div>
            )}

            <div className="space-y-3 max-w-md mx-auto">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome do estabelecimento *</label>
                <Input
                  placeholder="Ex: Studio Maria, Clínica Saúde+"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`mt-1 h-11 text-slate-900 border-slate-200 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Endereço completo *</label>
                <Input
                  placeholder="Rua, número, bairro, cidade"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className={`mt-1 h-11 text-slate-900 border-slate-200 ${errors.address ? "border-red-400" : ""}`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">CPF ou CNPJ *</label>
                <Input
                  placeholder="000.000.000-00"
                  value={form.cpf_cnpj}
                  onChange={e => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })}
                  className={`mt-1 h-11 text-slate-900 border-slate-200 ${errors.cpf_cnpj ? "border-red-400" : ""}`}
                />
                {errors.cpf_cnpj && <p className="text-xs text-red-500 mt-1">{errors.cpf_cnpj}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: formatWhatsAppBR(e.target.value) })}
                  className="mt-1 h-11 text-slate-900 border-slate-200"
                />
              </div>

              {selectedSpecialty && specialties?.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-xs font-medium text-orange-600 mb-1">O que será configurado automaticamente:</p>
                  <ul className="text-xs text-orange-500 space-y-0.5">
                    {(() => {
                      const preset = specialties.find((s: any) => s.specialty === selectedSpecialty);
                      return [
                        preset?.default_services?.length && `✓ ${preset.default_services.length} serviços pré-configurados`,
                        "✓ Automações de lembrete e confirmação",
                        "✓ Políticas de agendamento",
                      ].filter(Boolean).map((item, i) => <li key={i}>{item}</li>);
                    })()}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors px-3">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Configurando...</> : <>Finalizar Cadastro <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-10 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Sistemas online
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Dados criptografados
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSelectionPage;
