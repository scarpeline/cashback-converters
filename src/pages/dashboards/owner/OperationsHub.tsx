import { useState, useCallback } from "react";
import { useBarbershop, useServices, useProfessionals, useAppointments } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { AppointmentSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Check, 
  X, 
  Search,
  Filter,
  MoreVertical,
  CalendarCheck,
  MessageCircle,
  Scissors,
  Users,
  ChevronRight,
  User,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfessionalWaitlistPanel } from "@/components/waitlist/ProfessionalWaitlistPanel";
import { RecurringAppointmentPanel } from "@/components/recurring/RecurringAppointmentPanel";
import { Badge } from "@/components/ui/badge";
import { SkeletonHub } from "@/components/ui/SkeletonHub";

// ─── Main Hub Component ───────────────────────────────────────────────────────
export const OperationsHub = () => {
  const [activeTab, setActiveTab] = useState<"agenda" | "recurring" | "waitlist">("agenda");
  const { barbershop } = useBarbershop();

  const tabs: { id: "agenda" | "recurring" | "waitlist"; label: string; icon: React.ReactNode }[] = [
    { id: "agenda", label: "Agenda Diária", icon: <Calendar size={14} /> },
    { id: "recurring", label: "Recorrências", icon: <Clock size={14} /> },
    { id: "waitlist", label: "Fila de Espera", icon: <Users size={14} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-700">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Operações</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle total do fluxo de cadeiras e agendamentos</p>
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
        {activeTab === "agenda" && <AgendamentosPage />}
        {activeTab === "recurring" && (
          <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl animate-in zoom-in duration-500">
            <RecurringAppointmentPanel barbershopId={barbershop?.id || ""} />
          </div>
        )}
        {activeTab === "waitlist" && (
          <div className="glass-card p-4 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl animate-in zoom-in duration-500">
            <ProfessionalWaitlistPanel barbershopId={barbershop?.id || ""} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Agendamentos Render Layer ───────────────────────────────────────────────
const AgendamentosPage = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const { services } = useServices(barbershop?.id);
  const { professionals } = useProfessionals(barbershop?.id);
  const { appointments, refetch, loading: loadingAppointments } = useAppointments(barbershop?.id);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [form, setForm] = useState({
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    professional_id: "",
    scheduled_at: "",
    notes: "",
  });

  const handleCreate = async () => {
    if (!barbershop) return;

    const validation = AppointmentSchema.safeParse({
       client_name: form.client_name,
       client_phone: form.client_whatsapp,
       service_id: form.service_id,
       professional_id: form.professional_id,
       scheduled_at: new Date(form.scheduled_at),
       status: "scheduled"
    });

    if (!validation.success) {
       toast.error(validation.error.issues[0].message);
       return;
    }

    setSaving(true);
    const { error } = await (supabase as any).from("appointments").insert({
      barbershop_id: barbershop.id,
      client_name: form.client_name,
      client_whatsapp: form.client_whatsapp || null,
      service_id: form.service_id,
      professional_id: form.professional_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || null,
      status: "scheduled",
    });

    if (error) {
      toast.error("Erro ao criar agendamento");
      setSaving(false);
      return;
    }

    await logAction('SETTINGS_CHANGE', 'appointments', undefined, { client: form.client_name, service: form.service_id });
    toast.success("Agendamento Diamante criado!");
    setSaving(false);
    setForm({ client_name: "", client_whatsapp: "", service_id: "", professional_id: "", scheduled_at: "", notes: "" });
    refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    await logAction('SETTINGS_CHANGE', 'appointments', id, { status });
    toast.success(`Agendamento ${status === 'completed' ? 'finalizado' : 'cancelado'}`);
    refetch();
  };

  const statusMap: Record<string, { label: string; color: string; glow: string }> = {
    scheduled: { label: "Agendado", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", glow: "shadow-blue-500/10" },
    confirmed: { label: "Confirmado", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", glow: "shadow-orange-500/20" },
    completed: { label: "Concluído", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", glow: "shadow-emerald-500/10" },
    canceled: { label: "Cancelado", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", glow: "shadow-rose-500/10" },
  };

  const filteredAppointments = appointments.filter(ap => 
    ap.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ap.professionals?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Lado Esquerdo: Lista Premium */}
      <div className="xl:col-span-8 space-y-6">
        <div className="flex items-center gap-4 animate-in slide-in-from-left duration-700">
          <div className="relative flex-1 group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
             <Input 
               placeholder="Pesquisar por nome ou profissional..." 
               className="pl-12 bg-slate-950/20 border-white/5 rounded-2xl h-14 font-medium focus:ring-orange-500/20 transition-premium backdrop-blur-3xl"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 border border-white/10 h-14 w-14 shrink-0 transition-premium hover:bg-white/10">
             <Filter className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        <div className="space-y-4">
          {loadingAppointments ? (
            <div className="space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2.5rem] animate-pulse" />)}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="glass-card p-16 text-center rounded-[3rem] border-white/5 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                 <Calendar className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold tracking-tight">O fluxo está calmo por aqui. Nenhum registro hoje.</p>
            </div>
          ) : (
            filteredAppointments.map((ap, idx) => (
              <div 
                key={ap.id} 
                className={`glass-card p-6 md:p-8 rounded-[2.5rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl transition-premium group hover:border-white/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Badge className={`${statusMap[ap.status]?.color} ${statusMap[ap.status]?.glow} rounded-full font-black uppercase tracking-widest text-[9px] px-3 py-1 border`}>
                      {statusMap[ap.status]?.label}
                   </Badge>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-gold p-0.5 shadow-gold-sm transition-transform group-hover:scale-105 duration-500">
                       <div className="w-full h-full rounded-[1.7rem] bg-slate-900 flex items-center justify-center">
                          <User className="w-7 h-7 text-orange-400/50 group-hover:text-orange-400 transition-colors" />
                       </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white group-hover:text-gradient-gold transition-all">{ap.client_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {new Date(ap.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <span className="text-slate-500 text-xs font-bold">• {new Date(ap.scheduled_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button variant="ghost" size="icon" className="rounded-2xl bg-emerald-500/5 text-emerald-500/40 hover:bg-emerald-500 hover:text-white h-12 w-12 border border-emerald-500/10 transition-all duration-500" onClick={() => updateStatus(ap.id, "completed")}>
                        <Check className="w-5 h-5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-2xl bg-rose-500/5 text-rose-500/40 hover:bg-rose-500 hover:text-white h-12 w-12 border border-rose-500/10 transition-all duration-500" onClick={() => updateStatus(ap.id, "canceled")}>
                        <X className="w-5 h-5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 text-slate-500 hover:text-white h-12 w-12 border border-white/5 transition-premium">
                        <MoreVertical className="w-5 h-5" />
                     </Button>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5 group/info">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/5 border border-white/5 flex items-center justify-center text-orange-400 group-hover/info:bg-orange-500 transition-colors">
                         <Scissors size={14} className="group-hover/info:text-white" />
                      </div>
                      <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{ap.services?.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 group/info">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/5 border border-white/5 flex items-center justify-center text-blue-400 group-hover/info:bg-blue-500 transition-colors">
                         <Users size={14} className="group-hover/info:text-white" />
                      </div>
                      <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{ap.professionals?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Valor Diamond</p>
                        <p className="text-lg font-black text-gradient-gold">R$ {Number(ap.services?.price || 0).toFixed(2)}</p>
                     </div>
                     <ChevronRight size={16} className="text-slate-800" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lado Direito: Dashboard de Registro */}
      <div className="xl:col-span-4">
        <div className="glass-card p-8 md:p-10 rounded-[3rem] border-white/5 bg-slate-950/20 backdrop-blur-3xl sticky top-24 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full" />
          
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-[1.6rem] bg-gradient-gold p-0.5 shadow-gold-sm">
               <div className="w-full h-full rounded-[1.5rem] bg-slate-900 flex items-center justify-center">
                  <CalendarCheck className="w-7 h-7 text-white" />
               </div>
            </div>
            <div>
               <h2 className="text-2xl font-black text-white leading-tight">Novo Registro</h2>
               <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest italic">Diamond Booking Engine</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Cliente</Label>
              <div className="relative group/input">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-orange-400 transition-colors" />
                 <Input 
                   placeholder="Nome Completo" 
                   className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold pl-12 focus:ring-orange-500/20 transition-premium"
                   value={form.client_name}
                   onChange={(e) => setForm({...form, client_name: e.target.value})}
                 />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Whatsapp</Label>
              <div className="relative group/input">
                 <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/input:text-orange-400 transition-colors" />
                 <Input 
                   placeholder="(00) 00000-0000" 
                   className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold pl-12 focus:ring-orange-500/20 transition-premium"
                   value={form.client_whatsapp}
                   onChange={(e) => setForm({...form, client_whatsapp: e.target.value})}
                 />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Serviço</Label>
                 <select 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 ring-orange-500/20 transition-premium"
                   value={form.service_id}
                   onChange={(e) => setForm({...form, service_id: e.target.value})}
                 >
                   <option value="" className="bg-slate-900">Selecione</option>
                   {services.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Profissional</Label>
                 <select 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 ring-orange-500/20 transition-premium"
                   value={form.professional_id}
                   onChange={(e) => setForm({...form, professional_id: e.target.value})}
                 >
                   <option value="" className="bg-slate-900">Expert</option>
                   {professionals.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                 </select>
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Horário de Impacto</Label>
              <Input 
                type="datetime-local" 
                className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold [color-scheme:dark] focus:ring-orange-500/20 transition-premium"
                value={form.scheduled_at}
                onChange={(e) => setForm({...form, scheduled_at: e.target.value})}
              />
            </div>

            <Button 
              variant="gold" 
              className="w-full h-16 rounded-[1.8rem] font-black text-lg shadow-gold mt-6 hover-scale diamond-glow group/btn overflow-hidden relative"
              onClick={handleCreate}
              disabled={saving}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                 {saving ? "Processando..." : "Confirmar Agendamento"} <ChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
