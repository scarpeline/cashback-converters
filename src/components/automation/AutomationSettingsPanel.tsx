import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Calendar, 
  Bell, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Users,
  BarChart3,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";

interface AutomationSettings {
  blockIfHasAppointment: boolean;
  blockOnlyConfirmed: boolean;
  enableLogging: boolean;
  notifyOnBlock: boolean;
}

interface BlockedLog {
  id: string;
  automation_type: string;
  block_reason: string;
  created_at: string;
  client_name?: string;
}

export const AutomationSettingsPanel = () => {
  const { barbershop } = useBarbershop();
  const [settings, setSettings] = useState<AutomationSettings>({
    blockIfHasAppointment: true,
    blockOnlyConfirmed: false,
    enableLogging: true,
    notifyOnBlock: false
  });
  const [saving, setSaving] = useState(false);
  const [blockedLogs, setBlockedLogs] = useState<BlockedLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (barbershop?.automation_schedule) {
      const parsed = typeof barbershop.automation_schedule === 'object' 
        ? barbershop.automation_schedule as any 
        : {};
      
      setSettings({
        blockIfHasAppointment: parsed.blockIfHasAppointment ?? true,
        blockOnlyConfirmed: parsed.blockOnlyConfirmed ?? false,
        enableLogging: parsed.enableLogging ?? true,
        notifyOnBlock: parsed.notifyOnBlock ?? false
      });
    }
  }, [barbershop]);

  const loadBlockedLogs = async () => {
    if (!barbershop?.id) return;
    
    setLoadingLogs(true);
    try {
      const { data, error } = await db
        .from('automation_blocked_logs')
        .select(`
          *,
          profiles:client_id(name)
        `)
        .eq('barbershop_id', barbershop.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const formattedLogs = (data || []).map(log => ({
        ...log,
        client_name: (log as any).profiles?.name || 'Cliente'
      }));
      
      setBlockedLogs(formattedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs de bloqueio:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveSettings = async () => {
    if (!barbershop?.id) {
      toast.error('Barbearia não encontrada');
      return;
    }

    setSaving(true);
    try {
      const currentSchedule = typeof barbershop.automation_schedule === 'object' 
        ? barbershop.automation_schedule as any 
        : {};

      const newSchedule = {
        ...currentSchedule,
        ...settings
      };

      const { error } = await supabase
        .from('barbershops')
        .update({ automation_schedule: newSchedule })
        .eq('id', barbershop.id);

      if (error) throw error;

      toast.success('Configurações de automação salvas!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const last7Days = blockedLogs.filter(log => {
      const logDate = new Date(log.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });

    const byType = last7Days.reduce((acc, log) => {
      acc[log.automation_type] = (acc[log.automation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total: last7Days.length, byType };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Estatísticas de Bloqueio */}
      {settings.blockIfHasAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Automações Bloqueadas (Últimos 7 dias)
            </CardTitle>
            <CardDescription>
              Visualize o impacto das regras de bloqueio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total bloqueado</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total > 0 ? Math.round((1 - stats.total / 100) * 100) : 100}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de entrega</div>
              </div>
            </div>

            {Object.keys(stats.byType).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Por tipo de automação:</Label>
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setShowLogs(!showLogs);
                if (!showLogs) loadBlockedLogs();
              }}
              className="w-full mt-4"
            >
              {showLogs ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showLogs ? 'Ocultar Logs' : 'Ver Logs Detalhados'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Logs Detalhados */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle>Logs de Bloqueio Detalhados</CardTitle>
            <CardDescription>
              Histórico de automações bloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : blockedLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <p>Nenhuma automação bloqueada no período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.automation_type}</Badge>
                        <span className="font-medium">{log.client_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.block_reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Automações que SEMPRE funcionam:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Lembretes de agendamento (24h, 12h, 7h, 5h, 2h, 1h antes)</li>
              <li>• Confirmação de agendamento</li>
              <li>• Avisos de alteração de horário</li>
              <li>• Mensagens de cancelamento ou reagendamento</li>
            </ul>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">🚫 Automações que podem ser bloqueadas:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Campanhas de marketing</li>
              <li>• Reativação de clientes inativos</li>
              <li>• Mensagens promocionais</li>
              <li>• Agradecimento pós-atendimento</li>
              <li>• Disparos em massa</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Automação
          </CardTitle>
          <CardDescription>
            Controle quando as automações devem ser enviadas para evitar spam em clientes já agendados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <Label className="font-medium">Bloquear automações para clientes com agendamento na semana</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Evita enviar campanhas e lembretes para clientes que já têm horário marcado
                </p>
              </div>
            </div>
            <Switch
              checked={settings.blockIfHasAppointment}
              onCheckedChange={(checked) => setSettings({ ...settings, blockIfHasAppointment: checked })}
            />
          </div>

          {settings.blockIfHasAppointment && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <Label className="font-medium">Bloquear apenas agendamentos confirmados</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clientes com agendamentos pendentes ainda receberão automações
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.blockOnlyConfirmed}
                onCheckedChange={(checked) => setSettings({ ...settings, blockOnlyConfirmed: checked })}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <div>
                <Label className="font-medium">Registrar logs de bloqueio</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Salva histórico de quando automações foram bloqueadas para análise
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableLogging}
              onCheckedChange={(checked) => setSettings({ ...settings, enableLogging: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <div>
                <Label className="font-medium">Notificar sobre bloqueios</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba alertas quando automações forem bloqueadas
                </p>
              </div>
            </div>
            <Switch
              checked={settings.notifyOnBlock}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnBlock: checked })}
            />
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
