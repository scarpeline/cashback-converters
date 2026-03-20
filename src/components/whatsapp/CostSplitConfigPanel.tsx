import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Users, Percent, DollarSign, Save } from 'lucide-react';
import {
  getAllCostSplits,
  setCostSplit,
  bulkSetCostSplits,
  getProfessionalCostShare,
  CostSplitConfig,
} from '@/services/costSplitService';
import { supabase } from '@/integrations/supabase/client';

interface CostSplitConfigPanelProps {
  barbershopId: string;
}

interface ProfessionalWithShare extends CostSplitConfig {
  total_cost_share?: number;
  cost_limit_exceeded?: boolean;
}

export function CostSplitConfigPanel({ barbershopId }: CostSplitConfigPanelProps) {
  const { toast } = useToast();
  const [configurations, setConfigurations] = useState<ProfessionalWithShare[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    split_enabled: true,
    split_percentage_owner: 50,
    selected_professionals: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configs, profs] = await Promise.all([
        getAllCostSplits(barbershopId),
        supabase
          .from('professionals')
          .select('id, name')
          .eq('barbershop_id', barbershopId)
          .eq('is_active', true),
      ]);

      setProfessionals(profs.data || []);

      const configsWithCosts = await Promise.all(
        configs.map(async (config) => {
          const totalCost = await getProfessionalCostShare(barbershopId, config.professional_id);
          return {
            ...config,
            total_cost_share: totalCost,
            cost_limit_exceeded: config.professional_cost_limit
              ? totalCost > config.professional_cost_limit
              : false,
          };
        })
      );

      setConfigurations(configsWithCosts);

      const configuredIds = configs.map((c) => c.professional_id);
      const unconfigured = (profs.data || []).filter((p) => !configuredIds.includes(p.id));

      const unconfiguredConfigs = unconfigured.map((p) => ({
        professional_id: p.id,
        professional_name: p.name,
        split_enabled: false,
        split_percentage_owner: 50,
        split_percentage_professional: 50,
        total_cost_share: 0,
        cost_limit_exceeded: false,
      }));

      setConfigurations((prev) => [...prev, ...unconfiguredConfigs]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar configurações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (config: ProfessionalWithShare) => {
    setSaving(true);
    try {
      const result = await setCostSplit({
        barbershop_id: barbershopId,
        professional_id: config.professional_id,
        split_enabled: config.split_enabled,
        split_percentage_owner: config.split_percentage_owner,
        split_percentage_professional: 100 - config.split_percentage_owner,
        owner_cost_limit: config.owner_cost_limit,
        professional_cost_limit: config.professional_cost_limit,
      });

      if (result.success) {
        toast({ title: 'Configuração salva!', description: `Divisão de custos para ${config.professional_name} atualizada` });
        loadData();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar configuração', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (bulkConfig.selected_professionals.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um profissional', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await bulkSetCostSplits({
        barbershop_id: barbershopId,
        professional_ids: bulkConfig.selected_professionals,
        split_enabled: bulkConfig.split_enabled,
        split_percentage_owner: bulkConfig.split_percentage_owner,
      });

      toast({
        title: 'Configuração em massa',
        description: `${result.success} profissionais atualizados, ${result.failed} falharam`,
      });
      setBulkMode(false);
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao aplicar configuração em massa', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleProfessional = (id: string) => {
    setBulkConfig((prev) => ({
      ...prev,
      selected_professionals: prev.selected_professionals.includes(id)
        ? prev.selected_professionals.filter((p) => p !== id)
        : [...prev.selected_professionals, id],
    }));
  };

  const selectAll = () => {
    setBulkConfig((prev) => ({
      ...prev,
      selected_professionals: configurations.map((c) => c.professional_id),
    }));
  };

  const deselectAll = () => {
    setBulkConfig((prev) => ({
      ...prev,
      selected_professionals: [],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Divisão de Custos</h2>
          <p className="text-muted-foreground">Configure como os custos de mensagens são divididos entre Dono e Profissionais</p>
        </div>
        <div className="flex gap-2">
          <Button variant={bulkMode ? 'default' : 'outline'} onClick={() => setBulkMode(!bulkMode)}>
            <Users className="w-4 h-4 mr-2" /> Configuração em Massa
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {bulkMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Configuração em Massa</CardTitle>
            <CardDescription>Aplique a mesma configuração para vários profissionais de uma vez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  checked={bulkConfig.split_enabled}
                  onCheckedChange={(checked) => setBulkConfig((prev) => ({ ...prev, split_enabled: checked }))}
                />
                <Label>Ativar divisão de custos</Label>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Dono: {bulkConfig.split_percentage_owner}%</span>
                <span className="text-sm text-muted-foreground">Profissional: {100 - bulkConfig.split_percentage_owner}%</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Porcentagem para Dono</Label>
              <Slider
                value={[bulkConfig.split_percentage_owner]}
                onValueChange={([v]) => setBulkConfig((prev) => ({ ...prev, split_percentage_owner: v }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0% (100% profissional)</span>
                <span>50%</span>
                <span>100% (100% dono)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Selecionar Profissionais</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Selecionar Todos</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>Desmarcar Todos</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {configurations.map((config) => (
                  <div
                    key={config.professional_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      bulkConfig.selected_professionals.includes(config.professional_id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleProfessional(config.professional_id)}
                  >
                    <p className="font-medium text-sm">{config.professional_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.split_enabled ? `${config.split_percentage_owner}% dono` : 'Não dividido'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkMode(false)}>Cancelar</Button>
              <Button onClick={handleBulkSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Aplicar a {bulkConfig.selected_professionals.length} Profissionais
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configurations.map((config) => (
            <Card key={config.professional_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      config.split_enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Percent className={`w-5 h-5 ${config.split_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{config.professional_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Custo total: R$ {config.total_cost_share?.toFixed(2) || '0.00'}
                        {config.cost_limit_exceeded && (
                          <Badge variant="destructive" className="ml-2">Limite excedido</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.split_enabled}
                      onCheckedChange={(checked) => {
                        setConfigurations((prev) =>
                          prev.map((c) =>
                            c.professional_id === config.professional_id
                              ? { ...c, split_enabled: checked }
                              : c
                          )
                        );
                      }}
                    />
                  </div>
                </div>

                {config.split_enabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Porcentagem para Dono</span>
                        <span className="font-medium">{config.split_percentage_owner}%</span>
                      </div>
                      <Slider
                        value={[config.split_percentage_owner]}
                        onValueChange={([v]) => {
                          setConfigurations((prev) =>
                            prev.map((c) =>
                              c.professional_id === config.professional_id
                                ? { ...c, split_percentage_owner: v, split_percentage_professional: 100 - v }
                                : c
                            )
                          );
                        }}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Limite para Dono (R$)</Label>
                        <Input
                          type="number"
                          step={0.01}
                          placeholder="Sem limite"
                          value={config.owner_cost_limit || ''}
                          onChange={(e) => {
                            setConfigurations((prev) =>
                              prev.map((c) =>
                                c.professional_id === config.professional_id
                                  ? { ...c, owner_cost_limit: e.target.value ? parseFloat(e.target.value) : undefined }
                                  : c
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Limite para Profissional (R$)</Label>
                        <Input
                          type="number"
                          step={0.01}
                          placeholder="Sem limite"
                          value={config.professional_cost_limit || ''}
                          onChange={(e) => {
                            setConfigurations((prev) =>
                              prev.map((c) =>
                                c.professional_id === config.professional_id
                                  ? { ...c, professional_cost_limit: e.target.value ? parseFloat(e.target.value) : undefined }
                                  : c
                              )
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => handleSaveConfig(config)} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" /> Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
