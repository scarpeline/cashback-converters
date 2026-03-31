import { useState } from "react";
import React from "react";
import { useBarbershop } from "./hooks";
import {
  MessageCircle,
  Smartphone,
  Calendar,
  Megaphone,
  Package,
  Activity,
  Phone,
  BarChart3,
  UserCheck,
  Zap,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppAccountsPanel } from "@/components/whatsapp/WhatsAppAccountsPanel";
import { WhatsAppMonitoringPanel } from "@/components/whatsapp/WhatsAppMonitoringPanel";
import { MessagePackagesPanel } from "@/components/whatsapp/MessagePackagesPanel";
import { MessageReportsPanel } from "@/components/whatsapp/MessageReportsPanel";
import { WeeklySchedulePanel } from "@/components/messaging/WeeklySchedulePanel";
import { ClientReactivationDashboard } from "@/components/automation/ReactivationDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
type MainTab = "whatsapp" | "mensagens" | "campanhas";
type WhatsAppSubTab = "contas" | "monitoramento" | "pacotes";
type MensagensSubTab = "agenda" | "relatorios";
type CampanhasSubTab = "reativacao" | "automacoes";

// ─── Sub-tab configs ──────────────────────────────────────────────────────────
const whatsappTabs: { id: WhatsAppSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "contas", label: "Contas", icon: <Phone size={14} /> },
  { id: "monitoramento", label: "Monitoramento", icon: <Activity size={14} /> },
  { id: "pacotes", label: "Pacotes", icon: <Package size={14} /> },
];

const mensagensTabs: { id: MensagensSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "agenda", label: "Agenda Semanal", icon: <Calendar size={14} /> },
  { id: "relatorios", label: "Relatórios", icon: <BarChart3 size={14} /> },
];

const campanhasTabs: { id: CampanhasSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "reativacao", label: "Reativação", icon: <UserCheck size={14} /> },
  { id: "automacoes", label: "Automações", icon: <Zap size={14} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const CommunicationHub = () => {
  const { barbershop } = useBarbershop();
  const [mainTab, setMainTab] = useState<MainTab>("whatsapp");
  const [waTab, setWaTab] = useState<WhatsAppSubTab>("contas");
  const [msgTab, setMsgTab] = useState<MensagensSubTab>("agenda");
  const [campTab, setCampTab] = useState<CampanhasSubTab>("reativacao");

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: <Smartphone size={16} /> },
    { id: "mensagens", label: "Mensagens", icon: <MessageCircle size={16} /> },
    { id: "campanhas", label: "Campanhas", icon: <Megaphone size={16} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Comunicação</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-tight">WhatsApp, mensagens automáticas e campanhas de impacto</p>
        </div>

        {/* Main tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10 backdrop-blur-3xl gap-1 animate-in slide-in-from-right duration-700">
          {mainTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={mainTab === tab.id ? "gold" : "ghost"}
              size="sm"
              className={`rounded-2xl font-black h-11 px-6 flex items-center gap-2 transition-premium ${mainTab === tab.id ? 'shadow-gold diamond-glow' : 'hover:bg-white/5 text-slate-400'}`}
              onClick={() => setMainTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0 rounded-full border-none ml-1">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Content Section ── */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {mainTab === "whatsapp" && (
          <div className="space-y-8">
            <SubTabBar tabs={whatsappTabs} active={waTab} onChange={(v) => setWaTab(v as WhatsAppSubTab)} />
            <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {waTab === "contas" && <WhatsAppAccountsPanel barbershopId={barbershop?.id || ""} />}
                  {waTab === "monitoramento" && <WhatsAppMonitoringPanel barbershopId={barbershop?.id || ""} />}
                  {waTab === "pacotes" && <MessagePackagesPanel barbershopId={barbershop?.id || ""} />}
               </div>
            </div>
          </div>
        )}

        {mainTab === "mensagens" && (
          <div className="space-y-8">
            <SubTabBar tabs={mensagensTabs} active={msgTab} onChange={(v) => setMsgTab(v as MensagensSubTab)} />
            <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {msgTab === "agenda" && <WeeklySchedulePanel barbershopId={barbershop?.id || ""} />}
                  {msgTab === "relatorios" && <MessageReportsPanel barbershopId={barbershop?.id || ""} />}
               </div>
            </div>
          </div>
        )}

        {mainTab === "campanhas" && (
          <div className="space-y-8">
            <SubTabBar tabs={campanhasTabs} active={campTab} onChange={(v) => setCampTab(v as CampanhasSubTab)} />
            <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl min-h-[400px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {campTab === "reativacao" && <ClientReactivationDashboard />}
                  {campTab === "automacoes" && <AutomacoesPlaceholder />}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Reusable components ──────────────────────────────────────────────────────
function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 border ${
            active === tab.id
              ? "bg-gradient-gold text-white border-transparent shadow-gold diamond-glow scale-[1.02]"
              : "text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10 hover:bg-white/5"
          }`}
        >
          <span className={`${active === tab.id ? 'animate-pulse' : ''}`}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AutomacoesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-50" />
      <div className="relative z-10">
        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 border border-white/10 flex items-center justify-center mb-6 mx-auto shadow-2xl relative group">
           <div className="absolute inset-0 bg-gradient-gold opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
           <Zap className="w-10 h-10 text-orange-400 animate-pulse relative z-10" />
        </div>
        <h3 className="text-3xl font-black text-white mb-2">Automações <span className="text-gradient-gold">Enterprise</span></h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed mb-8 px-4">
          Estamos forjando o motor de fluxo mais poderoso do mercado. Gatilhos por comportamento, IA generativa de textos e recuperação forense de agendamentos.
        </p>
        <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
           <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 rounded-2xl px-6 py-2 text-[10px] font-black uppercase tracking-widest justify-center">
             Em Desenvolvimento Profundo
           </Badge>
           <Button variant="ghost" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-premium">
             Sugerir Funcionalidade
           </Button>
        </div>
      </div>
    </div>
  );
}
