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
import { useTrialDays } from "@/hooks/useTrialDays";

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
  { key: "academia",              label: "Academia",                icon: "🏟️",  desc: "Academias de ginástica, musculação e fitness." },
  { key: "religiao",              label: "Religião & Igrejas",      icon: "⛪",  desc: "Igrejas, templos, centros espirituais e pastorais." },
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
  academia: [
    { specialty: "musculacao",        display_name: "Musculação",         icon: "💪", services_count: 3 },
    { specialty: "ginastica",         display_name: "Ginástica",          icon: "🤸", services_count: 2 },
    { specialty: "funcional",         display_name: "Treino Funcional",   icon: "🏋️", services_count: 2 },
    { specialty: "zumba",             display_name: "Zumba / Dança Fit",  icon: "💃", services_count: 2 },
    { specialty: "natacao_academia",  display_name: "Natação",            icon: "🏊", services_count: 2 },
    { specialty: "spinning_academia", display_name: "Spinning",           icon: "🚴", services_count: 2 },
  ],
  religiao: [
    { specialty: "igreja_evangelica", display_name: "Igreja Evangélica",  icon: "✝️", services_count: 2 },
    { specialty: "igreja_catolica",   display_name: "Igreja Católica",    icon: "⛪", services_count: 2 },
    { specialty: "centro_espirita",   display_name: "Centro Espírita",    icon: "🌟", services_count: 2 },
    { specialty: "templo_budista",    display_name: "Templo Budista",     icon: "🪷", services_count: 2 },
    { specialty: "pastoral",          display_name: "Pastoral / Ministério", icon: "🙏", services_count: 2 },
    { specialty: "outro_religioso",   display_name: "Outro",              icon: "🕊️", services_count: 2 },
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
  academia:              { professionals: "Instrutores",    services: "Modalidades",        appointments: "Treinos",      clients: "Alunos" },
  religiao:              { professionals: "Líderes",        services: "Atividades",         appointments: "Encontros",    clients: "Membros" },
};

// Passos: Setor → Especialidade → Negócio → Pagamentos
const STEPS_OWNER = ["Setor", "Especialidade", "Negócio", "Pagamentos"];

const OnboardingSelectionPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { selectedSector, setSelectedSector, selectedSpecialty, setSelectedSpecialty } = useOnboarding();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    address: "",
    cpf_cnpj: profile?.cpf_cnpj || "",
    phone: profile?.whatsapp || "",
    description: "",
  });

  const trialDays = useTrialDays();

  // Dados de pagamento (step 4)
  const [paymentForm, setPaymentForm] = useState<{
    account_type: "pf" | "pj" | "";
    pix_key: string;
    pix_key_type: "cpf" | "cnpj" | "email" | "phone" | "random";
    skip_payment: boolean;
  }>({
    account_type: "",
    pix_key: "",
    pix_key_type: "cpf",
    skip_payment: false,
  });
  const [profPixKeyType, setProfPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("cpf");

  // Fetch specialties from sector_presets — com fallback embutido
  const { data: dbSpecialties, isLoading: loadingSpecialties } = useQuery({
    queryKey: ["sector_specialties", selectedSector],
    queryFn: async () => {
      if (!selectedSector) return [];
      const { data, error } = await (supabase as any)
        .from("sector_presets")
        .select("id, sector, specialty, display_name, description, icon, default_services")
        .eq("sector", selectedSector)
        .order("display_name");
      if (!error && data && data.length > 0) return data;
      const altMap: Record<string, string> = {
        beleza_estetica: "beleza", saude_bem_estar: "saude",
        educacao_mentorias: "educacao", servicos_domiciliares: "servicos",
        juridico_financeiro: "juridico", espacos_locacao: "espacos",
      };
      const alt = altMap[selectedSector];
      if (alt) {
        const { data: d2 } = await (supabase as any)
          .from("sector_presets")
          .select("id, sector, specialty, display_name, description, icon, default_services")
          .eq("sector", alt).order("display_name");
        if (d2 && d2.length > 0) return d2;
      }
      return [];
    },
    enabled: !!selectedSector,
  });

  const specialties = (dbSpecialties && dbSpecialties.length > 0)
    ? dbSpecialties
    : (selectedSector ? (FALLBACK_SPECIALTIES[selectedSector] || []).map((s, i) => ({
        id: `fallback-${i}`, sector: selectedSector, ...s,
        default_services: Array(s.services_count).fill(null),
      })) : []);

  const handleSelectSector = (key: string) => {
    setSelectedSector(key);
    setSelectedSpecialty(null);
    setStep(2);
  };

  const handleSelectSpecialty = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) { setStep(1); setSelectedSector(null); return; }
    if (step === 3) { setStep(2); return; }
    if (step === 4) { setStep(3); return; }
  };

  const _createBarbershop = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) newErrors.name = "Nome obrigatório (mín. 2 caracteres)";
    if (!form.address || form.address.length < 5) newErrors.address = "Endereço obrigatório";
    if (form.cpf_cnpj.replace(/\D/g, "").length < 11) newErrors.cpf_cnpj = "CPF/CNPJ inválido";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return null; }
    if (!user) return null;

    const baseSlug = form.name
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `negocio-${user.id.slice(0, 8)}`;

    const nicheLabels = selectedSector ? NICHE_LABELS[selectedSector] : null;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
      owner_user_id: user.id, name: form.name, address: form.address,
      phone: form.phone || null, description: form.description || null,
      sector: selectedSector || null, specialty: selectedSpecialty || null,
      onboarding_status: "configured",
      subscription_status: "trial",
      subscription_ends_at: trialEndsAt,
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

    return barbershopId;
  };

  // Step 3 → step 4 (pagamentos)
  const handleAdvanceToPayment = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) newErrors.name = "Nome obrigatório (mín. 2 caracteres)";
    if (!form.address || form.address.length < 5) newErrors.address = "Endereço obrigatório";
    if (form.cpf_cnpj.replace(/\D/g, "").length < 11) newErrors.cpf_cnpj = "CPF/CNPJ inválido";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setStep(4);
  };

  const handleFinishWithPayment = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const barbershopId = await _createBarbershop();
      if (!barbershopId) { setSaving(false); return; }

      if (paymentForm.pix_key && paymentForm.account_type) {
        await (supabase as any).from("profiles").update({ pix_key: paymentForm.pix_key }).eq("user_id", user.id);
        try {
          await supabase.functions.invoke("process-payment", {
            body: {
              action: "create-barbershop-account",
              barbershop_id: barbershopId,
              name: form.name,
              email: user.email,
              cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
              mobile_phone: form.phone,
            }
          });
        } catch (e) {
          console.warn("Subconta Asaas não criada agora:", e);
        }
      }

      toast.success("Cadastro concluído! Bem-vindo ao sistema 🎉");
      navigate("/painel-dono");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const handleSkipPayment = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const barbershopId = await _createBarbershop();
      if (!barbershopId) { setSaving(false); return; }
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
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-500 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Agenda Universal
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Em qual segmento você atua?
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Vamos configurar tudo automaticamente para o seu tipo de negócio
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS_OWNER.map((label, i) => {
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
                {s < STEPS_OWNER.length && (
                  <div className={`w-12 h-0.5 mb-4 mx-1 ${done ? "bg-orange-500" : "bg-slate-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: Setor ── */}
        {step === 1 && (
          <div className="space-y-4">
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
          </div>
        )}

        {/* ── STEP 2: Especialidade ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Qual é sua especialidade?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Vamos pré-configurar seus serviços, automações e políticas automaticamente
            </p>

            {loadingSpecialties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : specialties.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialties.map((spec: any) => (
                  <button
                    key={spec.id || spec.specialty}
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
                    {spec.icon && <span className="text-2xl">{spec.icon}</span>}
                    <span className="text-sm font-semibold text-slate-800">{spec.display_name || spec.specialty}</span>
                    {(spec.services_count || spec.default_services?.length) > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {spec.services_count || spec.default_services?.length} serviços inclusos
                      </span>
                    )}
                  </button>
                ))}
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
              <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 transition-colors">
                {selectedSpecialty ? "Continuar" : "Pular"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Dados do negócio ── */}
        {step === 3 && (
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

              {selectedSpecialty && (
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-xs font-medium text-orange-600 mb-1">O que será configurado automaticamente:</p>
                  <ul className="text-xs text-orange-500 space-y-0.5">
                    <li>✓ Serviços pré-configurados para {selectedSpecialty}</li>
                    <li>✓ Automações de lembrete e confirmação</li>
                    <li>✓ Políticas de agendamento</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors px-3">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleAdvanceToPayment}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Pagamentos ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Dados de Pagamento</h2>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm font-medium text-orange-700 mb-1">💳 Para receber pagamentos diretamente na sua conta</p>
              <p className="text-xs text-orange-600">
                Configure sua chave PIX e crie sua subconta Asaas gratuitamente. Você receberá os pagamentos dos seus clientes automaticamente.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-medium text-emerald-700">
                🎁 Você tem <strong>{trialDays} dias grátis</strong> para testar tudo sem pagar nada.
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Sem cartão de crédito. Cancele quando quiser.</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["pf", "pj"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPaymentForm(p => ({ ...p, account_type: type }))}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        paymentForm.account_type === type
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-slate-200 text-slate-600 hover:border-orange-300"
                      }`}
                    >
                      {type === "pf" ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tipo de chave PIX</label>
                <select
                  value={paymentForm.pix_key_type}
                  onChange={e => setPaymentForm(p => ({ ...p, pix_key_type: e.target.value as typeof p.pix_key_type }))}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave aleatória</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Chave PIX recebedor</label>
                <Input
                  placeholder="Informe sua chave PIX"
                  value={paymentForm.pix_key}
                  onChange={e => setPaymentForm(p => ({ ...p, pix_key: e.target.value }))}
                  className="h-11 text-slate-900 border-slate-200"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">
                  ℹ️ Ao finalizar, criaremos sua subconta Asaas automaticamente usando os dados informados. Isso permite receber pagamentos diretamente na sua conta.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors px-3">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleFinishWithPayment}
                  disabled={saving}
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Configurando...</> : <>Finalizar e Ativar Pagamentos <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSkipPayment}
                  disabled={saving}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline"
                >
                  Configurar depois
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
