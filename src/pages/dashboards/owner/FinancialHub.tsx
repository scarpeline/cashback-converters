import { useState, useEffect } from "react";
import { useBarbershop, useProfessionals } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { WithdrawSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Search,
  History,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { Badge } from "@/components/ui/badge";
import { HubSkeleton, SkeletonHub } from "@/components/ui/SkeletonHub";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const FinancialHub = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "payouts" | "subscription">("overview");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub <span className="text-gradient-gold">Financeiro</span>
          </h1>
          <p className="text-slate-400 font-medium">Controle total de entradas, saídas e repasses profissionais</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <Button 
            variant={activeTab === "overview" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("overview")}
          >
            Visão Geral
          </Button>
          <Button 
            variant={activeTab === "payouts" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("payouts")}
          >
            Repasses
          </Button>
          <Button 
            variant={activeTab === "subscription" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("subscription")}
          >
            Plano
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "overview" && <FinancialOverview />}
        {activeTab === "payouts" && <PayoutsPage />}
        {activeTab === "subscription" && (
          <div className="space-y-8">
            <SubscriptionStatus />
            <SubscriptionPlans />
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, trend, color, glow, tooltip, delay }: any) => (
  <Card className={`glass-card p-4 rounded-[2.5rem] ${color} group overflow-hidden animate-in fade-in zoom-in duration-700 ${delay}`}>
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${glow} blur-[50px] rounded-full`} />
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <Tooltip>
            <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-600" /></TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black text-white mt-4">{value}</p>
    </CardHeader>
    <CardContent>
      <div className="mt-4 flex items-center gap-2">
        <Badge className="bg-white/5 text-slate-400 border-none text-[10px] font-black">{trend}</Badge>
      </div>
    </CardContent>
  </Card>
);

const FinancialOverview = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const [metrics, setMetrics] = useState({ received: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPix, setWithdrawPix] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!barbershop?.id) return;
    const fetchMetrics = async () => {
       setLoading(true);
       const { data: payments } = await (supabase as any)
         .from("payments")
         .select("amount, status")
         .eq("barbershop_id", barbershop.id);
         
       if (payments) {
          const received = payments.filter((p:any) => p.status === 'paid').reduce((acc:any, p:any) => acc + Number(p.amount), 0);
          const pending = payments.filter((p:any) => p.status === 'pending').reduce((acc:any, p:any) => acc + Number(p.amount), 0);
          setMetrics({ received, pending, total: received + pending });
       }
       setLoading(false);
    };
    fetchMetrics();
  }, [barbershop?.id]);

  if (loading) return <div className="p-8"><HubSkeleton /></div>;

  const handleWithdraw = async () => {
    if (!barbershop?.id) return;
    
    const validation = WithdrawSchema.safeParse({
       amount: Number(withdrawAmount),
       pix_key: withdrawPix
    });

    if (!validation.success) {
       toast.error(validation.error.issues[0].message);
       return;
    }

    setIsWithdrawing(true);
    await logAction('SENSITIVE_ACCESS', 'payouts', undefined, { amount: withdrawAmount, pix: withdrawPix });

    setTimeout(() => {
      toast.success("Solicitação de saque enviada para auditoria.");
      setIsWithdrawing(false);
      setWithdrawAmount("");
      setWithdrawPix("");
    }, 1500);
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Recebido" 
            value={`R$ ${metrics.received.toFixed(2)}`} 
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-400" />} 
            trend="+12%" 
            color="border-emerald-500/10" 
            glow="bg-emerald-500/5"
            tooltip="Valor total já liquidado e disponível na sua conta."
            delay="delay-0"
          />

          <MetricCard 
            title="Aguardando" 
            value={`R$ ${metrics.pending.toFixed(2)}`} 
            icon={<Wallet className="w-4 h-4 text-orange-400" />} 
            trend="Pendente" 
            color="border-orange-500/10" 
            glow="bg-orange-500/5"
            tooltip="Valores de transações em processamento ou futuras."
            delay="delay-100"
          />

          <Card className="glass-card p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border-none bg-gradient-orange shadow-gold group relative overflow-hidden diamond-glow animate-in fade-in zoom-in duration-700 delay-200">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">Solicitar Saque Rápido</p>
              <div className="space-y-4">
                 <Input 
                    placeholder="Valor R$" 
                    type="number" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)} 
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12 rounded-2xl focus-visible:ring-white/20 transition-premium"
                 />
                 <Input 
                    placeholder="Chave PIX" 
                    value={withdrawPix} 
                    onChange={e => setWithdrawPix(e.target.value)} 
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12 rounded-2xl focus-visible:ring-white/20 transition-premium"
                 />
                 <Button 
                    variant="ghost" 
                    className="w-full bg-white/20 hover:bg-white/30 text-white rounded-2xl h-12 font-black border border-white/10 transition-premium shadow-premium"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                 >
                    {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-2" /> Efetuar Saque</>}
                 </Button>
                 <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-widest italic pt-2 flex items-center justify-center gap-1">
                   <ShieldCheck size={10} /> Blindado por Auditoria
                 </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-white rotate-12" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <Card className="glass-card p-6 md:p-8 rounded-[2.5rem] lg:col-span-7 animate-in fade-in slide-in-from-left duration-700 delay-300">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-white">Fluxo de Caixa</h3>
                    <p className="text-slate-500 text-xs font-medium">Desempenho dos últimos 30 dias</p>
                 </div>
                 <Button variant="ghost" size="sm" className="bg-slate-900/50 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white">
                    <Calendar className="w-3 h-3 mr-2" /> Out/2026
                 </Button>
              </div>
              
              <div className="h-56 flex items-end justify-between gap-2 md:gap-4 px-2">
                 {[40, 70, 45, 90, 65, 80, 55, 100, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                          className={`w-full rounded-t-xl transition-all duration-700 group-hover:scale-y-105 shadow-gold-sm ${i === 7 ? 'bg-gradient-gold diamond-glow' : 'bg-slate-800'}`} 
                          style={{ height: `${h}%` }}
                       />
                    </div>
                 ))}
              </div>
           </Card>

           <Card className="glass-card p-6 md:p-8 rounded-[2.5rem] lg:col-span-5 animate-in fade-in slide-in-from-right duration-700 delay-400">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-white">Atividade</h3>
                 <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 h-10 w-10"><Search className="w-4 h-4 text-slate-400" /></Button>
              </div>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                 {[1, 2, 3, 4, 5].map(t => (
                    <div key={t} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-3xl border border-white/5 hover:border-white/10 transition-premium group translate-x-0 hover:translate-x-1 cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-premium group-hover:scale-110 ${t % 2 === 0 ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                             {t % 2 === 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <CreditCard className="w-5 h-5 text-slate-500" />}
                          </div>
                          <div>
                             <p className="font-black text-white text-sm">Corte + Barba</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Hoje • 14:35</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-white">R$ 75,00</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

const PayoutsPage = () => {
    const { barbershop } = useBarbershop();
    const { professionals } = useProfessionals(barbershop?.id);
    const [payoutMode, setPayoutMode] = useState<"manual" | "auto">("manual");
    const [payingId, setPayingId] = useState<string | null>(null);

    const handlePayProfessional = async (prof: any) => {
        setPayingId(prof.id);
        setTimeout(() => {
           setPayingId(null);
           toast.success(`Repasse de R$ 345,00 concluído para ${prof.name}`);
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <Card className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-950/40">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                         <Repeat className="w-7 h-7 text-orange-400" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-white">Modo de Repasse</h3>
                         <p className="text-slate-500 text-sm font-medium italic">Configure como os profissionais serão pagos</p>
                      </div>
                   </div>
                   
                   <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl">
                      <Button variant={payoutMode === "manual" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setPayoutMode("manual")}>Manual (TED/PIX)</Button>
                      <Button variant={payoutMode === "auto" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setPayoutMode("auto")}>Automático (Split)</Button>
                   </div>
                </div>
                
                {payoutMode === 'auto' && (
                  <div className="mt-8 p-6 bg-orange-500/5 rounded-[2rem] border border-orange-500/10 animate-in fade-in zoom-in duration-500">
                     <div className="flex items-center gap-4 text-orange-400 mb-4">
                        <CheckCircle className="w-5 h-5 shadow-gold" />
                        <p className="font-black text-sm uppercase tracking-widest">Split Inteligente Ativado</p>
                     </div>
                     <p className="text-slate-400 text-sm leading-relaxed">
                        No modo automático, o gateway divide os pagamentos no ato da transação. 
                        O profissional recebe o saldo diretamente na carteira digital, sem burocracia para você.
                     </p>
                  </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {professionals.map(prof => (
                    <div key={prof.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-premium relative overflow-hidden group">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                {prof.avatar_url ? <img src={prof.avatar_url} className="w-full h-full object-cover" /> : <span className="text-slate-600 font-black">PX</span>}
                             </div>
                             <div>
                                <h4 className="font-black text-lg text-white">{prof.name}</h4>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">COMISSÃO: {prof.commission_percentage}%</p>
                             </div>
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-400 border-none rounded-full px-3 py-1 font-black shadow-gold-sm">PIX ATIVO</Badge>
                       </div>
                       
                       <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-slate-500">Saldo Disponível</span>
                             <span className="text-2xl font-black text-white">R$ 345,00</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                             <div className="bg-gradient-gold h-full w-[65%]" />
                          </div>
                       </div>
                       
                       <Button 
                          variant="gold" 
                          className="w-full mt-6 h-12 rounded-2xl font-black shadow-gold-sm hover-scale disabled:opacity-50"
                          onClick={() => handlePayProfessional(prof)}
                          disabled={payingId === prof.id}
                       >
                          {payingId === prof.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-2" /> Efetuar Pagamento</>}
                       </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
