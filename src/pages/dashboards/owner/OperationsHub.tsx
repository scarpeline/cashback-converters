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
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfessionalWaitlistPanel } from "@/components/waitlist/ProfessionalWaitlistPanel";
import { RecurringAppointmentPanel } from "@/components/recurring/RecurringAppointmentPanel";
import { Badge } from "@/components/ui/badge";

export const OperationsHub = () => {
  const [activeTab, setActiveTab] = useState<"agenda" | "recurring" | "waitlist">("agenda");
  const { barbershop } = useBarbershop();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Operações</span>
          </h1>
          <p className="text-slate-400 font-medium">Gerencie seu fluxo de atendimento diário</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <Button 
            variant={activeTab === "agenda" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("agenda")}
          >
            Agenda
          </Button>
          <Button 
            variant={activeTab === "recurring" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("recurring")}
          >
            Configurações
          </Button>
          <Button 
            variant={activeTab === "waitlist" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("waitlist")}
          >
            Fila
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "agenda" && <AgendamentosPage />}
        {activeTab === "recurring" && (
          <div className="glass-card p-6 rounded-[2.5rem]">
            <RecurringAppointmentPanel barbershopId={barbershop?.id || ""} />
          </div>
        )}
        {activeTab === "waitlist" && (
          <div className="glass-card p-6 rounded-[2.5rem]">
            <ProfessionalWaitlistPanel barbershopId={barbershop?.id || ""} />
          </div>
        )}
      </div>
    </div>
  );
};

const AgendamentosPage = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const { services } = useServices(barbershop?.id);
  const { professionals } = useProfessionals(barbershop?.id);
  const { appointments, refetch } = useAppointments(barbershop?.id);
  const [showForm, setShowForm] = useState(false);
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

    // 🛡️ Segurança: Validação Zod
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
      toast.error("Erro: " + error.message);
      setSaving(false);
      return;
    }

    // 🛡️ Segurança: Auditoria
    await logAction('INSERT', 'appointments', undefined, { client: form.client_name, service: form.service_id });

    toast.success("Agendamento criado!");
    setSaving(false);
    setShowForm(false);
    setForm({ client_name: "", client_whatsapp: "", service_id: "", professional_id: "", scheduled_at: "", notes: "" });
    refetch();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    // 🛡️ Segurança: Auditoria de mudança de status
    await logAction('UPDATE', 'appointments', id, { status });

    toast.success(`Status atualizado para ${status}`);
    refetch();
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    scheduled: { label: "Agendado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    confirmed: { label: "Confirmado", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    completed: { label: "Concluído", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    canceled: { label: "Cancelado", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  };

  const filteredAppointments = appointments.filter(ap => 
    ap.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ap.professionals?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Lista */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
              <Input 
                placeholder="Buscar por cliente ou profissional..." 
                className="pl-12 bg-slate-900/50 border-white/5 rounded-2xl h-12 focus:ring-orange-500/20 focus:border-orange-500/50 transition-premium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-900/50 border border-white/5 h-12 w-12">
              <Filter className="w-4 h-4 text-slate-400" />
            </Button>
          </div>

          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-[2.5rem]">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium italic">Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              filteredAppointments.map((ap) => (
                <div key={ap.id} className="glass-card p-5 rounded-3xl hover-scale group border border-white/5 hover:border-white/10 transition-premium">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-orange flex items-center justify-center text-white font-black shadow-gold">
                        {ap.client_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{ap.client_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusMap[ap.status]?.color}`}>
                            {statusMap[ap.status]?.label}
                          </Badge>
                          <span className="text-xs text-slate-500 font-medium">• {new Date(ap.scheduled_at).toLocaleDateString()} às {new Date(ap.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-premium" onClick={() => updateStatus(ap.id, "completed")}>
                         <Check className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-premium" onClick={() => updateStatus(ap.id, "canceled")}>
                         <X className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 transition-premium">
                         <MoreVertical className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-bold text-slate-300">{ap.services?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-slate-300">{ap.professionals?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-gradient-gold">R$ {Number(ap.services?.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="lg:col-span-4">
          <div className="glass-card p-8 rounded-[2.5rem] border-orange-500/20 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-black text-white">Novo Agendamento</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Cliente</Label>
                <Input 
                  placeholder="Nome do cliente" 
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-white"
                  value={form.client_name}
                  onChange={(e) => setForm({...form, client_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-white"
                  value={form.client_whatsapp}
                  onChange={(e) => setForm({...form, client_whatsapp: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Serviço</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:ring-2 ring-orange-500/20"
                  value={form.service_id}
                  onChange={(e) => setForm({...form, service_id: e.target.value})}
                >
                  <option value="" className="bg-slate-900">Selecione um serviço</option>
                  {services.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name} - R$ {s.price}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Profissional</Label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 px-4 text-white text-sm focus:outline-none focus:ring-2 ring-orange-500/20"
                  value={form.professional_id}
                  onChange={(e) => setForm({...form, professional_id: e.target.value})}
                >
                  <option value="" className="bg-slate-900">Selecione o profissional</option>
                  {professionals.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Data e Hora</Label>
                <Input 
                  type="datetime-local" 
                  className="bg-white/5 border-white/10 rounded-2xl h-12 text-white [color-scheme:dark]"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({...form, scheduled_at: e.target.value})}
                />
              </div>

              <Button 
                variant="gold" 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-gold mt-4 hover-scale"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? "Agendando..." : "Criar Agendamento"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
