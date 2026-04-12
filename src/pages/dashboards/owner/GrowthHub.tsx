import { useState, useEffect } from "react";
import { useBarbershop } from "./hooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Gift, 
  Users, 
  MessageCircle, 
  Zap, 
  Sparkles, 
  Target, 
  BarChart3,
  Heart,
  Share2,
  Bell,
  CheckCircle,
  Plus,
  ChevronRight,
  Trophy,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoyaltyPanel } from "@/components/gamification/LoyaltyPanel";
import { RankingClientesPanel } from "@/components/clientes/RankingClientesPanel";
import { ComissaoDetalhadaPanel } from "@/components/financeiro/ComissaoDetalhadaPanel";

export const GrowthHub = () => {
  const [activeTab, setActiveTab] = useState<"marketing" | "loyalty" | "cashback" | "ranking" | "comissao">("marketing");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Crescimento</span>
          </h1>
          <p className="text-slate-400 font-medium">Atraia, fidelize e aumente o faturamento com IA</p>
        </div>
        
        <div className="flex flex-wrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl gap-1">
          <Button variant={activeTab === "marketing" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("marketing")}>Marketing</Button>
          <Button variant={activeTab === "loyalty" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("loyalty")}>Fidelidade</Button>
          <Button variant={activeTab === "cashback" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("cashback")}>Cashback</Button>
          <Button variant={activeTab === "ranking" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("ranking")}>
            <Trophy className="w-3.5 h-3.5 mr-1.5" />Ranking
          </Button>
          <Button variant={activeTab === "comissao" ? "gold" : "ghost"} size="sm" className="rounded-xl font-bold" onClick={() => setActiveTab("comissao")}>
            <Percent className="w-3.5 h-3.5 mr-1.5" />Comissões
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "marketing" && <MarketingCenter />}
        {activeTab === "loyalty" && <LoyaltyCenter />}
        {activeTab === "cashback" && <CashbackCenter />}
        {activeTab === "ranking" && (
          <div className="glass-card p-6 md:p-8 rounded-[3rem] border-white/5 bg-slate-950/20">
            <RankingClientesPanel />
          </div>
        )}
        {activeTab === "comissao" && (
          <div className="glass-card p-6 md:p-8 rounded-[3rem] border-white/5 bg-slate-950/20">
            <ComissaoDetalhadaPanel />
          </div>
        )}
      </div>
    </div>
  );
};

const MarketingCenter = () => {
    const { barbershop } = useBarbershop();
    const navigate = useNavigate();

    const handleReativacao = () => navigate("/painel-dono/comunicacao");
    const handleProvasSocial = () => navigate("/painel-dono/configuracoes");
    const handlePixels = () => navigate("/painel-dono/configuracoes");
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-0">
                    <div className="absolute top-0 right-0 p-6">
                       <Zap className="w-8 h-8 text-orange-400 opacity-20 group-hover:opacity-100 transition-premium group-hover:scale-110" />
                    </div>
                    <CardHeader className="pb-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atração com IA</p>
                       <CardTitle className="text-xl font-black text-white mt-2">Reativação Inteligente</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Detectamos clientes que não voltam há 30 dias e enviamos uma oferta automática.</p>
                       <Button variant="gold" size="sm" className="w-full mt-2 rounded-xl font-black shadow-gold-sm transition-premium hover:scale-[1.02] active:scale-[0.98]" onClick={handleReativacao}>Ligar Motor de Vendas</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="absolute top-0 right-0 p-6">
                       <Sparkles className="w-8 h-8 text-orange-400 opacity-20 group-hover:opacity-100 transition-premium group-hover:scale-110" />
                    </div>
                    <CardHeader className="pb-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engajamento Social</p>
                       <CardTitle className="text-xl font-black text-white mt-2">Prova Social Auto</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Exiba as melhores avaliações do Google e Instagram diretamente no seu agendamento.</p>
                       <Button variant="ghost" size="sm" className="w-full mt-2 rounded-xl font-black border border-white/5 bg-white/5 hover:bg-white/10 transition-premium" onClick={handleProvasSocial}>Configurar Feed 3D</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card p-6 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-white/5 shadow-premium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 group">
                    <CardHeader className="pb-2">
                       <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-400/20 text-orange-400 border-none rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase italic">Enterprise</Badge>
                       </div>
                       <CardTitle className="text-xl font-black text-white">Pixels & Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">Integre Meta, Google e TikTok Pixel para traquear conversões e otimizar anúncios de alta escala.</p>
                       <Button variant="ghost" size="sm" className="w-full mt-2 rounded-xl font-black border border-white/10 hover:bg-white/5 hover:text-white transition-premium" onClick={handlePixels}>Gerenciar Conectores</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Atalho para o Hub de Comunicação - Diamond Style */}
            <div className="glass-card p-8 rounded-[3rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-orange-500/40 transition-premium shadow-glow">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-premium ring-4 ring-orange-500/5">
                        <MessageCircle className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white mb-1">Hub de Comunicação & WhatsApp</h3>
                        <p className="text-sm text-slate-500 font-medium max-w-md">Gerencie suas contas, automações de mensagens e campanhas de reativação para explodir seu faturamento.</p>
                    </div>
                </div>
                <Link to="/painel-dono/comunicacao">
                    <Button variant="gold" className="rounded-2xl font-black h-14 px-10 shadow-gold diamond-glow transition-premium text-lg">
                        Acessar Comunicação <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};

const LoyaltyCenter = () => {
    const { barbershop } = useBarbershop();
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               <Card className="glass-card p-6 rounded-[2.5rem] md:col-span-1 flex flex-col justify-between h-full bg-slate-950/40">
                  <div>
                    <Heart className="w-10 h-10 text-rose-500 mb-4 fill-rose-500/20 shadow-premium" />
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight">Clube de Fidelidade</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">Transforme cada corte em uma recompensa e mantenha seus clientes sempre por perto.</p>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 mb-1">PROGRAMAS ATIVOS</p>
                        <p className="text-xl font-black text-white">02</p>
                     </div>
                     <Button variant="gold" className="w-full h-12 rounded-2xl font-black shadow-gold" onClick={() => navigate("/painel-dono/gestao")}>Novo Programa</Button>
                  </div>
               </Card>
               
               <div className="lg:col-span-3">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 h-full opacity-90 hover:opacity-100 transition-opacity">
                     <LoyaltyPanel barbershopId={barbershop?.id || ""} isOwner={true} />
                  </div>
               </div>
            </div>
        </div>
    );
};

const CashbackCenter = () => {
    const { barbershop } = useBarbershop();
    const [cashbackStats, setCashbackStats] = useState({ clientesUsaram: 0, taxaRetorno: 0, conversao: 0 });

    useEffect(() => {
      if (!barbershop?.id) return;
      (async () => {
        const { data: apts } = await (supabase as any)
          .from("appointments")
          .select("client_name, status")
          .eq("barbershop_id", barbershop.id)
          .eq("status", "completed");

        const total = apts?.length || 0;
        const uniqueClients = new Set((apts || []).map((a: any) => a.client_name)).size;
        const { data: cashbacks } = await (supabase as any)
          .from("cashback_transactions")
          .select("id, client_user_id")
          .eq("barbershop_id", barbershop.id)
          .eq("status", "used");

        const usaram = new Set((cashbacks || []).map((c: any) => c.client_user_id)).size;
        const taxaRetorno = uniqueClients > 0 ? Math.round((usaram / uniqueClients) * 100) : 0;
        const conversao = total > 0 ? Math.round(((cashbacks?.length || 0) / total) * 100) : 0;
        setCashbackStats({ clientesUsaram: usaram, taxaRetorno: Math.min(taxaRetorno, 100), conversao: Math.min(conversao, 100) });
      })();
    }, [barbershop?.id]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
               <Card className="glass-card p-10 rounded-[2.5rem] border-orange-500/10 lg:col-span-3 animate-in fade-in slide-in-from-left-4 duration-700">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-orange flex items-center justify-center shadow-gold-sm group-hover:scale-110 transition-transform">
                       <Gift className="w-8 h-8 text-white" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase italic">Ativo & Auditado</Badge>
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-4">Motor de <span className="text-gradient-gold">Cashback</span></h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 max-w-lg">
                     Aumente a retenção em até 40% com nossa IA de créditos. Configure a porcentagem que o cliente recebe de volta e veja seu faturamento recorrente escalar.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 md:p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 mb-8">
                     <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Recompensa</p>
                        <p className="text-4xl font-black text-white">5% <span className="text-xs text-emerald-400 ml-1">Ideal</span></p>
                     </div>
                     <div className="h-px w-full sm:h-12 sm:w-px bg-white/5" />
                     <div className="flex-1 w-full">
                        <Button variant="gold" className="w-full rounded-2xl h-14 font-black shadow-gold flex items-center justify-center gap-2" onClick={() => navigate("/painel-dono/configuracoes")}>
                           <Zap size={18} /> Ajustar Estratégia
                        </Button>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4">
                     <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className={`w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white`}>U{i}</div>)}
                     </div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{cashbackStats.clientesUsaram} clientes já usaram este mês</span>
                  </div>
               </Card>

               <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative group overflow-hidden bg-slate-950/20 backdrop-blur-3xl">
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
                     
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <h4 className="text-xl font-black text-white">Performance</h4>
                        <BarChart3 className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                     </div>
                     
                     <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Retorno</span>
                              <span className="text-xl font-black text-white">{cashbackStats.taxaRetorno}%</span>
                           </div>
                           <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                              <div className="h-full bg-gradient-gold shadow-gold-sm transition-all duration-1000" style={{ width: `${cashbackStats.taxaRetorno}%` }} />
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversão Cashback</span>
                              <span className="text-xl font-black text-white">{cashbackStats.conversao}%</span>
                           </div>
                           <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                              <div className="h-full bg-orange-400 shadow-orange-400/20 transition-all duration-1000 delay-300" style={{ width: `${cashbackStats.conversao}%` }} />
                           </div>
                        </div>
                     </div>
                     
                     <p className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center pt-6 border-t border-white/5">Últimos 30 dias de operação</p>
                  </div>
                  
                  <Card className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-950/40 flex items-center gap-6 group hover:border-white/10 transition-premium cursor-pointer" onClick={() => navigate("/painel-dono/comunicacao")}>
                     <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-white/5 flex items-center justify-center transition-premium group-hover:scale-110 group-hover:border-orange-400/30">
                        <Share2 className="w-7 h-7 text-slate-500 group-hover:text-orange-400 transition-colors" />
                     </div>
                     <div className="flex-1">
                        <h4 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">Indique & Ganhe</h4>
                        <p className="text-slate-500 text-xs font-medium leading-tight">Recompense indicações com incentivos automáticos.</p>
                     </div>
                  </Card>
               </div>
            </div>
        </div>
    );
};
