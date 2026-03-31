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
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
       <div className="md:col-span-8 space-y-6">
          <Card className="glass-card p-8 rounded-[2.5rem] border-white/5">
             <h3 className="text-2xl font-black text-white mb-8 border-b border-white/5 pb-4">Dados da Barbearia</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest ml-1">Nome Comercial</Label>
                   <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12 text-white" />
                </div>
                <div className="space-y-2">
                   <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest ml-1">Slug (Link de Agendamento)</Label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">@</div>
                      <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12 text-white pl-8" />
                   </div>
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                   <Button variant="gold" className="rounded-2xl h-12 px-10 font-black shadow-gold diamond-glow transition-premium" onClick={handleSave} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar Alterações"}
                   </Button>
                </div>
             </div>
          </Card>
          
          <Card className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-900/20">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                   <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-black text-white">Segurança e Log</h3>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                   <div>
                      <p className="font-bold text-white text-sm">Autenticação em Dois Fatores (2FA)</p>
                      <p className="text-xs text-slate-500 font-medium">Aumente a segurança do acesso ao painel.</p>
                   </div>
                   <Switch />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                   <div>
                      <p className="font-bold text-white text-sm">Registro de Atividades</p>
                      <p className="text-xs text-slate-500 font-medium">Ver quem acessou o painel e quando.</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-700" />
                </div>
             </div>
          </Card>
       </div>
       
       <div className="md:col-span-4 space-y-6">
          <Card className="glass-card p-8 rounded-[2.5rem] border-white/5 h-full">
             <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-orange p-1 shadow-gold-sm mb-6">
                   <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-slate-900 flex items-center justify-center">
                      <Building className="w-8 h-8 text-slate-700" />
                   </div>
                </div>
                <h4 className="text-lg font-black text-white">{barbershop?.name || 'Salão'}</h4>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1 italic">Dono & Fundador</p>
                
                <div className="mt-8 pt-8 border-t border-white/5 w-full space-y-4">
                   <div className="flex items-center gap-3 text-slate-400">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-bold truncate">salaocashback.com/@{barbershop?.slug}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-400">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Suporte Prioritário Ativo</span>
                   </div>
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
