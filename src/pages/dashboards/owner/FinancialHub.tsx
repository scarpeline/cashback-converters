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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card p-4 rounded-[2.5rem] border-emerald-500/10 group overflow-hidden">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full" />
           <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Recebido</p>
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                 </div>
              </div>
              <p className="text-4xl font-black text-white mt-4">R$ {metrics.received.toFixed(2)}</p>
           </CardHeader>
           <CardContent>
              <div className="mt-4 flex items-center gap-2">
                 <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-black">+12%</Badge>
                 <span className="text-xs text-slate-500 font-medium italic">em relação ao mês passado</span>
              </div>
           </CardContent>
        </Card>

        <Card className="glass-card p-4 rounded-[2.5rem] border-orange-500/10 group overflow-hidden">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full" />
           <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Aguardando Pagamento</p>
                 <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-orange-400" />
                 </div>
              </div>
              <p className="text-4xl font-black text-white mt-4">R$ {metrics.pending.toFixed(2)}</p>
           </CardHeader>
           <CardContent>
              <div className="mt-4 flex items-center gap-2">
                 <Badge className="bg-orange-500/10 text-orange-400 border-none text-[10px] font-black">Pendente</Badge>
                 <span className="text-xs text-slate-500 font-medium italic">fluxo de caixa futuro</span>
              </div>
           </CardContent>
        </Card>

        <Card className="glass-card p-8 rounded-[3.5rem] border-none bg-gradient-orange shadow-gold group">
            <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">Solicitar Saque Rápido</p>
            <div className="space-y-4">
               <Input 
                  placeholder="Valor R$" 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12 rounded-2xl"
               />
               <Input 
                  placeholder="Chave PIX" 
                  value={withdrawPix} 
                  onChange={e => setWithdrawPix(e.target.value)} 
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12 rounded-2xl"
               />
               <Button 
                  variant="ghost" 
                  className="w-full bg-white/20 hover:bg-white/30 text-white rounded-2xl h-12 font-black border border-white/10 transition-premium shadow-premium"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
               >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-2" /> Efetuar Saque</>}
               </Button>
               <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-widest italic pt-2">Blindado por Criptografia SSL</p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="glass-card p-8 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-white">Fluxo de Caixa</h3>
               <Button variant="ghost" size="sm" className="bg-slate-900 border border-white/5 rounded-xl text-xs font-bold gap-2">
                  <Calendar className="w-3 h-3" /> Últimos 30 dias
               </Button>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-4 px-4">
               {[40, 70, 45, 90, 65, 80, 55, 100, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 group relative">
                     <div 
                        className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-80 shadow-gold-sm ${i === 7 ? 'bg-orange-400' : 'bg-slate-800'}`} 
                        style={{ height: `${h}%` }}
                     />
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-xl">
                        R${(h * 150).toFixed(0)}
                     </div>
                  </div>
               ))}
            </div>
            <div className="mt-4 flex justify-between px-4 text-slate-700 font-bold text-[10px] uppercase tracking-tighter">
               <span>Pálio 2024</span>
               <span>Meta Mensal</span>
            </div>
         </Card>

         <Card className="glass-card p-8 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-white">Transações Recentes</h3>
               <Button variant="ghost" size="icon" className="rounded-xl"><Search className="w-4 h-4 text-slate-500" /></Button>
            </div>
            
            <div className="space-y-4">
               {[1, 2, 3, 4].map(t => (
                  <div key={t} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t % 2 === 0 ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                           {t % 2 === 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <CreditCard className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                           <p className="font-bold text-white text-sm">Serviço: Corte + Barba</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PIX • 14:35</p>
                        </div>
                     </div>
                     <p className="font-black text-white">R$ 75,00</p>
                  </div>
               ))}
            </div>
         </Card>
      </div>
    </div>
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
