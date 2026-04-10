import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  X,
  Target,
  Zap,
  ArrowRight,
  ShieldCheck,
  User,
  History
} from 'lucide-react';
import { useClientReactivation } from '@/hooks/useClientReactivation';
import { useToast } from '@/hooks/use-toast';
import type { InactiveClient } from '@/services/clientReactivationService';
import { Badge } from '@/components/ui/badge';
import { HubSkeleton } from '@/components/ui/SkeletonHub';

export function ClientReactivationDashboard() {
  const {
    inactiveClients,
    stats,
    loading,
    error,
    campaignRunning,
    fetchInactiveClients,
    fetchStats,
    sendMessage,
    runCampaign,
    trackResponse,
  } = useClientReactivation();

  const { toast } = useToast();
  const [daysInactive, setDaysInactive] = useState('30');
  const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleRunCampaign = async () => {
    try {
      const result = await runCampaign(parseInt(daysInactive), 50);
      toast({
        title: 'Campanha Diamond Executada',
        description: `${result.sent} mensagens enviadas com sucesso.`,
      });
    } catch (err) {
      toast({
        title: 'Erro Crítico',
        description: 'Falha ao processar campanha de reativação.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (client: InactiveClient) => {
    try {
      setSendingMessage(true);
      const result = await sendMessage(client, customMessage || undefined);
      
      if (result.success) {
        toast({
          title: 'Impacto Direto',
          description: 'Mensagem VIP enviada via WhatsApp.',
        });
        setSelectedClient(null);
        setCustomMessage('');
      }
    } catch (err) {
      toast({
        title: 'Erro de Disparo',
        description: 'Falha ao enviar mensagem personalizada.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading && !inactiveClients.length) return <HubSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-10 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-premium">
                <Target className="w-5 h-5 text-orange-400" />
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">Recuperação <span className="text-gradient-gold">Forense</span></h1>
          </div>
          <p className="text-slate-500 font-medium italic mt-2 opacity-70">Detectar e reativar clientes em risco de Churn com inteligência Diamond</p>
        </div>
        <Button
          onClick={handleRunCampaign}
          disabled={campaignRunning || loading}
          className="h-16 px-10 rounded-[1.8rem] bg-gradient-gold text-black font-black uppercase text-xs tracking-[0.2em] shadow-gold-xl active:scale-95 transition-all flex items-center gap-4 group"
        >
          {campaignRunning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-black group-hover:rotate-12 transition-transform" />}
          {campaignRunning ? 'Sincronizando...' : 'Executar Campanha Diamond'}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Campanhas" value={stats.total_campaigns} icon={<History size={18} className="text-slate-400" />} />
          <StatCard label="Mensagens VIP" value={stats.total_sent} icon={<MessageSquare size={18} className="text-orange-400" />} />
          <StatCard label="Taxa de Retorno" value={`${stats.success_rate}%`} icon={<TrendingUp size={18} className="text-emerald-400" />} color="text-emerald-400" />
          <StatCard label="Clientes em Risco" value={inactiveClients.length} icon={<Users size={18} className="text-rose-400" />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Filter Card */}
         <Card className="lg:col-span-4 glass-card rounded-[3rem] border-white/5 bg-slate-900/30 backdrop-blur-3xl p-8 h-fit sticky top-8">
            <CardHeader className="p-0 mb-8 border-b border-white/5 pb-6">
               <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Parâmetros de Análise</CardTitle>
               <CardDescription className="text-slate-500 font-medium text-xs mt-2 uppercase tracking-widest">Ajuste o rigor da retenção</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Janela de Inatividade (Dias)</label>
                  <div className="relative group/input">
                    <Input
                        type="number"
                        value={daysInactive}
                        onChange={(e) => setDaysInactive(e.target.value)}
                        className="bg-white/5 border-white/10 h-16 rounded-[1.4rem] text-white font-black text-lg px-6 focus-visible:ring-orange-500/20 transition-all text-center"
                    />
                    <Zap className="absolute right-5 top-5 w-5 h-5 text-orange-500/20 group-focus-within/input:text-orange-500 transition-colors" />
                  </div>
               </div>
               <Button
                onClick={() => fetchInactiveClients(parseInt(daysInactive), 100)}
                disabled={loading}
                variant="ghost"
                className="w-full h-14 rounded-2xl border border-white/5 bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-slate-800 transition-all gap-3"
               >
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 Atualizar Base Forense
               </Button>
               <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-emerald-500/60 font-black uppercase text-[9px] tracking-widest">
                     <ShieldCheck size={14} /> Filtro de Qualidade Ativo
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Clients List */}
         <Card className="lg:col-span-8 glass-card rounded-[3rem] border-white/5 bg-slate-900/10 backdrop-blur-3xl overflow-hidden min-h-[600px]">
           <CardHeader className="px-10 py-10 border-b border-white/5 bg-slate-900/40">
             <CardTitle className="flex items-center gap-4 text-2xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
               Base Radiante ({inactiveClients.length})
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium">Clientes ausentes há {daysInactive} dias ou mais analisados pelo sistema.</CardDescription>
           </CardHeader>
           <CardContent className="p-4 md:p-8 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
             {inactiveClients.length === 0 ? (
               <div className="text-center py-20 animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Users className="w-10 h-10 text-slate-700 opacity-20" />
                 </div>
                 <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Nenhum cliente em risco encontrado para esta janela.</p>
               </div>
             ) : (
               inactiveClients.map((client, idx) => (
                 <div
                   key={client.id}
                   style={{ animationDelay: `${idx * 100}ms` }}
                   className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-900/50 border border-white/5 rounded-[2.5rem] hover:border-orange-500/30 hover:bg-slate-900/80 transition-all duration-700 group animate-in slide-in-from-bottom"
                 >
                   <div className="flex items-center gap-6 flex-1 mb-6 md:mb-0">
                      <div className="w-16 h-16 rounded-[1.4rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:rotate-6 transition-transform">
                         {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover" /> : <User className="text-slate-600 w-7 h-7" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-white text-xl tracking-tight leading-none group-hover:translate-x-1 transition-transform">{client.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <span className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/5 px-3 py-1 rounded-full border border-rose-500/10 shadow-premium">
                             <Clock className="w-3 h-3" /> {client.days_inactive} dias inativo
                          </span>
                          <span className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             <MessageSquare className="w-3 h-3" /> {client.total_visits} visitas
                          </span>
                          <span className="flex items-center gap-2 text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">
                             <TrendingUp className="w-3 h-3" /> Avg: R$ {client.average_ticket.toFixed(2)}
                          </span>
                        </div>
                      </div>
                   </div>
                   <Button
                     onClick={() => setSelectedClient(client)}
                     variant="ghost"
                     className="h-14 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-white hover:border-orange-500/30 hover:bg-orange-500/5 transition-all gap-4 px-8 w-full md:w-auto"
                   >
                     <Send className="w-4 h-4" />
                     Enviar VIP Direct
                   </Button>
                 </div>
               ))
             )}
           </CardContent>
         </Card>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
          <Card className="w-full max-w-lg glass-card border-white/10 bg-slate-950/80 rounded-[3rem] shadow-premium overflow-hidden">
            <CardHeader className="text-center pt-10 pb-6 border-b border-white/5 bg-slate-900/40">
               <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Send className="w-7 h-7 text-orange-400" />
               </div>
               <CardTitle className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Impacto Direto</CardTitle>
               <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-3">Sessão protegida para {selectedClient.name}</CardDescription>
               <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-6 top-6 text-slate-500 hover:text-white"
                  onClick={() => {
                    setSelectedClient(null);
                    setCustomMessage('');
                  }}
                >
                  <X className="w-6 h-6" />
                </Button>
            </CardHeader>
            <CardContent className="p-10 space-y-8 relative">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><ArrowRight size={12} className="text-orange-500" /> Mensagem Customizada Diamond</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Deixe em branco para usar o tom de voz Elite Automático..."
                  className="min-h-[160px] bg-white/5 border-white/10 rounded-2xl text-white font-medium p-6 focus-visible:ring-orange-500/20 text-lg leading-relaxed placeholder:italic placeholder:opacity-30"
                />
                <div className="flex items-center justify-between px-2 pt-2">
                   <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Destino: {selectedClient.whatsapp}</p>
                   <Badge className="bg-emerald-500/10 text-emerald-400 border-none rounded-full px-3 py-1 font-black text-[8px] uppercase tracking-widest italic">Sincronizado via Asaas</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => handleSendMessage(selectedClient)}
                  disabled={sendingMessage}
                  className="w-full h-18 rounded-[1.8rem] bg-gradient-gold text-black font-black uppercase text-xs tracking-[0.2em] shadow-gold-xl active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {sendingMessage ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-black" />}
                  {sendingMessage ? 'Sincronizando Gateway...' : 'Disparar Impacto VIP'}
                </Button>
                
                <p className="text-[8px] text-center text-slate-700 font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-4">
                   <div className="h-px bg-white/5 flex-1" /> OPERAÇÃO PROTEGIDA SSL <div className="h-px bg-white/5 flex-1" />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-white" }: any) {
  return (
    <Card className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-900/20 backdrop-blur-3xl group overflow-hidden hover:bg-slate-900/40 transition-all duration-700">
       <div className="flex items-center justify-between mb-6 relative z-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:rotate-12 transition-transform shadow-premium">
             {icon}
          </div>
       </div>
       <p className={`text-4xl font-black ${color} tracking-tighter italic relative z-10 group-hover:translate-x-1 transition-transform`}>{value}</p>
       <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-gold opacity-0 group-hover:opacity-5 blur-3xl transition-opacity" />
    </Card>
  );
}
