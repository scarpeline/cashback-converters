import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Users, TrendingUp, CheckCircle, Clock,
  RefreshCw, Percent, Edit2, Save, X,
} from "lucide-react";

interface ProfComissao {
  id: string;
  name: string;
  commission_percentage: number;
  avatar_url?: string;
  total_appointments?: number;
  total_earned?: number;
  pending_payout?: number;
}

export function ComissaoDetalhadaPanel() {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState("");

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals-commission", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data: profs } = await (supabase as any)
        .from("professionals")
        .select("id, name, commission_percentage, avatar_url")
        .eq("barbershop_id", barbershop.id)
        .eq("is_active", true)
        .order("name");

      if (!profs) return [];

      // Busca totais de agendamentos e valores
      const enriched = await Promise.all(profs.map(async (p: any) => {
        const { data: apts } = await (supabase as any)
          .from("appointments")
          .select("id, total_price, status")
          .eq("professional_id", p.id)
          .eq("status", "completed");

        const total = (apts || []).reduce((s: number, a: any) => s + (Number(a.total_price) || 0), 0);
        const earned = total * (p.commission_percentage / 100);

        const { data: payouts } = await (supabase as any)
          .from("payouts")
          .select("amount, status")
          .eq("professional_id", p.id)
          .eq("status", "pending");

        const pending = (payouts || []).reduce((s: number, pw: any) => s + (Number(pw.amount) || 0), 0);

        return {
          ...p,
          total_appointments: (apts || []).length,
          total_earned: earned,
          pending_payout: pending,
        };
      }));

      return enriched as ProfComissao[];
    },
    enabled: !!barbershop?.id,
  });

  const totalEarned = professionals.reduce((s, p) => s + (p.total_earned || 0), 0);
  const totalPending = professionals.reduce((s, p) => s + (p.pending_payout || 0), 0);

  const saveCommission = async (id: string) => {
    const pct = parseFloat(editPct);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Percentual inválido (0-100)"); return; }
    const { error } = await (supabase as any).from("professionals").update({ commission_percentage: pct }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Comissão atualizada!");
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ["professionals-commission"] });
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-white/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Profissionais</p>
              <p className="text-xl font-black text-white">{professionals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Comissões</p>
              <p className="text-xl font-black text-green-400">R${totalEarned.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">A Pagar</p>
              <p className="text-xl font-black text-yellow-400">R${totalPending.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>Nenhum profissional cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map(prof => (
            <div key={prof.id} className="flex items-center gap-4 px-5 py-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {prof.avatar_url
                  ? <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-sm">{prof.name[0]}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{prof.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                  <span>{prof.total_appointments} atendimentos</span>
                  <span className="text-green-400 font-semibold">R${(prof.total_earned || 0).toFixed(2)} ganhos</span>
                  {(prof.pending_payout || 0) > 0 && (
                    <span className="text-yellow-400 font-semibold">R${(prof.pending_payout || 0).toFixed(2)} pendente</span>
                  )}
                </div>
              </div>

              {/* Comissão */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === prof.id ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type="number" min="0" max="100" step="0.5"
                        value={editPct}
                        onChange={e => setEditPct(e.target.value)}
                        className="w-20 h-8 text-sm text-center pr-6 bg-slate-800 border-slate-600 text-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                    </div>
                    <button onClick={() => saveCommission(prof.id)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-black text-sm px-3">
                      <Percent className="w-3 h-3 mr-1" />{prof.commission_percentage}%
                    </Badge>
                    <button
                      onClick={() => { setEditingId(prof.id); setEditPct(String(prof.commission_percentage)); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
