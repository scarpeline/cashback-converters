import { useState, useEffect } from "react";
import { useBarbershop } from "./hooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoyaltyPanel } from "@/components/gamification/LoyaltyPanel";

export const GrowthHub = () => {
  const [activeTab, setActiveTab] = useState<"marketing" | "loyalty" | "cashback">("marketing");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Hub de <span className="text-gradient-gold">Crescimento</span>
          </h1>
          <p className="text-slate-400 font-medium">Atraia, fidelize e aumente o faturamento com IA</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          <Button 
            variant={activeTab === "marketing" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("marketing")}
          >
            Marketing
          </Button>
          <Button 
            variant={activeTab === "loyalty" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("loyalty")}
          >
            Fidelidade
          </Button>
          <Button 
            variant={activeTab === "cashback" ? "gold" : "ghost"} 
            size="sm" 
            className="rounded-xl font-bold"
            onClick={() => setActiveTab("cashback")}
          >
            Cashback
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "marketing" && <MarketingCenter />}
        {activeTab === "loyalty" && <LoyaltyCenter />}
        {activeTab === "cashback" && <CashbackCenter />}
      </div>
    </div>
  );
};

const MarketingCenter = () => {
    const { barbershop } = useBarbershop();
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6">
                       <Zap className="w-8 h-8 text-orange-400 opacity-20 group-hover:opacity-100 transition-premium" />
                    </div>
                    <CardHeader className="pb-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atração com IA</p>
                       <CardTitle className="text-xl font-black text-white mt-2">Reativação Inteligente</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Detectamos clientes que não voltam há 30 dias e enviamos uma oferta automática.</p>
                       <Button variant="gold" size="sm" className="w-full mt-6 rounded-xl font-black shadow-gold-sm">Ligar Motor</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card p-6 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6">
                       <Sparkles className="w-8 h-8 text-blue-400 opacity-20 group-hover:opacity-100 transition-premium" />
                    </div>
                    <CardHeader className="pb-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engajamento Social</p>
                       <CardTitle className="text-xl font-black text-white mt-2">Prova Social Auto</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Exiba as melhores avaliações do Google e Instagram diretamente no seu agendamento.</p>
                       <Button variant="ghost" size="sm" className="w-full mt-6 rounded-xl font-black border border-white/5 bg-white/5 hover:bg-white/10 transition-premium">Configurar</Button>
                    </CardContent>
                </Card>

                <Card className="glass-card p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-white/5 shadow-premium">
                    <CardHeader className="pb-2">
                       <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-500/20 text-blue-400 border-none rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase italic">Power Up</Badge>
                       </div>
                       <CardTitle className="text-xl font-black text-white">Pixels & Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Integre Meta, Google e TikTok Pixel para traquear conversões e otimizar anúncios.</p>
                       <Button variant="ghost" size="sm" className="w-full mt-6 rounded-xl font-black border border-white/10 hover:bg-white/5">Gerenciar</Button>
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
                     <Button variant="gold" className="w-full h-12 rounded-2xl font-black shadow-gold">Novo Programa</Button>
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
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="glass-card p-10 rounded-[2.5rem] border-orange-500/10">
                  <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center mb-6 shadow-gold-sm">
                     <Gift className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">Motor de Cashback</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                     Configure uma porcentagem que o cliente recebe de volta em créditos para gastar no próximo serviço.
                     Aumente a retenção em até 40% com o uso estratégico de créditos.
                  </p>
                  
                  <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-[2rem] border border-white/5 mb-8">
                     <div>
                        <p className="text-[10px] font-black text-slate-500 mb-1">PORCENTAGEM ATUAL</p>
                        <p className="text-3xl font-black text-white">5%</p>
                     </div>
                     <div className="flex-1">
                        <Button variant="ghost" className="rounded-xl font-bold text-orange-400 border border-orange-500/20">Alterar Regra</Button>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest italic">Sistema de créditos ativo</span>
                  </div>
               </Card>

               <div className="space-y-6">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative group overflow-hidden">
                     <div className="absolute top-0 right-0 p-8">
                        <TrendingUp className="w-14 h-14 text-white/5 group-hover:text-white/10 transition-colors" />
                     </div>
                     <h4 className="text-xl font-black text-white mb-4">Métricas de Retenção</h4>
                     <div className="space-y-5">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-slate-400">Taxa de Retorno</span>
                           <span className="text-lg font-black text-white">68%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-gold w-[68%]" />
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-slate-400">Tickets com Cashback</span>
                           <span className="text-lg font-black text-white">42%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 w-[42%]" />
                        </div>
                     </div>
                  </div>
                  
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-950/40 flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border border-white/5 flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-slate-500" />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-white">Indique & Ganhe</h4>
                        <p className="text-slate-500 text-xs font-medium">Recompense clientes que trazem novos amigos.</p>
                        <Button variant="ghost" className="mt-2 text-[10px] uppercase font-black tracking-widest text-orange-400 p-0 h-auto hover:bg-transparent">Configurar links</Button>
                     </div>
                  </div>
               </div>
            </div>
        </div>
    );
};
