import React, { useState } from "react";
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
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  History,
  Target,
  Sparkles,
  MessageSquare,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppAccountsPanel } from "@/components/whatsapp/WhatsAppAccountsPanel";
import { WhatsAppMonitoringPanel } from "@/components/whatsapp/WhatsAppMonitoringPanel";
import { WhatsAppConectarPanel } from "@/components/whatsapp/WhatsAppConectarPanel";
import { MessagePackagesPanel } from "@/components/whatsapp/MessagePackagesPanel";
import { MessageReportsPanel } from "@/components/whatsapp/MessageReportsPanel";
import { WeeklySchedulePanel } from "@/components/messaging/WeeklySchedulePanel";
import { ClientReactivationDashboard } from "@/components/automation/ReactivationDashboard";
import { SMSConfigPanel } from "@/components/sms/SMSConfigPanel";
import { MetaSocialPanel } from "@/components/social/MetaSocialPanel";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────
type MainTab = "whatsapp" | "sms" | "social" | "mensagens" | "campanhas" | "crm";
type WhatsAppSubTab = "contas" | "monitoramento" | "pacotes";
type MensagensSubTab = "agenda" | "relatorios";
type CampanhasSubTab = "reativacao";
type CRMSubTab = "fluxos" | "aniversarios" | "nps";

// ─── Sub-tab configs ──────────────────────────────────────────────────────────
const whatsappTabs: { id: WhatsAppSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "contas", label: "Conectar", icon: <Phone size={14} /> },
  { id: "monitoramento", label: "Status Real", icon: <Activity size={14} /> },
  { id: "pacotes", label: "Pacotes", icon: <Package size={14} /> },
];

const mensagensTabs: { id: MensagensSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "agenda", label: "Agenda Automática", icon: <Calendar size={14} /> },
  { id: "relatorios", label: "Performance", icon: <BarChart3 size={14} /> },
];

const crmTabs: { id: CRMSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "fluxos", label: "Retenção 30d", icon: <Target size={14} /> },
  { id: "aniversarios", label: "Birthday", icon: <Sparkles size={14} /> },
  { id: "nps", label: "NPS Pulse", icon: <Zap size={14} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const CommunicationHub = () => {
  const { barbershop } = useBarbershop();
  const [mainTab, setMainTab] = useState<MainTab>("whatsapp");
  const [waTab, setWaTab] = useState<WhatsAppSubTab>("contas");
  const [msgTab, setMsgTab] = useState<MensagensSubTab>("agenda");
  const [crmSubTab, setCrmSubTab] = useState<CRMSubTab>("fluxos");

  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: <Smartphone size={16} /> },
    { id: "sms", label: "SMS", icon: <MessageSquare size={16} /> },
    { id: "social", label: "Instagram", icon: <Instagram size={16} />, badge: "SOON" },
    { id: "mensagens", label: "Mensagens", icon: <MessageCircle size={16} /> },
    { id: "campanhas", label: "Reativação", icon: <UserCheck size={16} /> },
    { id: "crm", label: "Diamond CRM", icon: <Zap size={16} />, badge: "NEW" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Diamond */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <Badge className="bg-orange-500/10 text-orange-400 font-black uppercase text-[10px] tracking-[0.2em] px-4 py-1.5 mb-4 rounded-full border-orange-500/20">Communication Engine v4.0</Badge>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2 uppercase italic leading-none">
            Hub de <span className="text-gradient-gold">Comunicação</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight italic opacity-70 border-l-2 border-orange-500 pl-4 mt-2">Marketing de Ultra-Impacto & Automação Forense Diamond</p>
        </div>

        {/* Main tabs Glassmorphism */}
        <div className="flex bg-slate-900/50 p-2 rounded-[2rem] border border-white/5 backdrop-blur-3xl gap-1.5 shadow-2xl animate-in slide-in-from-right duration-700">
          {mainTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={mainTab === tab.id ? "gold" : "ghost"}
              size="sm"
              className={`rounded-2xl font-black h-12 px-6 flex items-center gap-2 transition-all duration-500 group ${mainTab === tab.id ? 'shadow-gold-sm' : 'hover:bg-white/5 text-slate-500'}`}
              onClick={() => setMainTab(tab.id)}
            >
              <div className={`transition-transform duration-500 ${mainTab === tab.id ? 'rotate-[-10deg] scale-110' : 'group-hover:rotate-12'}`}>{tab.icon}</div>
              <span className="uppercase text-[10px] tracking-widest">{tab.label}</span>
              {tab.badge && (
                <Badge className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full border-none ml-1 animate-pulse font-black">
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Content Section Diamond ── */}
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {mainTab === "whatsapp" && (
          <div className="space-y-8">
            <SubTabBar tabs={whatsappTabs} active={waTab} onChange={(v) => setWaTab(v as WhatsAppSubTab)} />
            <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[500px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {waTab === "contas" && <WhatsAppConectarPanel />}
                  {waTab === "monitoramento" && <WhatsAppMonitoringPanel barbershopId={barbershop?.id || ""} />}
                  {waTab === "pacotes" && <MessagePackagesPanel barbershopId={barbershop?.id || ""} />}
               </div>
            </div>
          </div>
        )}

        {mainTab === "sms" && (
          <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[500px]">
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <SMSConfigPanel />
            </div>
          </div>
        )}

        {mainTab === "social" && (
          <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[500px]">
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <MetaSocialPanel />
            </div>
          </div>
        )}

        {mainTab === "mensagens" && (
          <div className="space-y-8">
            <SubTabBar tabs={mensagensTabs} active={msgTab} onChange={(v) => setMsgTab(v as MensagensSubTab)} />
            <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[500px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {msgTab === "agenda" && <WeeklySchedulePanel barbershopId={barbershop?.id || ""} />}
                  {msgTab === "relatorios" && <MessageReportsPanel barbershopId={barbershop?.id || ""} />}
               </div>
            </div>
          </div>
        )}

        {mainTab === "campanhas" && (
          <div className="space-y-8">
            <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[500px]">
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  <ClientReactivationDashboard />
               </div>
            </div>
          </div>
        )}

        {mainTab === "crm" && (
          <div className="space-y-8">
            <SubTabBar tabs={crmTabs} active={crmSubTab} onChange={(v) => setCrmSubTab(v as CRMSubTab)} />
            <div className="glass-card p-6 md:p-10 rounded-[3.5rem] border-white/5 bg-slate-950/20 backdrop-blur-4xl shadow-premium min-h-[600px] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
               <div className="animate-in fade-in zoom-in-95 duration-500">
                  {crmSubTab === "fluxos" && <DiamondCRMPanel action="churn" />}
                  {crmSubTab === "aniversarios" && <DiamondCRMPanel action="birthday" />}
                  {crmSubTab === "nps" && <DiamondCRMPanel action="nps" />}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Reusable components Diamond ─────────────────────────────────────────────
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
    <div className="flex items-center gap-3 flex-wrap mb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 border shadow-sm group ${
            active === tab.id
              ? "bg-gradient-gold text-black border-transparent shadow-gold-sm translate-y-[-2px]"
              : "text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/10 hover:bg-slate-900/50 backdrop-blur-md"
          }`}
        >
          <span className={`${active === tab.id ? 'animate-bounce' : 'group-hover:translate-x-1 transition-transform'}`}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DiamondCRMPanel({ action }: { action: string }) {
  const configs = {
    churn: {
      title: "Recuperação Forense de Clientes",
      icon: <Target className="w-10 h-10 text-orange-400" />,
      desc: "Automação ativada quando o cliente ultrapassa 30 dias de inatividade.",
      metrics: ["72 Clientes em Risco", "R$ 4.200 Recuperáveis"]
    },
    birthday: {
      title: "Diamond Birthday Experience",
      icon: <Sparkles className="w-10 h-10 text-yellow-400" />,
      desc: "Envio automático de cupom presente e mensagem personalizada no dia do aniversário.",
      metrics: ["12 Aniversariantes hoje", "Taxa de retorno: 35%"]
    },
    nps: {
      title: "Pulso de Satisfação Diamond",
      icon: <Zap className="w-10 h-10 text-emerald-400" />,
      desc: "Pesquisa de satisfação enviada 2 horas após o serviço para medir o NPS da equipe.",
      metrics: ["NPS Atual: 9.8", "+124 Avaliações este mês"]
    }
  };

  const curr = (configs as any)[action] || configs.churn;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-12">
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900/80 border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-gold opacity-5 rotate-45 group-hover:rotate-0 transition-transform duration-700" />
               {curr.icon}
            </div>
            <div>
               <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{curr.title}</h3>
               <p className="text-slate-500 font-medium text-lg mt-3 max-w-xl opacity-80">{curr.desc}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Button variant="gold" className="rounded-[1.5rem] h-14 px-10 font-black uppercase text-xs tracking-widest shadow-gold-xl active:scale-95 transition-all">
               Configurar Automação
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5">
                    <History size={20} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-white/10">Histórico de Disparos</TooltipContent>
              </Tooltip>
            </TooltipProvider>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {curr.metrics.map((m: any, i: number) => (
            <div key={i} className="p-10 bg-white/5 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Insight de Performance</p>
               <p className="text-3xl font-black text-white tracking-tighter italic group-hover:translate-x-2 transition-transform duration-500">{m}</p>
               <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-gold opacity-5 blur-2xl group-hover:opacity-20 transition-opacity" />
            </div>
         ))}
      </div>

      <div className="p-10 bg-gradient-gold rounded-[2.5rem] border border-white/10 shadow-gold relative group overflow-hidden">
         <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
         <div className="flex items-center gap-6 text-black">
            <ShieldCheck className="w-10 h-10" />
            <div>
               <p className="font-black text-xl uppercase tracking-tighter italic">Workflow Integrado Asaas/WhatsApp</p>
               <p className="text-black/70 font-bold text-sm tracking-tight mt-1">
                  Essa automação utiliza inteligência de dados para sincronizar com seu gateway de pagamento e pacotes de mensagens.
               </p>
            </div>
         </div>
         <Button className="absolute bottom-10 right-10 bg-black text-white hover:bg-slate-900 rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest transition-all">
           Ver Guia Expert
         </Button>
      </div>
    </div>
  );
}

export default CommunicationHub;
