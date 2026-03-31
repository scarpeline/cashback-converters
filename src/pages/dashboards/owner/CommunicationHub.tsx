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

      {/* ── WhatsApp Section ── */}
      {mainTab === "whatsapp" && (
        <div className="space-y-6">
          <SubTabBar
            tabs={whatsappTabs}
            active={waTab}
            onChange={(v) => setWaTab(v as WhatsAppSubTab)}
          />
          <div className="glass-card p-6 rounded-[2.5rem] border-white/5">
            {waTab === "contas" && <WhatsAppAccountsPanel barbershopId={barbershop?.id || ""} />}
            {waTab === "monitoramento" && <WhatsAppMonitoringPanel barbershopId={barbershop?.id || ""} />}
            {waTab === "pacotes" && <MessagePackagesPanel barbershopId={barbershop?.id || ""} />}
          </div>
        </div>
      )}

      {/* ── Mensagens Section ── */}
      {mainTab === "mensagens" && (
        <div className="space-y-6">
          <SubTabBar
            tabs={mensagensTabs}
            active={msgTab}
            onChange={(v) => setMsgTab(v as MensagensSubTab)}
          />
          <div className="glass-card p-6 rounded-[2.5rem] border-white/5">
            {msgTab === "agenda" && <WeeklySchedulePanel barbershopId={barbershop?.id || ""} />}
            {msgTab === "relatorios" && <MessageReportsPanel barbershopId={barbershop?.id || ""} />}
          </div>
        </div>
      )}

      {/* ── Campanhas Section ── */}
      {mainTab === "campanhas" && (
        <div className="space-y-6">
          <SubTabBar
            tabs={campanhasTabs}
            active={campTab}
            onChange={(v) => setCampTab(v as CampanhasSubTab)}
          />
          <div className="glass-card p-6 rounded-[2.5rem] border-white/5">
            {campTab === "reativacao" && <ClientReactivationDashboard />}
            {campTab === "automacoes" && <AutomacoesPlaceholder />}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Reusable sub-tab bar ─────────────────────────────────────────────────────
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
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.1em] transition-premium border ${
            active === tab.id
              ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-glow"
              : "text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10 hover:bg-white/5"
          }`}
        >
          <span className="group-hover:scale-110 transition-premium">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Automações placeholder ───────────────────────────────────────────────────
function AutomacoesPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center">
        <Zap className="w-8 h-8 text-orange-400" />
      </div>
      <h3 className="text-xl font-black text-white">Automações em breve</h3>
      <p className="text-slate-500 text-sm max-w-sm">
        Configure fluxos automáticos de mensagens por gatilho: aniversário, pós-atendimento, inatividade e mais.
      </p>
      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest">
        Em desenvolvimento
      </Badge>
    </div>
  );
}
