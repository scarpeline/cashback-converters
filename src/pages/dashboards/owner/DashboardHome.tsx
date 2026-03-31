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
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
           {/* Welcome Header */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                    Olá, <span className="text-gradient-gold">{barbershop?.name?.split(' ')[0] || 'Dono'}</span>!
                 </h1>
                 <p className="text-slate-400 font-medium">Seu negócio está decolando. Veja o resumo de hoje.</p>
              </div>
              <div className="flex items-center gap-4 animate-in slide-in-from-right duration-700">
                 <Button variant="ghost" className="rounded-2xl h-12 px-6 border border-white/5 bg-white/5 font-bold text-white hover:bg-white/10 transition-premium" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2 text-orange-400" /> Compartilhar App
                 </Button>
                 <Button variant="gold" className="rounded-2xl h-12 px-8 font-black shadow-gold hover-scale diamond-glow" onClick={() => navigate('/painel-dono/operacoes')}>
                    Ver Agenda
                 </Button>
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Faturamento Hoje" value={`R$ ${metrics.todayRevenue.toFixed(2)}`} icon={<TrendingUp className="text-emerald-400" />} trend="+15%" delay="delay-0" />
              <MetricCard title="Agendamentos" value={metrics.todayAppointments} icon={<Calendar className="text-blue-400" />} trend="Hoje" delay="delay-100" />
              <MetricCard title="Clientes Base" value={metrics.activeClients} icon={<Users className="text-orange-400" />} trend="Total" delay="delay-200" />
              <MetricCard title="NPS Médio" value="4.9" icon={<Star className="text-yellow-400 fill-yellow-400/20" />} trend="Excelente" delay="delay-300" />
           </div>

           {/* Quick Actions */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickActionCard 
                 title="Nova Operação" 
                 desc="Acesse a agenda e gerencie seu dia" 
                 icon={<Zap className="w-6 h-6" />} 
                 color="bg-orange-500/10 text-orange-400" 
                 onClick={() => navigate('/painel-dono/operacoes')} 
              />
              <QuickActionCard 
                 title="Gestão de Equipe" 
                 desc="Visualize metas e performance" 
                 icon={<Users className="w-6 h-6" />} 
                 color="bg-blue-500/10 text-blue-400" 
                 onClick={() => navigate('/painel-dono/gestao')} 
              />
              <QuickActionCard 
                 title="Fluxo Financeiro" 
                 desc="Confira seus repasses e ganhos" 
                 icon={<Wallet className="w-6 h-6" />} 
                 color="bg-emerald-500/10 text-emerald-400" 
                 onClick={() => navigate('/painel-dono/financeiro')} 
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

const MetricCard = ({ title, value, icon, trend, delay = "" }: any) => (
    <Card className={`glass-card p-6 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-premium group relative overflow-hidden animate-in fade-in zoom-in duration-700 ${delay}`}>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-[40px] rounded-full group-hover:bg-white/10 transition-colors" />
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-900/50 flex items-center justify-center border border-white/5">
                {icon}
            </div>
            <Badge variant="outline" className="rounded-full bg-white/5 border-white/5 text-[10px] font-black tracking-widest text-slate-500">{trend}</Badge>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
    </Card>
);

const QuickActionCard = ({ title, desc, icon, color, onClick }: any) => (
    <div 
        onClick={onClick}
        className="glass-card p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-premium cursor-pointer group flex items-center gap-5 diamond-glow"
    >
        <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center flex-shrink-0 transition-premium group-hover:scale-110 shadow-premium ${color}`}>
            {icon}
        </div>
        <div>
            <h4 className="font-black text-white text-lg leading-tight">{title}</h4>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{desc}</p>
        </div>
    </div>
);
