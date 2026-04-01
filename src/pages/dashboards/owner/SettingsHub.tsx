import { useState } from "react";
import { useBarbershop } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { BarbershopProfileSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Settings, 
  Clock, 
  Shield, 
  MessageCircle, 
  Smartphone, 
  Globe, 
  User, 
  Bell,
  Lock,
  ChevronRight,
  HelpCircle,
  CreditCard,
  Building,
  Key,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import BookingPoliciesPanel from "@/components/settings/BookingPoliciesPanel";
import ResourcesPanel from "@/components/settings/ResourcesPanel";
import { WhatsAppAccountsPanel } from "@/components/whatsapp/WhatsAppAccountsPanel";

export const SettingsHub = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "hours" | "whatsapp" | "policies">("profile");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Configurações</span>
          </h1>
          <p className="text-slate-400 font-medium">Personalize a identidade e as regras digitais do seu negócio</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <Button 
            variant={activeTab === "profile" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("profile")}
          >
            Perfil
          </Button>
          <Button 
            variant={activeTab === "hours" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("hours")}
          >
            Horários
          </Button>
          <Button 
            variant={activeTab === "whatsapp" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("whatsapp")}
          >
            WhatsApp
          </Button>
          <Button 
            variant={activeTab === "policies" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("policies")}
          >
            Políticas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "profile" && <ProfileSettings />}
        {activeTab === "hours" && <OpeningHoursSettings />}
        {activeTab === "whatsapp" && <WhatsAppSettings />}
        {activeTab === "policies" && <PolicySettings />}
      </div>
    </div>
  );
};

const ProfileSettings = () => {
  const { barbershop, refetch } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const [name, setName] = useState(barbershop?.name || "");
  const [slug, setSlug] = useState(barbershop?.slug || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
     if (!barbershop?.id) return;

     // 🛡️ Segurança: Validação Zod
     const validation = BarbershopProfileSchema.safeParse({ name, slug });
     if (!validation.success) {
        toast.error(validation.error.issues[0].message);
        return;
     }

     setSaving(true);
     const { error } = await (supabase as any)
       .from("barbershops")
       .update({ name, slug })
       .eq("id", barbershop.id);
       
     if (error) toast.error(error.message);
     else {
        // 🛡️ Segurança: Auditoria
        await logAction('SETTINGS_CHANGE', 'barbershops', barbershop.id, { name, slug });
        toast.success("Perfil atualizado!");
        refetch();
     }
     setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
          <Card className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
             <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full group-hover:bg-orange-500/10 transition-colors" />
             
             <h3 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-3">
               <Building className="w-6 h-6 text-orange-400" /> Identidade do Negócio
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                   <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Nome Comercial</Label>
                   <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold focus:ring-orange-500/20 transition-premium" />
                </div>
                <div className="space-y-2">
                   <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">ID de Agendamento (Slug)</Label>
                   <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-400 font-black text-sm">@</div>
                      <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white pl-10 font-bold focus:ring-orange-500/20 transition-premium" />
                   </div>
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                   <Button variant="gold" className="rounded-2xl h-14 px-12 font-black shadow-gold diamond-glow transition-premium group/btn" onClick={handleSave} disabled={saving}>
                      {saving ? "Processando..." : <span className="flex items-center gap-2">Salvar Alterações <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></span>}
                   </Button>
                </div>
             </div>
          </Card>
          
          <Card className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 bg-slate-900/20 group">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-premium">
                      <Shield className="w-6 h-6 text-orange-400" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white">Segurança de Dados</h3>
                      <p className="text-xs text-slate-500 font-medium">Proteção forense para sua barbearia</p>
                   </div>
                </div>
                <Badge variant="outline" className="rounded-full border-blue-500/30 text-blue-400 bg-blue-500/5 px-2 py-0 text-[8px] font-black uppercase tracking-widest">Enterprise</Badge>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-slate-900/50 rounded-3xl border border-white/5 hover:border-white/10 transition-premium cursor-pointer group/item">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover/item:text-white transition-colors">
                         <Lock className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                         <p className="font-bold text-white text-sm">Autenticação 2FA</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Dupla Proteção Ativa</p>
                      </div>
                   </div>
                   <Switch />
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-900/50 rounded-3xl border border-white/5 hover:border-white/10 transition-premium cursor-pointer group/item">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover/item:text-white transition-colors">
                         <Key className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                         <p className="font-bold text-white text-sm">Registro de Auditoria</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Histórico Forense Completo</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:bg-white/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover/item:text-white" />
                   </div>
                </div>
             </div>
          </Card>
       </div>
       
       <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
          <Card className="glass-card p-10 rounded-[3rem] border-white/5 relative overflow-hidden group h-full flex flex-col items-center text-center">
             <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-50" />
             
             <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-32 h-32 rounded-[3.5rem] bg-gradient-gold p-1 shadow-gold-sm mb-8 group-hover:rotate-6 transition-transform duration-700">
                   <div className="w-full h-full rounded-[3.2rem] overflow-hidden bg-slate-900 flex items-center justify-center">
                      <Building className="w-12 h-12 text-orange-400 opacity-20 group-hover:opacity-100 transition-premium" />
                   </div>
                </div>
                
                <h4 className="text-2xl font-black text-white underline-gold px-2 truncate w-full">{barbershop?.name || 'Seu Negócio'}</h4>
                <p className="text-[11px] font-black text-orange-400 uppercase tracking-[0.3em] mt-3 mb-10 flex items-center gap-2">
                   <Star size={10} fill="currentColor" /> Admin Dashboard
                </p>
                
                <div className="w-full space-y-4 pt-10 border-t border-white/5">
                   <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4 group/social cursor-pointer hover:bg-white/10 transition-premium">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover/social:text-white transition-colors">
                         <Globe className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Link de Agendamento</p>
                         <p className="text-xs font-bold text-white truncate">salaocashback.com/@{barbershop?.slug}</p>
                      </div>
                   </div>
                   
                   <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4 group/social cursor-pointer hover:bg-white/10 transition-premium">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover/social:text-blue-400 transition-colors">
                         <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Suporte IA</p>
                         <p className="text-xs font-bold text-white truncate">Chat Prioritário Ativo</p>
                      </div>
                   </div>
                </div>
                
                <div className="mt-auto pt-10 w-full">
                   <Badge variant="outline" className="rounded-full border-orange-500/20 bg-orange-500/5 text-orange-400 px-6 py-2 text-[10px] font-black uppercase tracking-widest">
                     Licença Diamond Ativa
                   </Badge>
                </div>
             </div>
          </Card>
       </div>
    </div>
  );
};

const OpeningHoursSettings = () => {
    return (
        <Card className="glass-card p-12 rounded-[2.5rem] border-dashed border-white/10 text-center">
           <Clock className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <h3 className="text-2xl font-black text-white mb-2">Editor de Grade Horária</h3>
           <p className="text-slate-500 font-medium max-w-md mx-auto">Em breve: Controle total de feriados, horários de pico e jornadas diferenciadas por profissional.</p>
        </Card>
    );
};

const WhatsAppSettings = () => {
    const { barbershop } = useBarbershop();
    return (
        <div className="space-y-6">
           <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
              <WhatsAppAccountsPanel barbershopId={barbershop?.id || ""} />
           </div>
        </div>
    );
};

const PolicySettings = () => {
    return (
        <div className="space-y-8">
            <div className="glass-card p-8 rounded-[3rem] border-white/5">
               <BookingPoliciesPanel />
            </div>
            <div className="glass-card p-8 rounded-[3rem] border-white/5">
               <ResourcesPanel />
            </div>
        </div>
    );
};
