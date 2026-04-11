import { useState, useRef, useEffect } from "react";
import { useBarbershop, useServices, useProfessionals } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { useDynamicLabel } from "@/lib/dynamicLabels";
import { useProfessionalLimits } from "@/hooks/useProfessionalLimits";
import { ProfessionalSchema, ServiceSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FichaAnamnesePanel } from "@/components/clientes/FichaAnamnesePanel";
import { 
  Users, 
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
  Camera,
  Package,
  Star,
  ShieldCheck,
  Zap,
  Tag,
  HelpCircle,
  Clock,
  BookOpen,
  Link2,
  X,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/upload-image";
import { SkeletonHub } from "@/components/ui/SkeletonHub";
import { ProfessionalLimitBadge, ProfessionalLimitAlert } from "@/components/professionals/ProfessionalLimitBadge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceMediaPanel } from "@/components/media/ServiceMediaPanel";
import { DigitalProductsHub } from "@/components/digital/DigitalProductsHub";
import { PaymentLinksHub } from "@/components/payments/PaymentLinksHub";

export const ManagementHub = () => {
  const [activeTab, setActiveTab] = useState<"professionals" | "services" | "inventory" | "digital" | "charges" | "anamnese">("professionals");
  const profLabel = useDynamicLabel("professionals");
  const servLabel = useDynamicLabel("services");
  const { barbershop } = useBarbershop();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Gestão</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle sua equipe, cardápio de serviços e ativos</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl gap-1">
          <Button variant={activeTab === "professionals" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("professionals")}>{profLabel}</Button>
          <Button variant={activeTab === "services" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("services")}>{servLabel}</Button>
          <Button variant={activeTab === "inventory" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("inventory")}>Estoque</Button>
          <Button variant={activeTab === "anamnese" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("anamnese")}>
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />Anamnese
          </Button>
          <Button variant={activeTab === "digital" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("digital")}>
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />Loja Digital
          </Button>
          <Button variant={activeTab === "charges" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("charges")}>
            <Link2 className="w-3.5 h-3.5 mr-1.5" />Cobranças
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "professionals" && <ProfissionaisPage />}
        {activeTab === "services" && <ServicosPage />}
        {activeTab === "inventory" && <EstoquePage />}
        {activeTab === "anamnese" && <FichaAnamnesePanel />}
        {activeTab === "digital" && barbershop && <DigitalProductsHub barbershopId={barbershop.id} />}
        {activeTab === "charges" && barbershop && <PaymentLinksHub barbershopId={barbershop.id} />}
      </div>
    </div>
  );
};

const ProfissionaisPage = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const { professionals, refetch, loading: loadingProfs } = useProfessionals(barbershop?.id);
  const { canAddProfessional, isAtLimit } = useProfessionalLimits();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comm, setComm] = useState("50");
  const [pix, setPix] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setName(""); setEmail(""); setComm("50"); setPix(""); setPhotoUrl(""); setEditingId(null); setShowAdd(false); };

  const handleCreate = async () => {
    if (!barbershop) return;
    
    // Check limit only for new professionals (not editing)
    if (!editingId && !canAddProfessional) {
      toast.error("Você atingiu o limite de profissionais do seu plano. Faça upgrade para adicionar mais.");
      return;
    }
    
    const validation = ProfessionalSchema.safeParse({ name, email, phone: pix, role: "profissional", commission_pct: Number(comm), is_active: true });
    if (!validation.success) { toast.error(validation.error.issues[0].message); return; }

    if (editingId) {
      const { error } = await (supabase as any).from("professionals").update({ name, email: email || null, commission_percentage: Number(comm), pix_key: pix || null, avatar_url: photoUrl || null }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Profissional atualizado!");
    } else {
      const { error } = await (supabase as any).from("professionals").insert([{ barbershop_id: barbershop.id, name, email: email || null, commission_percentage: Number(comm), pix_key: pix || null, avatar_url: photoUrl || null, is_active: true }]);
      if (error) { 
        if (error.message.includes('Professional limit reached')) {
          toast.error("Limite de profissionais atingido. Faça upgrade do seu plano.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Profissional cadastrado!");
    }
    await logAction('SETTINGS_CHANGE', 'professionals', editingId || undefined, { name, email, comm });
    resetForm(); refetch();
  };

  const handleEdit = (prof: any) => {
    setEditingId(prof.id); setName(prof.name); setEmail(prof.email || ""); setComm(String(prof.commission_percentage || 50)); setPix(prof.pix_key || ""); setPhotoUrl(prof.avatar_url || ""); setShowAdd(true);
  };

  const handleDelete = async (id: string, profName: string) => {
    if (!confirm(`Remover ${profName}?`)) return;
    const { error } = await (supabase as any).from("professionals").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profissional removido");
    refetch();
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barbershop) return;
    setUploading(true);
    const url = await uploadImage(file, "avatars", barbershop.id.slice(0, 8));
    if (url) { setPhotoUrl(url); } else { toast.error("Erro no upload"); }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <ProfessionalLimitAlert />
      
      <div className="flex justify-between items-center">
        <ProfessionalLimitBadge />
        <Button 
          variant="gold" 
          className="rounded-2xl font-black shadow-gold h-12 px-8 diamond-glow" 
          onClick={() => { 
            if (!editingId && isAtLimit) {
              toast.error("Limite de profissionais atingido. Faça upgrade para adicionar mais.");
              return;
            }
            resetForm(); 
            setShowAdd(!showAdd); 
          }}
          disabled={!editingId && isAtLimit}
        >
          <Plus className="w-5 h-5 mr-2" /> {showAdd ? "Fechar" : "Novo Integrante"}
        </Button>
      </div>

      {showAdd && (
        <Card className="glass-card border-orange-500/20 rounded-[2.5rem] p-8 animate-in slide-in-from-top-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-3 flex flex-col items-center gap-4">
                 <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-2 border-white/10 flex items-center justify-center overflow-hidden transition-premium group-hover:border-orange-500/50">
                       {photoUrl ? (
                         <img src={photoUrl} className="w-full h-full object-cover" />
                       ) : (
                         <Camera className="w-8 h-8 text-slate-700 group-hover:text-orange-400 transition-colors" />
                       )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-2xl p-2 shadow-gold opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus className="w-4 h-4 text-white" />
                    </div>
                    <input type="file" hidden ref={fileRef} onChange={handlePhotoUpdate} />
                 </div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Foto de Perfil</p>
              </div>

              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-slate-400 font-bold ml-1">Nome Completo</Label>
                    <Input placeholder="Nome do profissional" value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-slate-400 font-bold ml-1">E-mail (opcional)</Label>
                    <Input placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-slate-400 font-bold ml-1">Comissão (%)</Label>
                    <Input type="number" value={comm} onChange={e => setComm(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-slate-400 font-bold ml-1">Chave PIX</Label>
                    <Input placeholder="Telefone, E-mail ou CPF" value={pix} onChange={e => setPix(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12" />
                 </div>
                 <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                    <Button variant="ghost" className="rounded-2xl h-12 px-6 font-bold" onClick={resetForm}>Cancelar</Button>
                    <Button variant="gold" className="rounded-2xl h-12 px-10 font-black shadow-gold" onClick={handleCreate}>{editingId ? "Atualizar" : "Salvar Profissional"}</Button>
                 </div>
              </div>
           </div>
        </Card>
      )}

      <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingProfs ? (
          [1, 2, 3].map(i => <SkeletonHub key={i} className="h-64 rounded-[2.5rem]" />)
        ) : professionals.map((prof, idx) => (
          <div 
            key={prof.id} 
            className={`glass-card p-6 rounded-[2.5rem] group hover-scale border border-white/5 hover:border-white/10 transition-premium relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-${idx % 5 * 100}`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-premium z-10 flex gap-1">
               <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 h-9 w-9" onClick={() => handleEdit(prof)}><Edit className="w-4 h-4 text-slate-400" /></Button>
               <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-500/10 h-9 w-9" onClick={() => handleDelete(prof.id, prof.name)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
            
            <div className="flex flex-col items-center text-center relative z-0">
               <div className="w-20 h-20 rounded-[2rem] bg-gradient-orange p-1 shadow-gold-sm mb-4 group-hover:rotate-3 transition-transform duration-500">
                  <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-slate-900 flex items-center justify-center">
                     {prof.avatar_url ? <img src={prof.avatar_url} className="w-full h-full object-cover" /> : <Users className="w-8 h-8 text-slate-700" />}
                  </div>
               </div>
               
               <h3 className="font-black text-xl text-white underline-gold px-1 truncate w-full">{prof.name}</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-6 truncate w-full">{prof.email || "Sem e-mail"}</p>
               
               <div className="grid grid-cols-2 w-full gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 cursor-help hover:bg-slate-900 transition-colors">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">Paga <HelpCircle size={8} /></p>
                         <p className="text-lg font-black text-white">{prof.commission_percentage}%</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-white/10 text-white rounded-xl py-3 px-4 shadow-premium backdrop-blur-xl">
                       <p className="text-xs font-bold">Porcentagem de comissão por serviço executado.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 cursor-help hover:bg-slate-900 transition-colors">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">Meta <HelpCircle size={8} /></p>
                         <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                            <p className="text-lg font-black text-white">4.9</p>
                         </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-white/10 text-white rounded-xl py-3 px-4 shadow-premium backdrop-blur-xl">
                       <p className="text-xs font-bold">Avaliação média dos clientes para este profissional.</p>
                    </TooltipContent>
                  </Tooltip>
               </div>
               
               <div className="mt-6 w-full flex items-center justify-between px-2">
                  <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                    Ativo
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest gap-2">
                    <ShieldCheck className="w-4 h-4" /> Direitos
                  </Button>
               </div>
            </div>
          </div>
        ))}
      </div>
     </TooltipProvider>
    </div>
  );
};

const ServicosPage = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const { services, refetch, loading: loadingServices } = useServices(barbershop?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [mediaServiceId, setMediaServiceId] = useState<string | null>(null);
  const [mediaServiceName, setMediaServiceName] = useState("");

  const resetForm = () => { setName(""); setPrice(""); setDuration("30"); setEditingId(null); setShowAdd(false); };

  const handleCreate = async () => {
    if (!barbershop) return;
    const validation = ServiceSchema.safeParse({ name, price: Number(price), duration_minutes: Number(duration) });
    if (!validation.success) { toast.error(validation.error.issues[0].message); return; }

    if (editingId) {
      const { error } = await (supabase as any).from("services").update({ name, price: Number(price), duration_minutes: Number(duration) }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Serviço atualizado!");
    } else {
      const { error } = await (supabase as any).from("services").insert([{ barbershop_id: barbershop.id, name, price: Number(price), duration_minutes: Number(duration), is_active: true }]);
      if (error) { toast.error(error.message); return; }
      toast.success("Serviço adicionado!");
    }
    await logAction('SETTINGS_CHANGE', 'services', editingId || undefined, { name, price });
    resetForm(); refetch();
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id); setName(s.name); setPrice(String(s.price)); setDuration(String(s.duration_minutes)); setShowAdd(true);
  };

  const handleDelete = async (id: string, svcName: string) => {
    if (!confirm(`Remover "${svcName}"?`)) return;
    await (supabase as any).from("services").update({ is_active: false }).eq("id", id);
    toast.success("Serviço removido");
    refetch();
  };

  return (
    <div className="space-y-8">
      {/* Media modal */}
      <Dialog open={!!mediaServiceId} onOpenChange={open => { if (!open) setMediaServiceId(null); }}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[2.5rem] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white font-black flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-400" />
              Mídia — {mediaServiceName}
            </DialogTitle>
          </DialogHeader>
          {barbershop && mediaServiceId && (
            <ServiceMediaPanel barbershopId={barbershop.id} serviceId={mediaServiceId} />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button variant="gold" className="rounded-2xl h-12 px-8 font-black shadow-gold diamond-glow" onClick={() => { resetForm(); setShowAdd(!showAdd); }}>
          <Plus className="w-5 h-5 mr-2" /> {showAdd ? "Fechar" : "Novo Serviço"}
        </Button>
      </div>

      {showAdd && (
        <Card className="glass-card p-10 rounded-[2.5rem] border-orange-500/20 max-w-3xl mx-auto mb-10">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                 <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-black text-white">Adicionar Novo Serviço</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Nome do Serviço</Label>
                <Input placeholder="Ex: Corte de Cabelo Premium" value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white text-lg font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Preço Sugerido (R$)</Label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</div>
                   <Input type="number" placeholder="50,00" value={price} onChange={e => setPrice(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-white text-lg font-black" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 font-bold ml-1">Duração Estimada (min)</Label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-14 text-white text-lg font-black" />
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                 <Button variant="ghost" className="rounded-2xl h-12 font-bold px-8" onClick={resetForm}>Cancelar</Button>
                 <Button variant="gold" className="rounded-2xl h-14 px-12 font-black shadow-gold" onClick={handleCreate}>{editingId ? "Atualizar Serviço" : "Criar Serviço"}</Button>
              </div>
           </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, idx) => (
          <div 
            key={s.id} 
            className={`glass-card p-6 md:p-8 rounded-[2.5rem] relative group border border-white/5 hover:border-white/10 transition-premium overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700 delay-${idx % 5 * 100}`}
          >
             {/* Background Decoration */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full group-hover:bg-orange-500/15 transition-all duration-700 scale-150" />
             
             <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-14 h-14 rounded-3xl bg-slate-900/50 flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-premium group-hover:scale-110">
                   <Tag className="w-6 h-6 text-orange-400" />
                </div>
                <div className="p-2 opacity-0 group-hover:opacity-100 transition-premium flex gap-1">
                   <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-orange-500/10" onClick={() => { setMediaServiceId(s.id); setMediaServiceName(s.name); }} title="Fotos & Vídeos"><Camera className="w-4 h-4 text-orange-400" /></Button>
                   <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-white/5" onClick={() => handleEdit(s)}><Edit className="w-4 h-4 text-slate-400" /></Button>
                   <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-red-500/10" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
             </div>
             
             <h3 className="text-xl font-black text-white mb-2 leading-tight relative z-10 truncate">{s.name}</h3>
             
             <div className="flex items-center gap-4 text-slate-500 mb-8 relative z-10">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px]">
                   <Clock className="w-3.5 h-3.5" />
                   <span>{s.duration_minutes} min</span>
                </div>
                <span className="text-slate-800">•</span>
                <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px] text-orange-400/80">
                   <Scissors className="w-3.5 h-3.5" />
                   <span>Execução</span>
                </div>
             </div>
             
             <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Preço Sugerido</p>
                <div className="text-right">
                  <p className="text-2xl font-black text-gradient-gold">R$ {Number(s.price).toFixed(2)}</p>
                  <p className="text-[9px] font-black text-emerald-400/50 uppercase tracking-tighter">Padrão Ouro</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EstoquePage = () => {
  const { barbershop } = useBarbershop();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "0", unit: "un", min_stock: "1" });

  const load = async () => {
    if (!barbershop?.id) return;
    setLoading(true);
    const { data } = await (supabase as any).from("inventory_items").select("*").eq("barbershop_id", barbershop.id).order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [barbershop?.id]);

  const handleAdd = async () => {
    if (!form.name.trim() || !barbershop?.id) return;
    const { error } = await (supabase as any).from("inventory_items").insert({
      barbershop_id: barbershop.id,
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      min_stock: Number(form.min_stock),
    });
    if (error) { toast.error("Erro ao adicionar item"); return; }
    toast.success("Item adicionado!");
    setForm({ name: "", quantity: "0", unit: "un", min_stock: "1" });
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("inventory_items").delete().eq("id", id);
    toast.success("Item removido");
    load();
  };

  const handleQtyChange = async (id: string, delta: number, current: number) => {
    const newQty = Math.max(0, current + delta);
    await (supabase as any).from("inventory_items").update({ quantity: newQty }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Estoque</h2>
          <p className="text-sm text-slate-500">Produtos e materiais do estabelecimento</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600">Nome do produto</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pomada modeladora" className="mt-1 h-9 text-slate-900 border-slate-200" />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Unidade</Label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="mt-1 w-full h-9 px-3 text-sm text-slate-900 border border-slate-200 rounded-lg">
                <option value="un">Unidade</option>
                <option value="ml">ml</option>
                <option value="g">gramas</option>
                <option value="cx">caixa</option>
                <option value="pct">pacote</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-slate-600">Quantidade inicial</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1 h-9 text-slate-900 border-slate-200" />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Estoque mínimo</Label>
              <Input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} className="mt-1 h-9 text-slate-900 border-slate-200" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">Salvar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nenhum item cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const low = item.quantity <= item.min_stock;
            return (
              <div key={item.id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${low ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.unit} {low && <span className="text-red-500 font-medium">· Estoque baixo</span>}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleQtyChange(item.id, -1, item.quantity)} className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm font-bold">−</button>
                  <span className={`w-10 text-center text-sm font-bold ${low ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span>
                  <button onClick={() => handleQtyChange(item.id, 1, item.quantity)} className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm font-bold">+</button>
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
