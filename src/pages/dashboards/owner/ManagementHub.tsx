import { useState, useRef } from "react";
import { useBarbershop, useServices, useProfessionals } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { ProfessionalSchema, ServiceSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Camera,
  Package,
  Building,
  Star,
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/lib/upload-image";
import { SkeletonHub } from "@/components/ui/SkeletonHub";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ManagementHub = () => {
  const [activeTab, setActiveTab] = useState<"professionals" | "services" | "inventory">("professionals");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Gestão</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle sua equipe, cardápio de serviços e ativos</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <Button 
            variant={activeTab === "professionals" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("professionals")}
          >
            Equipe
          </Button>
          <Button 
            variant={activeTab === "services" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("services")}
          >
            Serviços
          </Button>
          <Button 
            variant={activeTab === "inventory" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("inventory")}
          >
            Estoque
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "professionals" && <ProfissionaisPage />}
        {activeTab === "services" && <ServicosPage />}
        {activeTab === "inventory" && <EstoquePage />}
      </div>
    </div>
  );
};

const ProfissionaisPage = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const { professionals, refetch, loading: loadingProfs } = useProfessionals(barbershop?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comm, setComm] = useState("50");
  const [pix, setPix] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!barbershop) return;

    const validation = ProfessionalSchema.safeParse({
       name,
       email,
       phone: pix,
       role: "profissional",
       commission_pct: Number(comm),
       is_active: true
    });

    if (!validation.success) {
       toast.error(validation.error.issues[0].message);
       return;
    }

    const { error } = await (supabase as any).from("professionals").insert([
      {
        barbershop_id: barbershop.id,
        name,
        email: email || null,
        commission_percentage: Number(comm),
        pix_key: pix || null,
        avatar_url: photoUrl || null,
        is_active: true,
      }
    ]);

    if (error) toast.error(error.message);
    else {
      toast.success("Profissional cadastrado!");
      await logAction('SETTINGS_CHANGE', 'professionals', undefined, { name, email, comm });
      
      setShowAdd(false);
      setName(""); setEmail(""); setComm("50"); setPix(""); setPhotoUrl("");
      refetch();
    }
  };

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barbershop) return;
    setUploading(true);
    const url = await uploadImage(file, "avatars", barbershop.id.slice(0, 8));
    if (url) {
      setPhotoUrl(url);
      setUploading(false);
    } else {
      toast.error("Erro no upload");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="gold" className="rounded-2xl font-black shadow-gold h-12 px-8 diamond-glow" onClick={() => setShowAdd(!showAdd)}>
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
                    <Button variant="ghost" className="rounded-2xl h-12 px-6 font-bold" onClick={() => setShowAdd(false)}>Cancelar</Button>
                    <Button variant="gold" className="rounded-2xl h-12 px-10 font-black shadow-gold" onClick={handleCreate}>Salvar Profissional</Button>
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
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-premium z-10">
               <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 h-9 w-9"><Edit className="w-4 h-4 text-slate-400" /></Button>
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
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");

  const handleCreate = async () => {
    if (!barbershop) return;

    const validation = ServiceSchema.safeParse({
       name,
       price: Number(price),
       duration_minutes: Number(duration)
    });

    if (!validation.success) {
       toast.error(validation.error.issues[0].message);
       return;
    }

    const { error } = await (supabase as any).from("services").insert([{
      barbershop_id: barbershop.id,
      name,
      price: Number(price),
      duration_minutes: Number(duration),
      is_active: true
    }]);

    if (error) toast.error(error.message);
    else {
      toast.success("Serviço adicionado!");
      await logAction('SETTINGS_CHANGE', 'services', undefined, { name, price });

      setShowAdd(false);
      setName(""); setPrice(""); setDuration("30");
      refetch();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="gold" className="rounded-2xl h-12 px-8 font-black shadow-gold diamond-glow" onClick={() => setShowAdd(!showAdd)}>
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
                 <Button variant="ghost" className="rounded-2xl h-12 font-bold px-8" onClick={() => setShowAdd(false)}>Cancelar</Button>
                 <Button variant="gold" className="rounded-2xl h-14 px-12 font-black shadow-gold" onClick={handleCreate}>Criar Serviço</Button>
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
                <div className="p-2 opacity-0 group-hover:opacity-100 transition-premium">
                   <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-white/5"><Edit className="w-4 h-4 text-slate-400" /></Button>
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
    return (
        <div className="glass-card p-20 rounded-[2.5rem] text-center border-dashed border-white/10">
           <Package className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <h2 className="text-2xl font-black text-white mb-2">Monitor de Estoque</h2>
           <p className="text-slate-500 font-medium max-w-md mx-auto">Em breve: Controle total de produtos para venda e uso profissional com alertas de reposição inteligente.</p>
           <Button variant="outline" className="mt-8 rounded-2xl h-12 px-8 border-white/10 text-slate-400 hover:text-white">Notificar-me</Button>
        </div>
    );
};
