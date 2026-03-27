import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { HardDrive, Image, FileText, Video, Music, AlertTriangle, RefreshCw, Loader2, Trash2 } from "lucide-react";

interface StorageUsage {
  category: string;
  used_mb: number;
  file_count: number;
  icon: React.ReactNode;
  color: string;
}

interface PlanLimits {
  plan_name: string;
  storage_limit_mb: number;
  image_limit_mb: number;
  video_limit_mb: number;
}

const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  starter: { plan_name: "Starter", storage_limit_mb: 500, image_limit_mb: 300, video_limit_mb: 100 },
  profissional: { plan_name: "Profissional", storage_limit_mb: 2048, image_limit_mb: 1024, video_limit_mb: 512 },
  premium: { plan_name: "Premium", storage_limit_mb: 10240, image_limit_mb: 5120, video_limit_mb: 2048 },
  enterprise: { plan_name: "Enterprise", storage_limit_mb: 51200, image_limit_mb: 20480, video_limit_mb: 10240 },
};

interface Props {
  barbershopId: string;
  planKey?: keyof typeof DEFAULT_LIMITS;
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function usagePercent(used: number, limit: number) {
  return Math.min(100, (used / limit) * 100);
}

function progressColor(pct: number) {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-orange-500";
  return "bg-green-500";
}

export function StorageControlPanel({ barbershopId, planKey = "profissional" }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usages, setUsages] = useState<StorageUsage[]>([]);
  const [totalUsedMB, setTotalUsedMB] = useState(0);
  const limits = DEFAULT_LIMITS[planKey] ?? DEFAULT_LIMITS.profissional;

  const loadStorageUsage = async () => {
    if (!barbershopId) return;
    try {
      // Busca arquivos de cada bucket do barbershop
      const buckets = [
        { bucket: "barbershop-images", label: "Imagens", icon: <Image className="w-4 h-4" />, color: "blue" },
        { bucket: "service-photos", label: "Fotos de Serviços", icon: <Image className="w-4 h-4" />, color: "purple" },
        { bucket: "marketing-videos", label: "Vídeos de Marketing", icon: <Video className="w-4 h-4" />, color: "red" },
        { bucket: "documents", label: "Documentos", icon: <FileText className="w-4 h-4" />, color: "yellow" },
        { bucket: "audio-messages", label: "Áudios IA", icon: <Music className="w-4 h-4" />, color: "green" },
      ];

      const results: StorageUsage[] = [];
      let totalMB = 0;

      for (const b of buckets) {
        try {
          const { data: files } = await supabase.storage
            .from(b.bucket)
            .list(barbershopId, { limit: 1000 });

          if (files) {
            const usedBytes = files.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
            const usedMB = usedBytes / (1024 * 1024);
            totalMB += usedMB;
            results.push({
              category: b.label,
              used_mb: usedMB,
              file_count: files.length,
              icon: b.icon,
              color: b.color,
            });
          }
        } catch {
          // bucket pode não existir, ignorar silenciosamente
          results.push({ category: b.label, used_mb: 0, file_count: 0, icon: b.icon, color: b.color });
        }
      }

      setUsages(results);
      setTotalUsedMB(totalMB);
    } catch (err) {
      console.error("[StorageControl] erro ao carregar:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadStorageUsage(); }, [barbershopId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStorageUsage();
  };

  const totalPct = usagePercent(totalUsedMB, limits.storage_limit_mb);
  const isOverLimit = totalUsedMB >= limits.storage_limit_mb;
  const isWarning = totalPct >= 80;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-primary" />
            Controle de Armazenamento
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Plano <strong>{limits.plan_name}</strong> · Limite: {formatMB(limits.storage_limit_mb)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Atualizar
        </Button>
      </div>

      {/* Resumo geral */}
      <Card className={isOverLimit ? "border-red-500/50 bg-red-500/5" : isWarning ? "border-orange-500/50 bg-orange-500/5" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Uso Total</CardTitle>
            {isOverLimit && (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Limite atingido
              </Badge>
            )}
            {isWarning && !isOverLimit && (
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Quase no limite
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calculando uso...</span>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between text-sm mb-1">
                <span className="font-semibold text-lg">{formatMB(totalUsedMB)}</span>
                <span className="text-muted-foreground">de {formatMB(limits.storage_limit_mb)}</span>
              </div>
              <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor(totalPct)}`}
                  style={{ width: `${totalPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{totalPct.toFixed(1)}% utilizado</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento por categoria */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usages.map((u) => {
            const pct = usagePercent(u.used_mb, limits.storage_limit_mb / usages.length);
            return (
              <Card key={u.category}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-${u.color}-500/10 flex items-center justify-center`}>
                        <span className={`text-${u.color}-500`}>{u.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.category}</p>
                        <p className="text-xs text-muted-foreground">{u.file_count} arquivo{u.file_count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatMB(u.used_mb)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor(pct)}`}
                      style={{ width: `${Math.min(100, (u.used_mb / (limits.storage_limit_mb / usages.length)) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Aviso de limite */}
      {isOverLimit && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-500 text-sm">Armazenamento esgotado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Novos uploads estão bloqueados. Faça upgrade do plano ou remova arquivos não utilizados para continuar.
              </p>
              <Button size="sm" className="mt-3 bg-red-500 hover:bg-red-600 text-white">
                Fazer upgrade do plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de otimização */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dicas para economizar espaço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "Comprima imagens antes de fazer upload (recomendado: máx. 500KB por foto)",
            "Remova fotos duplicadas ou não utilizadas em serviços inativos",
            "Vídeos de marketing devem ter no máximo 50MB cada",
            "Audios de IA são gerados automaticamente e podem ser limpos periodicamente",
          ].map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary font-bold shrink-0">•</span>
              {tip}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
