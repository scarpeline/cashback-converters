import { useState } from "react";
import { useBarbershop } from "./hooks";
import { Bot, Mic, Zap, MessageCircle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAudioConfigPanel } from "@/components/ai/AIAudioConfigPanel";
import { AutomationsPanel } from "@/components/automation/AutomationsPanel";

type AITab = "assistant" | "automations";

export const AIHub = () => {
  const { barbershop } = useBarbershop();
  const [activeTab, setActiveTab] = useState<AITab>("assistant");

  const tabs: { id: AITab; label: string; icon: React.ReactNode }[] = [
    { id: "assistant", label: "Assistente IA", icon: <Mic size={14} /> },
    { id: "automations", label: "Automações", icon: <Zap size={14} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <Badge className="bg-purple-500/10 text-purple-400 font-black uppercase text-[10px] tracking-[0.2em] px-4 py-1.5 mb-4 rounded-full border-purple-500/20">
            Powered by AI
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">IA & Automação</span>
          </h1>
          <p className="text-slate-400 font-medium">Assistente inteligente de áudio/texto e automações do sistema</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10 backdrop-blur-3xl gap-1 animate-in slide-in-from-right duration-700">
          {tabs.map((tab) => (
            <Button 
              key={tab.id}
              variant={activeTab === tab.id ? "gold" : "ghost"} 
              size="sm" 
              className={`rounded-2xl font-black h-11 px-6 flex items-center gap-2 transition-premium ${activeTab === tab.id ? 'shadow-gold diamond-glow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "assistant" && (
          <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl animate-in zoom-in duration-500">
            <AIAudioConfigPanel barbershopId={barbershop?.id || ""} />
          </div>
        )}
        {activeTab === "automations" && (
          <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl animate-in zoom-in duration-500">
            <AutomationsPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHub;
