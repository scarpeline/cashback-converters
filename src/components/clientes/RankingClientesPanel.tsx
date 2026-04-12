import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy, TrendingUp, DollarSign, Calendar, Star,
  Users, Award, RefreshCw, Crown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type OrderBy = "loyalty_score" | "total_visits" | "total_spent" | "referral_count";

const VIP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  bronze:   { label: "Bronze",   color: "bg-amber-100 text-amber-700 border-amber-200",   icon: "🥉" },
  silver:   { label: "Prata",    color: "bg-slate-100 text-slate-600 border-slate-200",   icon: "🥈" },
  gold:     { label: "Ouro",     color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🥇" },
  diamond:  { label: "Diamante", color: "bg-cyan-100 text-cyan-700 border-cyan-200",       icon: "💎" },
  vip:      { label: "VIP",      color: "bg-purple-100 text-purple-700 border-purple-200", icon: "👑" },
};

const MEDAL = ["🥇", "🥈", "🥉"];

export function RankingClientesPanel() {
  const { barbershop } = useBarbershop();
  const [orderBy, setOrderBy] = useState<OrderBy>("loyalty_score");

  const { data: ranking = [], isLoading, refetch } = useQuery({
    queryKey: ["client-ranking", barbershop?.id, orderBy],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await (supabase as any).rpc("get_client_ranking", {
        p_barbershop_id: barbershop.id,
        p_limit: 50,
        p_order_by: orderBy,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!barbershop?.id,
    staleTime: 2 * 60 * 1000,
  });

  const filters: { key: OrderBy; label: string; icon: React.ReactNode }[] = [
    { key: "loyalty_score", label: "Pontuação",   icon: <Star className="w-3.5 h-3.5" /> },
    { key: "total_visits",  label: "Visitas",     icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: "total_spent",   label: "Faturamento", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: "referral_count",label: "Indicações",  icon: <Users className="w-3.5 h-3.5" /> },
  ];

  const top3 = ranking.slice(0, 3);
  const rest  = ranking.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="font-black text-white text-xl">Ranking de Clientes</h2>
          <Badge className="bg-orange-500/20 text-orange-400 border-none text-xs">{ranking.length} clientes</Badge>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setOrderBy(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              orderBy === f.key
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Nenhum cliente no ranking ainda</p>
          <p className="text-sm mt-1">Os clientes aparecerão aqui após o primeiro agendamento</p>
        </div>
      ) : (
        <>
          {/* Top 3 destaque */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((client: any, i: number) => {
                const vip = VIP_CONFIG[client.vip_level] || VIP_CONFIG.bronze;
                return (
                  <Card key={client.client_user_id} className={`glass-card border-white/10 rounded-[2rem] overflow-hidden ${i === 0 ? "ring-2 ring-yellow-500/40" : ""}`}>
                    <CardContent className="p-5 text-center">
                      <div className="text-3xl mb-2">{MEDAL[i]}</div>
                      <p className="font-black text-white text-base truncate">{client.client_name}</p>
                      <Badge className={`text-[10px] border mt-1 ${vip.color}`}>{vip.icon} {vip.label}</Badge>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/5 rounded-xl p-2">
                          <p className="text-slate-400">Visitas</p>
                          <p className="font-black text-white">{client.total_visits}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2">
                          <p className="text-slate-400">Gasto</p>
                          <p className="font-black text-orange-400">R${Number(client.total_spent).toFixed(0)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span className="font-black">{client.loyalty_score} pts</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Lista restante */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((client: any) => {
                const vip = VIP_CONFIG[client.vip_level] || VIP_CONFIG.bronze;
                return (
                  <div key={client.client_user_id} className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <span className="w-8 text-center font-black text-slate-500 text-sm">#{client.rank_position}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{client.client_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[9px] border px-1.5 py-0 ${vip.color}`}>{vip.icon} {vip.label}</Badge>
                        {client.last_visit_date && (
                          <span className="text-[10px] text-slate-500">
                            Última visita: {format(new Date(client.last_visit_date), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-slate-500">Visitas</p>
                        <p className="font-black text-white">{client.total_visits}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-slate-500">Gasto</p>
                        <p className="font-black text-orange-400">R${Number(client.total_spent).toFixed(0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-500">Pontos</p>
                        <p className="font-black text-yellow-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400" />{client.loyalty_score}
                        </p>
                      </div>
                      {client.referral_count > 0 && (
                        <div className="text-center hidden md:block">
                          <p className="text-slate-500">Indicações</p>
                          <p className="font-black text-green-400">{client.referral_count}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
