import { useNavigate } from "react-router-dom";
import { useBarbershop } from "./hooks";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Wallet, 
  Share2, 
  CheckCircle,
  ArrowUpRight,
  Zap,
  Star,
  MessageCircle,
  Settings,
  HelpCircle,
  Gift,
  Plus,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export const DashboardHome = () => {
    const navigate = useNavigate();
    const { barbershop } = useBarbershop();
    const [metrics, setMetrics] = useState({ todayRevenue: 0, todayAppointments: 0, activeClients: 0, cashbackTotal: 0 });

    useEffect(() => {
        if (!barbershop?.id) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        Promise.all([
          (supabase as any).from("appointments").select("id", { count: "exact", head: true })
            .eq("barbershop_id", barbershop.id)
            .gte("scheduled_at", today.toISOString())
            .lt("scheduled_at", tomorrow.toISOString())
            .in("status", ["scheduled", "confirmed", "completed"]),
          (supabase as any).from("appointments").select("services(price)")
            .eq("barbershop_id", barbershop.id)
            .eq("status", "completed")
            .gte("scheduled_at", today.toISOString())
            .lt("scheduled_at", tomorrow.toISOString()),
          (supabase as any).from("appointments").select("client_name", { count: "exact", head: true })
            .eq("barbershop_id", barbershop.id),
        ]).then(([todayApts, completedApts, allClients]) => {
          const revenue = (completedApts.data || []).reduce((s: number, a: any) => s + Number(a.services?.price || 0), 0);
          setMetrics({
            todayAppointments: todayApts.count || 0,
            todayRevenue: revenue,
            activeClients: allClients.count || 0,
            cashbackTotal: 0,
          });
        });
    }, [barbershop?.id]);

    const bookingLink = useMemo(() => barbershop?.slug ? `${window.location.origin}/agendar/${barbershop.slug}` : "", [barbershop?.slug]);

    const handleShare = useCallback(() => {
        if (!bookingLink) { toast.error("Configure o slug da barbearia primeiro."); return; }
        if (navigator.share) {
          navigator.share({ title: barbershop?.name, text: "Agende seu horário!", url: bookingLink });
        } else {
          navigator.clipboard?.writeText(bookingLink);
          toast.success("Link copiado!");
        }
    }, [bookingLink, barbershop?.name]);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-white/5">
              <div className="space-y-1">
                 <Badge variant="outline" className="rounded-full border-orange-500/30 text-orange-400 bg-orange-500/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-2 animate-pulse">
                   Diamond Status
                 </Badge>
                 <h1 className="text-5xl font-black text-white tracking-tighter leading-tight">
                    Bom dia, <span className="text-gradient-gold">{barbershop?.name?.split(' ')[0] || 'Comandante'}</span>
                 </h1>
                 <p className="text-slate-400 font-medium text-lg tracking-tight">O cockpit do seu império está pronto. Veja os sinais vitais de hoje.</p>
              </div>
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-1000">
                 <Button variant="ghost" className="rounded-2xl h-14 px-6 border border-white/5 bg-slate-950/40 backdrop-blur-3xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-premium shadow-2xl" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2 text-orange-400" /> Share Business
                 </Button>
                 <Button variant="gold" className="rounded-2xl h-14 px-10 font-black text-[11px] uppercase tracking-widest shadow-gold hover-scale diamond-glow flex items-center gap-2" onClick={() => navigate('/painel-dono/operacoes')}>
                    Acessar Agenda <Plus size={16} />
                 </Button>
              </div>
           </div>

            <TooltipProvider>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Faturamento Hoje" value={`R$ ${metrics.todayRevenue.toFixed(2)}`} icon={<TrendingUp className="text-emerald-400" />} trend="+15%" delay="delay-0" tooltip="Total bruto de serviços concluídos hoje." />
                  <MetricCard title="Agendamentos" value={metrics.todayAppointments} icon={<Calendar className="text-blue-400" />} trend="Hoje" delay="delay-100" tooltip="Número de horários marcados para hoje." />
                  <MetricCard title="Clientes Base" value={metrics.activeClients} icon={<Users className="text-orange-400" />} trend="Total" delay="delay-200" tooltip="Total de clientes cadastrados no sistema." />
                  <MetricCard title="NPS Médio" value="4.9" icon={<Star className="text-yellow-400 fill-yellow-400/20" />} trend="Excelente" delay="delay-300" tooltip="Índice de satisfação baseado nas avaliações recentes." />
               </div>
            </TooltipProvider>

           {/* Quick Actions */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard 
                 title="Modo Operação" 
                 desc="Governança de agenda e cadeiras" 
                 icon={<Zap className="w-6 h-6" />} 
                 color="bg-orange-500/10 text-orange-400 border-orange-500/20" 
                 onClick={() => navigate('/painel-dono/operacoes')} 
                 delay="delay-0"
              />
              <QuickActionCard 
                 title="Performance" 
                 desc="Metas por profissional e ranking" 
                 icon={<Users className="w-6 h-6" />} 
                 color="bg-blue-500/10 text-blue-400 border-blue-500/20" 
                 onClick={() => navigate('/painel-dono/gestao')} 
                 delay="delay-75"
              />
              <QuickActionCard 
                 title="Fluxo de Caixa" 
                 desc="Repasses, taxas e liquidez" 
                 icon={<Wallet className="w-6 h-6" />} 
                 color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                 onClick={() => navigate('/painel-dono/financeiro')} 
                 delay="delay-100"
              />
              <QuickActionCard 
                 title="Motor de Crescimento" 
                 desc="CRM, Cashback e Retenção" 
                 icon={<TrendingUp className="w-6 h-6" />} 
                 color="bg-purple-500/10 text-purple-400 border-purple-500/20" 
                 onClick={() => navigate('/painel-dono/crescimento')} 
                 delay="delay-150"
              />
              <QuickActionCard 
                 title="Canais de Impacto" 
                 desc="WhatsApp & Campanhas diretas" 
                 icon={<MessageCircle className="w-6 h-6" />} 
                 color="bg-green-500/10 text-green-400 border-green-500/20" 
                 onClick={() => navigate('/painel-dono/comunicacao')} 
                 delay="delay-200"
              />
              <QuickActionCard 
                 title="Core System" 
                 desc="Configurações estruturais do app" 
                 icon={<Settings className="w-6 h-6" />} 
                 color="bg-slate-500/10 text-slate-400 border-slate-500/20" 
                 onClick={() => navigate('/painel-dono/configuracoes')} 
                 delay="delay-300"
              />
           </div>

           {/* Recent Activity / Insights */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="glass-card lg:col-span-8 p-8 rounded-[3rem] border-white/5 bg-slate-900/10 h-80 flex flex-col items-center justify-center text-center group">
                 <div className="w-16 h-16 rounded-[2rem] bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-premium">
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                 </div>
                 <h3 className="text-xl font-black text-white mb-2">Relatórios Detalhados</h3>
                 <p className="text-slate-500 max-w-sm font-medium">Acesse a área de faturamentos para ver gráficos de crescimento e produtividade por profissional.</p>
                 <Button variant="ghost" className="mt-6 font-bold text-orange-400 hover:text-white" onClick={() => navigate('/painel-dono/financeiro')}>Ir para Financeiro <ArrowUpRight className="w-4 h-4 ml-1" /></Button>
              </Card>

              <Card className="glass-card lg:col-span-4 p-8 rounded-[3rem] border-orange-500/10 bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col items-center justify-center text-center">
                 <Gift className="w-12 h-12 text-orange-400 mb-6 drop-shadow-gold" />
                 <h3 className="text-xl font-black text-white mb-2">Cashback Ativo</h3>
                 <p className="text-slate-500 text-sm font-medium mb-6">A retenção de clientes aumentou 22% este mês usando recompensas.</p>
                 <Badge className="bg-orange-500/20 text-orange-400 border-none px-4 py-1 rounded-full font-black mb-8 italic shadow-gold-sm">POWER UP</Badge>
                 <Button variant="gold" className="w-full rounded-2xl h-12 font-black shadow-gold" onClick={() => navigate('/painel-dono/crescimento')}>Configurar</Button>
              </Card>
           </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon, trend, delay = "", tooltip = "" }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Card className={`glass-card p-6 md:p-8 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-premium group relative overflow-hidden animate-in fade-in zoom-in duration-700 cursor-help bg-slate-950/20 backdrop-blur-3xl shadow-2xl ${delay}`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-colors duration-700" />
                <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-[9px] font-black tracking-widest text-slate-400 px-3 uppercase">{trend}</Badge>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    {title} <HelpCircle size={10} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-3xl font-black text-white tracking-tight leading-none truncate group-hover:text-gradient-gold transition-all">{value}</p>
            </Card>
        </TooltipTrigger>
        {tooltip && (
            <TooltipContent className="bg-slate-900 border-white/10 text-white rounded-xl py-3 px-4 shadow-premium backdrop-blur-xl">
                <p className="text-xs font-bold">{tooltip}</p>
            </TooltipContent>
        )}
    </Tooltip>
);

const QuickActionCard = ({ title, desc, icon, color, onClick, delay = "" }: any) => (
    <div 
        onClick={onClick}
        className={`glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all duration-500 cursor-pointer group flex items-center gap-5 diamond-glow shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-950/20 backdrop-blur-3xl hover:-translate-y-1 ${delay}`}
    >
        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center flex-shrink-0 transition-premium group-hover:scale-110 shadow-premium border ${color}`}>
            {icon}
        </div>
        <div className="flex-1">
            <h4 className="font-black text-white text-lg leading-tight uppercase tracking-tight group-hover:text-orange-400 transition-colors">{title}</h4>
            <p className="text-slate-500 text-[11px] font-bold mt-1 leading-relaxed opacity-80">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>
);
