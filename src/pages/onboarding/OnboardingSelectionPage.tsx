import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Scissors, ChevronRight, ChevronLeft,
  ArrowRight, Lock, Check, Loader2, Sparkles, User,
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
  // Existentes
  { key: "beleza_estetica",       label: "Beleza & Estética",       icon: "✂️",  desc: "Salões, barbearias, nail designers, esteticistas." },
  { key: "saude_bem_estar",       label: "Saúde & Bem-Estar",       icon: "❤️",  desc: "Clínicas, fisioterapeutas, psicólogos, nutricionistas." },
  { key: "educacao_mentorias",    label: "Educação & Mentorias",    icon: "📚",  desc: "Professores, coaches, consultores, idiomas." },
  { key: "automotivo",            label: "Automotivo",              icon: "🚗",  desc: "Oficinas, lava-rápidos, estética automotiva." },
  { key: "pets",                  label: "Pets",                    icon: "🐾",  desc: "Pet shops, veterinários, adestradores." },
  { key: "servicos_domiciliares", label: "Serviços Domiciliares",   icon: "🏠",  desc: "Eletricistas, encanadores, diaristas." },
  { key: "juridico_financeiro",   label: "Jurídico & Financeiro",   icon: "💼",  desc: "Advogados, contadores, consultores." },
  { key: "espacos_locacao",       label: "Espaços & Locação",       icon: "🔑",  desc: "Salas, estúdios, quadras, coworking." },
  // Novos setores
  { key: "esportes_fitness",      label: "Esportes & Fitness",      icon: "🏋️",  desc: "Personal trainers, academias, crossfit, natação." },
  { key: "tatuagem_piercing",     label: "Tatuagem & Piercing",     icon: "🎨",  desc: "Estúdios de tatuagem, piercing e body art." },
  { key: "fotografia_video",      label: "Fotografia & Vídeo",      icon: "📸",  desc: "Fotógrafos, videomakers, ensaios e eventos." },
  { key: "gastronomia_eventos",   label: "Gastronomia & Eventos",   icon: "🍽️",  desc: "Chefs, buffets, bartenders, confeiteiros." },
  { key: "tecnologia_ti",         label: "Tecnologia & TI",         icon: "💻",  desc: "Suporte técnico, desenvolvimento, consultoria." },
  { key: "terapias_alternativas", label: "Terapias Alternativas",   icon: "🌿",  desc: "Acupuntura, reiki, meditação, yoga." },
  { key: "moda_imagem",           label: "Moda & Imagem",           icon: "👗",  desc: "Personal stylist, consultores de imagem, alfaiates." },
  { key: "musica_artes",          label: "Música & Artes",          icon: "🎵",  desc: "Professores de música, artistas, ateliês." },
];

// ── Especialidades embutidas (fallback quando banco não retorna dados) ─────────
const FALLBACK_SPECIALTIES: Record<string, { specialty: string; display_name: string; icon: string; services_count: number }[]> = {
  beleza_estetica: [
    { specialty: "barbearia",      display_name: "Barbearia",       icon: "✂️", services_count: 3 },
    { specialty: "salao_de_beleza",display_name: "Salão de Beleza", icon: "💇", services_count: 3 },
    { specialty: "nail_designer",  display_name: "Nail Designer",   icon: "💅", services_count: 3 },
    { specialty: "esteticista",    display_name: "Esteticista",     icon: "✨", services_count: 3 },
    { specialty: "maquiadora",     display_name: "Maquiadora",      icon: "🎨", services_count: 2 },
  ],
  saude_bem_estar: [
    { specialty: "fisioterapia",   display_name: "Fisioterapia",    icon: "🏥", services_count: 2 },
    { specialty: "pilates",        display_name: "Pilates",         icon: "🧘", services_count: 2 },
    { specialty: "psicologia",     display_name: "Psicologia",      icon: "🧠", services_count: 2 },
    { specialty: "nutricao",       display_name: "Nutrição",        icon: "🍎", services_count: 2 },
    { specialty: "massagem",       display_name: "Massoterapia",    icon: "💆", services_count: 2 },
  ],
  educacao_mentorias: [
    { specialty: "aulas_particulares", display_name: "Aulas Particulares", icon: "📖", services_count: 2 },
    { specialty: "coaching",           display_name: "Coaching",           icon: "🎯", services_count: 2 },
    { specialty: "idiomas",            display_name: "Idiomas",            icon: "🌍", services_count: 2 },
  ],
  automotivo: [
    { specialty: "oficina",            display_name: "Oficina Mecânica",   icon: "🔧", services_count: 2 },
    { specialty: "estetica_automotiva",display_name: "Estética Automotiva",icon: "🚗", services_count: 2 },
    { specialty: "lava_rapido",        display_name: "Lava-Rápido",        icon: "💧", services_count: 2 },
  ],
  pets: [
    { specialty: "banho_tosa",    display_name: "Banho & Tosa",    icon: "🛁", services_count: 3 },
    { specialty: "veterinario",   display_name: "Veterinário",     icon: "🏥", services_count: 2 },
    { specialty: "adestramento",  display_name: "Adestramento",    icon: "🐾", services_count: 2 },
  ],
  servicos_domiciliares: [
    { specialty: "eletricista",   display_name: "Eletricista",     icon: "⚡", services_count: 2 },
    { specialty: "encanador",     display_name: "Encanador",       icon: "💧", services_count: 2 },
    { specialty: "diarista",      display_name: "Diarista",        icon: "🏠", services_count: 2 },
  ],
  juridico_financeiro: [
    { specialty: "advogado",           display_name: "Advogado",           icon: "⚖️", services_count: 2 },
    { specialty: "contador",           display_name: "Contador",           icon: "🧮", services_count: 2 },
    { specialty: "consultor_financeiro",display_name: "Consultor Financeiro",icon: "📈", services_count: 2 },
  ],
  espacos_locacao: [
    { specialty: "salas_reuniao",  display_name: "Salas de Reunião", icon: "🏢", services_count: 2 },
    { specialty: "estudio",        display_name: "Estúdio",          icon: "🎬", services_count: 2 },
    { specialty: "quadra",         display_name: "Quadra Esportiva", icon: "⚽", services_count: 2 },
  ],
  // Novos setores
  esportes_fitness: [
    { specialty: "personal_trainer",  display_name: "Personal Trainer",   icon: "🏋️", services_count: 3 },
    { specialty: "crossfit",          display_name: "CrossFit",           icon: "💪", services_count: 2 },
    { specialty: "natacao",           display_name: "Natação",            icon: "🏊", services_count: 2 },
    { specialty: "yoga",              display_name: "Yoga",               icon: "🧘", services_count: 2 },
    { specialty: "artes_marciais",    display_name: "Artes Marciais",     icon: "🥋", services_count: 2 },
    { specialty: "spinning_bike",     display_name: "Spinning / Bike",    icon: "🚴", services_count: 2 },
  ],
  tatuagem_piercing: [
    { specialty: "tatuagem",          display_name: "Tatuagem",           icon: "🖊️", services_count: 3 },
    { specialty: "piercing",          display_name: "Piercing",           icon: "💎", services_count: 2 },
    { specialty: "micropigmentacao",  display_name: "Micropigmentação",   icon: "✏️", services_count: 3 },
    { specialty: "laser_remocao",     display_name: "Remoção a Laser",    icon: "⚡", services_count: 2 },
  ],
  fotografia_video: [
    { specialty: "fotografo_eventos", display_name: "Fotógrafo de Eventos", icon: "📸", services_count: 3 },
    { specialty: "ensaio_fotografico",display_name: "Ensaio Fotográfico",   icon: "🤳", services_count: 3 },
    { specialty: "videomaker",        display_name: "Videomaker",           icon: "🎬", services_count: 2 },
    { specialty: "fotografo_produto", display_name: "Foto de Produto",      icon: "📦", services_count: 2 },
  ],
  gastronomia_eventos: [
    { specialty: "chef_particular",   display_name: "Chef Particular",    icon: "👨‍🍳", services_count: 3 },
    { specialty: "confeiteiro",       display_name: "Confeiteiro",        icon: "🎂", services_count: 3 },
    { specialty: "bartender",         display_name: "Bartender",          icon: "🍹", services_count: 2 },
    { specialty: "buffet",            display_name: "Buffet & Eventos",   icon: "🍽️", services_count: 2 },
  ],
  tecnologia_ti: [
    { specialty: "suporte_tecnico",   display_name: "Suporte Técnico",    icon: "🖥️", services_count: 3 },
    { specialty: "dev_freelancer",    display_name: "Dev Freelancer",     icon: "💻", services_count: 2 },
    { specialty: "consultoria_ti",    display_name: "Consultoria TI",     icon: "🔧", services_count: 2 },
    { specialty: "designer_grafico",  display_name: "Designer Gráfico",   icon: "🎨", services_count: 2 },
  ],
  terapias_alternativas: [
    { specialty: "acupuntura",        display_name: "Acupuntura",         icon: "🪡", services_count: 2 },
    { specialty: "reiki",             display_name: "Reiki",              icon: "✨", services_count: 2 },
    { specialty: "meditacao",         display_name: "Meditação",          icon: "🧘", services_count: 2 },
    { specialty: "terapia_holistica", display_name: "Terapia Holística",  icon: "🌿", services_count: 2 },
    { specialty: "hipnoterapia",      display_name: "Hipnoterapia",       icon: "🌀", services_count: 2 },
  ],
  moda_imagem: [
    { specialty: "personal_stylist",  display_name: "Personal Stylist",   icon: "👗", services_count: 2 },
    { specialty: "consultor_imagem",  display_name: "Consultor de Imagem",icon: "🪞", services_count: 2 },
    { specialty: "alfaiate",          display_name: "Alfaiate",           icon: "🧵", services_count: 3 },
    { specialty: "colorista_pessoal", display_name: "Colorista Pessoal",  icon: "🎨", services_count: 2 },
  ],
  musica_artes: [
    { specialty: "aulas_musica",      display_name: "Aulas de Música",    icon: "🎸", services_count: 2 },
    { specialty: "aulas_canto",       display_name: "Aulas de Canto",     icon: "🎤", services_count: 2 },
    { specialty: "atelie_artes",      display_name: "Ateliê de Artes",    icon: "🖌️", services_count: 2 },
    { specialty: "danca",             display_name: "Dança",              icon: "💃", services_count: 2 },
    { specialty: "teatro",            display_name: "Teatro",             icon: "🎭", services_count: 2 },
  ],
};

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
  // Novos setores
  esportes_fitness:      { professionals: "Instrutores",    services: "Treinos/Aulas",      appointments: "Treinos",      clients: "Alunos" },
  tatuagem_piercing:     { professionals: "Artistas",       services: "Trabalhos",          appointments: "Sessões",      clients: "Clientes" },
  fotografia_video:      { professionals: "Fotógrafos",     services: "Ensaios/Produções",  appointments: "Sessões",      clients: "Clientes" },
  gastronomia_eventos:   { professionals: "Chefs",          services: "Serviços",           appointments: "Eventos",      clients: "Clientes" },
  tecnologia_ti:         { professionals: "Especialistas",  services: "Serviços TI",        appointments: "Atendimentos", clients: "Clientes" },
  terapias_alternativas: { professionals: "Terapeutas",     services: "Terapias",           appointments: "Sessões",      clients: "Pacientes" },
  moda_imagem:           { professionals: "Consultores",    services: "Consultorias",       appointments: "Consultas",    clients: "Clientes" },
  musica_artes:          { professionals: "Professores",    services: "Aulas",              appointments: "Aulas",        clients: "Alunos" },
};

// Passos para dono: Perfil → Setor → Especialidade → Negócio
// Passos para profissional: Perfil → Setor → Especialidade → Dados pessoais
const STEPS_OWNER = ["Perfil", "Setor", "Especialidade", "Negócio"];
const STEPS_PROF  = ["Perfil", "Especialidade", "Seus Dados"];

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
  // Para profissional autônomo: setor próprio (não usa o contexto global)
  const [profSector, setProfSector] = useState<string | null>(null);
  const [profSpecialty, setProfSpecialty] = useState<string | null>(null);

  const currentSteps = userType === "professional" ? STEPS_PROF : STEPS_OWNER;

  // Fetch specialties from sector_presets — com fallback embutido
  const activeSector = userType === "professional" ? profSector : selectedSector;
  const { data: dbSpecialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ["sector_specialties", activeSector],
    queryFn: async () => {
      if (!activeSector) return [];
      const { data, error } = await (supabase as any)
        .from("sector_presets")
        .select("id, sector, specialty, display_name, description, icon, default_services")
        .eq("sector", activeSector)
        .order("display_name");
      if (!error && data && data.length > 0) return data;
      // Fallback: legacy keys
      const altMap: Record<string, string> = {
        beleza_estetica: "beleza", saude_bem_estar: "saude",
        educacao_mentorias: "educacao", servicos_domiciliares: "servicos",
        juridico_financeiro: "juridico", espacos_locacao: "espacos",
      };
      const alt = altMap[activeSector];
      if (alt) {
        const { data: d2 } = await (supabase as any)
          .from("sector_presets")
          .select("id, sector, specialty, display_name, description, icon, default_services")
          .eq("sector", alt).order("display_name");
        if (d2 && d2.length > 0) return d2;
      }
      return [];
    },
    enabled: !!activeSector,
  });

  // Usa dados do banco se existirem, senão usa fallback embutido
  const specialties = (dbSpecialties && dbSpecialties.length > 0)
    ? dbSpecialties
    : (activeSector ? (FALLBACK_SPECIALTIES[activeSector] || []).map((s, i) => ({
        id: `fallback-${i}`, sector: activeSector, ...s,
        default_services: Array(s.services_count).fill(null),
      })) : []);

  const handleSelectType = (type: "owner" | "professional") => {
    setUserType(type);
    setStep(2);
  };

  const handleSelectSector = (key: string) => {
    if (userType === "professional") {
      setProfSector(key);
      setProfSpecialty(null);
    } else {
      setSelectedSector(key);
      setSelectedSpecialty(null);
    }
    setStep(3);
  };

  const handleSelectSpecialty = (specialty: string) => {
    if (userType === "professional") {
      setProfSpecialty(specialty);
    } else {
      setSelectedSpecialty(specialty);
    }
    setStep(userType === "professional" ? 3 : 4);
  };

  // Voltar inteligente por tipo de usuário
  const handleBack = () => {
    if (step === 2) { setStep(1); setUserType(null); return; }
    if (step === 3) { setStep(2); return; }
    if (step === 4) { setStep(3); return; }
  };

  // Finalizar cadastro de DONO
  const handleFinishOwner = async () => {
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
        owner_user_id: user.id, name: form.name, address: form.address,
        phone: form.phone || null, description: form.description || null,
        sector: selectedSector || null, specialty: selectedSpecialty || null,
        onboarding_status: "configured",
        ...(nicheLabels ? { niche_labels: nicheLabels } : {}),
      };

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

      if (selectedSector && selectedSpecialty && specialties?.length) {
        const preset = specialties.find((s: any) =>
          s.specialty === selectedSpecialty || s.display_name === selectedSpecialty
        );
        if (preset && preset.id && !preset.id.startsWith("fallback")) {
          await applyInitialPreset(user.id, barbershopId, selectedSector, selectedSpecialty, preset);
        }
      }

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

  // Finalizar cadastro de PROFISSIONAL AUTÔNOMO
  const handleFinishProfessional = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) newErrors.name = "Nome obrigatório (mín. 2 caracteres)";
    if (form.cpf_cnpj.replace(/\D/g, "").length < 11) newErrors.cpf_cnpj = "CPF/CNPJ inválido";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (!user) return;

    setSaving(true);
    try {
      // 1. Atualizar perfil
      await (supabase as any).from("profiles").update({
        name: form.name,
        whatsapp: form.phone || null,
        cpf_cnpj: form.cpf_cnpj || null,
      }).eq("user_id", user.id);

      // 2. Garantir role profissional
      await (supabase as any).from("user_roles")
        .upsert({ user_id: user.id, role: "profissional" }, { onConflict: "user_id,role" });

      // 3. Criar registro de profissional autônomo (sem barbershop vinculado)
      const { data: existingProf } = await (supabase as any)
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingProf) {
        await (supabase as any).from("professionals").insert({
          user_id: user.id,
          name: form.name,
          email: user.email || null,
          whatsapp: form.phone || null,
          is_active: true,
          commission_percentage: 100, // autônomo fica com 100%
        });
      }

      toast.success("Perfil criado! Bem-vindo ao sistema 🎉");
      // Forçar reload para atualizar roles no contexto
      window.location.href = "/painel-profissional";
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = userType === "professional" ? handleFinishProfessional : handleFinishOwner;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
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
          {currentSteps.map((label, i) => {
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
                {s < currentSteps.length && (
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
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">
              {userType === "professional" ? "Qual é a sua área de atuação?" : "Qual é o seu setor?"}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">Vamos personalizar tudo para o seu tipo de negócio</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SECTORS.map((sector) => {
                const active = userType === "professional" ? profSector === sector.key : selectedSector === sector.key;
                return (
                  <button
                    key={sector.key}
                    onClick={() => handleSelectSector(sector.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] text-center ${
                      active ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-3xl">{sector.icon}</span>
                    <span className="text-xs font-semibold text-slate-800 leading-tight">{sector.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-start pt-2">
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
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
              {userType === "professional"
                ? "Isso vai personalizar seu perfil e link de agendamento"
                : "Vamos pré-configurar seus serviços, automações e políticas automaticamente"}
            </p>

            {loadingSpecialties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : specialties.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialties.map((spec: any) => {
                  const active = userType === "professional"
                    ? profSpecialty === spec.specialty
                    : selectedSpecialty === spec.specialty;
                  return (
                    <button
                      key={spec.id || spec.specialty}
                      onClick={() => handleSelectSpecialty(spec.specialty)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] text-center ${
                        active ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300 hover:bg-slate-50"
                      }`}
                    >
                      {active && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {spec.icon && <span className="text-2xl">{spec.icon}</span>}
                      <span className="text-sm font-semibold text-slate-800">{spec.display_name || spec.specialty}</span>
                      {(spec.services_count || spec.default_services?.length) > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {spec.services_count || spec.default_services?.length} serviços inclusos
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">Nenhuma especialidade encontrada para este setor.</p>
                <p className="text-xs text-slate-400 mt-1">Você configurará seus serviços manualmente.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              {userType === "owner" ? (
                <button onClick={() => setStep(4)} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors">
                  {selectedSpecialty ? "Continuar" : "Pular"} <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setStep(4)} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors">
                  {profSpecialty ? "Continuar" : "Pular"} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Dados finais ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">
              {userType === "professional" ? "Seus dados profissionais" : "Dados do seu negócio"}
            </h2>

            {/* Badge do setor/especialidade selecionados */}
            {(userType === "owner" ? selectedSector : profSector) && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">
                  {SECTORS.find(s => s.key === (userType === "owner" ? selectedSector : profSector))?.icon}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {SECTORS.find(s => s.key === (userType === "owner" ? selectedSector : profSector))?.label}
                  {(userType === "owner" ? selectedSpecialty : profSpecialty) && (
                    ` · ${userType === "owner" ? selectedSpecialty : profSpecialty}`
                  )}
                </span>
              </div>
            )}

            <div className="space-y-3 max-w-md mx-auto">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  {userType === "professional" ? "Seu nome completo *" : "Nome do estabelecimento *"}
                </label>
                <Input
                  placeholder={userType === "professional" ? "Ex: João Silva" : "Ex: Studio Maria, Clínica Saúde+"}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={`mt-1 h-11 text-slate-900 border-slate-200 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {userType === "owner" && (
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
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">
                  {userType === "professional" ? "CPF *" : "CPF ou CNPJ *"}
                </label>
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

              {/* Preview do que será configurado */}
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-xs font-medium text-orange-600 mb-1">
                  {userType === "professional" ? "Você terá acesso a:" : "O que será configurado automaticamente:"}
                </p>
                <ul className="text-xs text-orange-500 space-y-0.5">
                  {userType === "professional" ? (
                    <>
                      <li>✓ Agenda pessoal com link de agendamento</li>
                      <li>✓ Controle de comissões e pagamentos</li>
                      <li>✓ Notificações automáticas via WhatsApp</li>
                    </>
                  ) : (
                    <>
                      {(selectedSpecialty) && <li>✓ Serviços pré-configurados para {selectedSpecialty}</li>}
                      <li>✓ Automações de lembrete e confirmação</li>
                      <li>✓ Políticas de agendamento</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors px-3">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Configurando...</>
                    : <>{userType === "professional" ? "Criar meu perfil" : "Finalizar Cadastro"} <ArrowRight className="w-4 h-4" /></>
                  }
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
