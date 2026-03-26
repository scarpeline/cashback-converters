import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Gift, TrendingUp } from "lucide-react";

interface LoyaltyPanelProps {
  barbershopId: string;
  userId?: string;
  isOwner?: boolean;
}

const LEVELS = [
  { name: "bronze", min: 0, max: 100, color: "bg-amber-700", label: "🥉 Bronze" },
  { name: "silver", min: 100, max: 500, color: "bg-gray-400", label: "🥈 Prata" },
  { name: "gold", min: 500, max: 1500, color: "bg-yellow-500", label: "🥇 Ouro" },
  { name: "diamond", min: 1500, max: 5000, color: "bg-cyan-400", label: "💎 Diamante" },
];

interface LoyaltyData {
  id: string;
  user_id: string;
  points: number;
  level: string;
  total_earned: number;
  total_redeemed: number;
}

export function LoyaltyPanel({ barbershopId, userId, isOwner = false }: LoyaltyPanelProps) {
  const [data, setData] = useState<LoyaltyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [barbershopId, userId]);

  const loadData = async () => {
    try {
      let query = (supabase as any)
        .from("loyalty_points")
        .select("*")
        .eq("barbershop_id", barbershopId);

      if (!isOwner && userId) {
        query = query.eq("user_id", userId);
      }

      const { data: points } = await query.order("points", { ascending: false }).limit(50);
      setData(points || []);
    } catch (err) {
      console.error("Error loading loyalty:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = (points: number) => {
    return LEVELS.findLast(l => points >= l.min) || LEVELS[0];
  };

  const getNextLevel = (points: number) => {
    return LEVELS.find(l => points < l.max) || LEVELS[LEVELS.length - 1];
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // Single user view
  if (!isOwner && data.length <= 1) {
    const loyalty = data[0];
    if (!loyalty) {
      return (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Programa de fidelidade não iniciado</p>
            <p className="text-sm">Complete seu primeiro agendamento para ganhar pontos!</p>
          </CardContent>
        </Card>
      );
    }

    const level = getCurrentLevel(loyalty.points);
    const nextLevel = getNextLevel(loyalty.points);
    const progress = nextLevel ? ((loyalty.points - level.min) / (nextLevel.max - level.min)) * 100 : 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Programa de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{loyalty.points}</div>
            <p className="text-muted-foreground">pontos</p>
            <Badge className="mt-2">{level.label}</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{level.label}</span>
              <span>{nextLevel?.label || "Max"}</span>
            </div>
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              {nextLevel ? `${nextLevel.max - loyalty.points} pontos para o próximo nível` : "Nível máximo!"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <div className="font-semibold">{loyalty.total_earned}</div>
              <p className="text-xs text-muted-foreground">Total ganhos</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Gift className="w-4 h-4 mx-auto mb-1 text-purple-500" />
              <div className="font-semibold">{loyalty.total_redeemed}</div>
              <p className="text-xs text-muted-foreground">Resgatados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Owner view - ranking
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking de Fidelidade
          <Badge variant="secondary">{data.length} clientes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, idx) => {
            const level = getCurrentLevel(item.points);
            return (
              <div key={item.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">#{idx + 1}</span>
                  <Badge variant="outline">{level.label}</Badge>
                </div>
                <span className="font-semibold">{item.points} pts</span>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhum cliente no programa ainda</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
