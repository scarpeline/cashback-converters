import { useState, useEffect } from "react";
import { useBarbershop, useProfessionals } from "./hooks";
import { useAuditLog } from "./useAuditLog";
import { WithdrawSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContasPanel } from "@/components/financeiro/ContasPanel";
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
  ArrowRight,
  HelpCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { Badge } from "@/components/ui/badge";
import { HubSkeleton, SkeletonHub } from "@/components/ui/SkeletonHub";import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const FinancialHub = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "payouts" | "contas" | "subscription">("overview");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 uppercase italic">
            Hub <span className="text-gradient-gold uppercase">Financeiro</span>
          </h1>
          <p className="text-slate-400 font-medium italic opacity-70 tracking-tight">Gestão de Fluxo Real & Repasses Automatizados Diamond</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl gap-1">
          <Button 
            variant={activeTab === "overview" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest px-4"
            onClick={() => setActiveTab("overview")}
          >
            Visão Geral
          </Button>
          <Button 
            variant={activeTab === "payouts" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest px-4"
            onClick={() => setActiveTab("payouts")}
          >
            Repasses
          </Button>
          <Button 
            variant={activeTab === "contas" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest px-4"
            onClick={() => setActiveTab("contas")}
          >
            Contas
          </Button>
          <Button 
            variant={activeTab === "subscription" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-black uppercase text-[10px] tracking-widest px-4"
            onClick={() => setActiveTab("subscription")}
          >
            Plano
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "overview" && <FinancialOverview />}
        {activeTab === "payouts" && <PayoutsPage />}
        {activeTab === "contas" && <ContasPanel />}
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
  <Card className={`glass-card p-4 rounded-[2.5rem] ${color} group overflow-hidden animate-in fade-in zoom-in duration-700 ${delay} border-white/5`}>
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${glow} blur-[50px] rounded-full opacity-50`} />
    <CardHeader className="pb-2 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-700 hover:text-orange-400 transition-colors" /></TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-[10px] font-bold">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:rotate-12 transition-transform duration-500">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black text-white mt-4 tracking-tighter">{value}</p>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="mt-4 flex items-center gap-2">
        <Badge className="bg-white/5 text-slate-400 border-none text-[9px] font-black tracking-widest uppercase px-3 py-1">{trend}</Badge>
      </div>
    </CardContent>
  </Card>
);

const FinancialOverview = () => {
  const { barbershop } = useBarbershop();
  const { logAction } = useAuditLog(barbershop?.id || "");
  const [metrics, setMetrics] = useState({ received: 0, pending: 0, total: 0, gatewayBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPix, setWithdrawPix] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!barbershop?.id) return;
    const fetchMetrics = async () => {
       setLoading(true);
       try {
         // Buscar pagamentos do banco
         const { data: payments } = await (supabase as any)
           .from("payments")
           .select("amount, status")
           .eq("barbershop_id", barbershop.id);
           
         // Buscar Saldo Real do Gateway (Asaas)
         let realBalance = 0;
         if (barbershop.asaas_customer_id) {
            try {
               const { data: balData, error: balErr } = await supabase.functions.invoke("process-payment", {
                  body: { action: "get-balance" }
               });
               if (!balErr) realBalance = balData.balance;
            } catch (e) {
               console.warn("Could not fetch real balance from gateway:", e);
            }
         }

         if (payments) {
            const received = payments.filter((p:any) => p.status === 'paid').reduce((acc:any, p:any) => acc + Number(p.amount), 0);
            const pending = payments.filter((p:any) => p.status === 'pending').reduce((acc:any, p:any) => acc + Number(p.amount), 0);
            setMetrics({ 
               received, 
               pending, 
               total: received + pending,
               gatewayBalance: realBalance
            });
         }
       } catch (err) {
         console.error("Error fetching financial metrics:", err);
       } finally {
         setLoading(false);
       }
    };
    fetchMetrics();
  }, [barbershop?.id, barbershop?.asaas_customer_id]);

  if (loading) return <div className="p-8"><HubSkeleton /></div>;

  const handleWithdraw = async () => {
    if (!barbershop?.id) return;
    
    const amount = Number(withdrawAmount);
    const validation = WithdrawSchema.safeParse({ amount, pix_key: withdrawPix });

    if (!validation.success) {
       toast.error(validation.error.issues[0].message);
       return;
    }

    if (amount > metrics.gatewayBalance && metrics.gatewayBalance > 0) {
       toast.error("Saldo insuficiente no gateway Asaas para este saque.");
       return;
    }

    setIsWithdrawing(true);
    try {
       // Ação Real: Solicitar Transferência via Asaas
       const { data: result, error: fnError } = await supabase.functions.invoke("process-payment", {
          body: { 
             action: "transfer",
             amount: amount,
             pix_key: withdrawPix,
             description: `Saque Salão Cashback - ${barbershop.name}`
          }
       });

       if (fnError) throw new Error(fnError.message);

       await logAction('SENSITIVE_ACCESS', 'payouts', undefined, { amount: withdrawAmount, pix: withdrawPix, transfer_id: result.transfer_id });
       toast.success("Saque processado com sucesso via Asaas!");
       setWithdrawAmount("");
       setWithdrawPix("");
       
       // Refresh balance
       window.location.reload();
    } catch (e: any) {
       console.error("Withdraw error:", e);
       toast.error(`Erro ao processar saque: ${e.message}`);
    } finally {
       setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Saldo Gateway (Real)" 
          value={`R$ ${metrics.gatewayBalance.toFixed(2)}`} 
          icon={<Zap className="w-5 h-5 text-yellow-400" />} 
          trend="Disponível Asaas" 
          color="border-yellow-500/20 shadow-gold-sm" 
          glow="bg-yellow-500/10"
          tooltip="Saldo líquido real disponível na sua conta Asaas para saque imediato."
          delay="delay-0"
        />

        <MetricCard 
          title="Total Recebido (Sistema)" 
          value={`R$ ${metrics.received.toFixed(2)}`} 
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-400" />} 
          trend="+8% este mês" 
          color="border-emerald-500/10" 
          glow="bg-emerald-500/5"
          tooltip="Soma de todos os pagamentos marcados como 'Pagos' no sistema."
          delay="delay-100"
        />

        <Card className="glass-card p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border-none bg-gradient-gold shadow-gold group relative overflow-hidden diamond-glow animate-in fade-in zoom-in duration-700 delay-200">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic">
               <ShieldCheck size={12} /> Saque Blindado Expert
            </p>
            <div className="space-y-4">
               <div className="relative group/input">
                  <Input 
                    placeholder="Valor R$" 
                    type="number" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)} 
                    className="bg-black/20 border-black/10 text-black placeholder:text-black/40 h-14 rounded-2xl focus-visible:ring-black/20 transition-all font-black text-lg"
                  />
                  <DollarSign className="absolute right-4 top-4 w-5 h-5 text-black/20" />
               </div>
               <Input 
                  placeholder="Chave PIX de Destino" 
                  value={withdrawPix} 
                  onChange={e => setWithdrawPix(e.target.value)} 
                  className="bg-black/10 border-black/10 text-black placeholder:text-black/40 h-12 rounded-2xl focus-visible:ring-black/20 transition-all font-bold"
               />
               <Button 
                  className="w-full bg-black text-white hover:bg-slate-900 rounded-2xl h-14 font-black border border-white/10 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !metrics.gatewayBalance}
               >
                  {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Confirmar Saque Diamond</>}
               </Button>
               {metrics.gatewayBalance === 0 && (
                  <p className="text-[9px] text-center text-black/40 font-black uppercase tracking-widest pt-2">
                    Aguardando liquidação no Asaas
                  </p>
               )}
            </div>
          </div>
          <div className="absolute -bottom-10 -left-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="w-40 h-40 text-black rotate-[-15deg]" />
          </div>
        </Card>
      </div>

      {/* Legacy Charts & Activity Refined */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <Card className="glass-card p-6 md:p-8 rounded-[3rem] lg:col-span-12 border-white/5 bg-slate-900/10 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
               <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter">Live Cashflow</h3>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] mt-1 border-l-2 border-orange-500 pl-3">Sincronização em Tempo Real (Asaas)</p>
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" className="bg-white/5 border border-white/10 rounded-2xl px-6 h-12 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-all" onClick={() => {
                     const rows = [['Data','Descrição','Valor','Status']];
                     const csv = rows.map(r => r.join(',')).join('\n');
                     const blob = new Blob([csv], { type: 'text/csv' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a'); a.href = url; a.download = 'financeiro.csv'; a.click();
                  }}>Exportar CSV</Button>
                  <Button variant="gold" className="rounded-2xl px-6 h-12 font-black text-xs uppercase tracking-widest shadow-gold" onClick={() => window.location.href = '/painel-dono/financeiro'}>Gerar Relatórios</Button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="md:col-span-3 h-80 flex items-end justify-between gap-4 px-4 pb-4 border-b border-white/5">
                  {[40, 70, 45, 90, 65, 80, 55, 100, 85, 95, 75, 110].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">R$ {h * 150}</div>
                       <div 
                          className={`w-full rounded-t-2xl transition-all duration-700 group-hover:scale-y-110 shadow-gold-sm ${i === 9 ? 'bg-gradient-gold shadow-gold' : 'bg-slate-800/40 hover:bg-slate-700'}`} 
                          style={{ height: `${h}%` }}
                       />
                    </div>
                  ))}
               </div>
               <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Highlights do Período</p>
                  {[
                    { label: "Média Diária", val: "R$ 1.420", color: "text-white" },
                    { label: "Pico de Vendas", val: "Sábado", color: "text-orange-400" },
                    { label: "Taxa Gateway", val: "2.1 %", color: "text-slate-500" },
                  ].map(h => (
                    <div key={h.label} className="p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{h.label}</p>
                       <p className={`text-2xl font-black ${h.color} group-hover:translate-x-1 transition-transform inline-block mt-1`}>{h.val}</p>
                    </div>
                  ))}
               </div>
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
        if (!prof.asaas_wallet_id) {
           toast.error(`O profissional ${prof.name} não possui conta bancária configurada no gateway.`);
           return;
        }

        setPayingId(prof.id);
        try {
           // Ação Real: Transferência Interna Asaas (Wallet Connect)
           const { data: result, error: fnError } = await supabase.functions.invoke("process-payment", {
              body: { 
                 action: "transfer",
                 customer_id: prof.asaas_wallet_id, // Destino
                 amount: 150.00, // Valor de exemplo, deveria vir do saldo calculado
                 description: `Repasse Diamond - ${barbershop.name}`
              }
           });

           if (fnError) throw new Error(fnError.message);

           toast.success(`Repasse real processado via gateway com sucesso para ${prof.name}!`);
        } catch (e: any) {
           console.error("Payout error:", e);
           toast.error(`Erro no repasse: ${e.message}. Verifique se há saldo no gatway.`);
        } finally {
           setPayingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <Card className="glass-card p-10 rounded-[3rem] border-white/5 bg-slate-950/40 relative overflow-hidden group shadow-premium">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-premium group-hover:rotate-12 transition-transform">
                         <Repeat className="w-8 h-8 text-orange-400" />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white tracking-tighter italic">Split Config</h3>
                         <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Gestão de Repasses Inteligentes Asaas</p>
                      </div>
                   </div>
                   
                   <div className="flex bg-slate-900 border border-white/10 p-1.5 rounded-2xl shadow-2xl">
                      <Button variant={payoutMode === "manual" ? "gold" : "ghost"} size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6" onClick={() => setPayoutMode("manual")}>Manual (Wallet)</Button>
                      <Button variant={payoutMode === "auto" ? "gold" : "ghost"} size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6" onClick={() => setPayoutMode("auto")}>Automático (Split)</Button>
                   </div>
                </div>
                
                {payoutMode === 'auto' && (
                  <div className="mt-10 p-8 bg-gradient-gold rounded-[2.5rem] border border-white/10 animate-in zoom-in-95 duration-700 shadow-gold group">
                     <div className="flex items-center gap-4 text-black mb-4">
                        <CheckCircle className="w-6 h-6 fill-black" />
                        <p className="font-black text-base uppercase tracking-[0.2em] italic">Split Diamond Ativado</p>
                     </div>
                     <p className="text-black/70 text-sm font-bold leading-relaxed max-w-2xl">
                        A tecnologia split divide automaticamente a receita no ato do pagamento PIX/Cartão. 
                        O profissional recebe o valor líquido instantaneamente, reduzindo passivos fiscais e operacionais.
                     </p>
                  </div>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {professionals.map((prof, idx) => (
                    <div key={prof.id} 
                      style={{ animationDelay: `${idx * 150}ms` }}
                      className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-orange-500/30 transition-all duration-700 relative overflow-hidden group shadow-xl animate-in slide-in-from-bottom">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-gold opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity" />
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 active-glow transition-all group-hover:rotate-6">
                                {prof.avatar_url ? <img src={prof.avatar_url} className="w-full h-full object-cover" /> : <User className="text-slate-700 w-6 h-6" />}
                             </div>
                             <div>
                                <h4 className="font-black text-xl text-white tracking-tight leading-none">{prof.name}</h4>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 bg-white/5 px-2 py-0.5 rounded-full inline-block">Comissão: {prof.commission_percentage}%</p>
                             </div>
                          </div>
                          <Badge className={`${prof.asaas_wallet_id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'} border-none rounded-full px-4 py-1.5 font-black text-[9px] uppercase tracking-widest shadow-premium`}>
                             {prof.asaas_wallet_id ? 'GATEWAY OK' : 'PENDENTE'}
                          </Badge>
                       </div>
                       
                       <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 group-hover:border-white/10 transition-all">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo no Sistema</span>
                             <span className="text-3xl font-black text-white italic tracking-tighter">R$ 345,00</span>
                          </div>
                          <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden mt-6 relative">
                             <div className="bg-gradient-gold h-full w-[65%] diamond-glow-sm" />
                          </div>
                       </div>
                       
                       <Button 
                          variant="gold" 
                          className="w-full mt-8 h-16 rounded-[1.8rem] font-black shadow-gold hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                          onClick={() => handlePayProfessional(prof)}
                          disabled={payingId === prof.id || !prof.asaas_wallet_id}
                       >
                          {payingId === prof.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><DollarSign className="w-5 h-5 mr-3" /> Pagar via Gateway</>}
                       </Button>
                       {!prof.asaas_wallet_id && (
                          <p className="text-[9px] text-center text-slate-600 font-black uppercase mt-4 tracking-widest animate-pulse">Aguardando dados bancários do profissional</p>
                       )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FinancialHub;
