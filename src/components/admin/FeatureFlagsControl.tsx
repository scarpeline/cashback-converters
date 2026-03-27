// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Settings, Rocket, Database, Eye, TrendingUp, Video, Users, Crown } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';

interface FeatureConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
}

const features: FeatureConfig[] = [
  {
    key: 'franchise_system',
    name: 'Sistema de Franquias',
    description: 'Permite cadastro e gestão de franqueados com comissões automáticas',
    icon: Crown,
    category: 'Expansão',
    impact: 'high'
  },
  {
    key: 'master_system',
    name: 'Sistema de Masters',
    description: 'Permite recrutamento de rede de franqueados com comissões em cascata',
    icon: Users,
    category: 'Expansão',
    impact: 'critical',
    dependencies: ['franchise_system']
  },
  {
    key: 'backup_system',
    name: 'Backup Automático',
    description: 'Backup diário criptografado do banco de dados com restauração',
    icon: Database,
    category: 'Segurança',
    impact: 'high'
  },
  {
    key: 'antifraud_system',
    name: 'Sistema Anti-Fraude',
    description: 'Detecção automática de atividades suspeitas e alertas de segurança',
    icon: Shield,
    category: 'Segurança',
    impact: 'critical'
  },
  {
    key: 'growth_intelligence',
    name: 'Inteligência de Crescimento',
    description: 'Análise avançada de métricas e insights para expansão',
    icon: TrendingUp,
    category: 'Inteligência',
    impact: 'medium'
  },
  {
    key: 'advanced_security',
    name: 'Segurança Avançada',
    description: 'Logs de segurança, monitoramento e proteção contra ataques',
    icon: Eye,
    category: 'Segurança',
    impact: 'high'
  },
  {
    key: 'video_sales_pages',
    name: 'Páginas de Venda com Vídeo',
    description: 'Páginas de venda com vídeos configuráveis para franquias',
    icon: Video,
    category: 'Marketing',
    impact: 'medium'
  },
  {
    key: 'commission_system',
    name: 'Sistema de Comissões Avançado',
    description: 'Cálculo automático de comissões em cascata para rede',
    icon: Crown,
    category: 'Financeiro',
    impact: 'high'
  },
  {
    key: 'regional_analysis',
    name: 'Análise Regional',
    description: 'Análise de mercado por cidade/estado com oportunidades',
    icon: TrendingUp,
    category: 'Inteligência',
    impact: 'medium'
  },
  {
    key: 'affiliate_network',
    name: 'Rede de Afiliados Avançada',
    description: 'Gestão completa de rede de afiliados com rastreamento',
    icon: Users,
    category: 'Marketing',
    impact: 'medium'
  }
];

export function FeatureFlagsControl() {
  const { features, loading, toggleFeature } = useFeatureFlags();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    setToggling(featureKey);
    await toggleFeature(featureKey, enabled);
    setToggling(null);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Expansão': return 'bg-purple-500';
      case 'Segurança': return 'bg-red-500';
      case 'Inteligência': return 'bg-blue-500';
      case 'Marketing': return 'bg-green-500';
      case 'Financeiro': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedFeatures = features.reduce((acc, enabled, key) => {
    const feature = features.find(f => f.key === key);
    if (feature) {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push({ ...feature, enabled });
    }
    return acc;
  }, {} as Record<string, (FeatureConfig & { enabled: boolean })[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Controle de Sistema</h2>
          <p className="text-muted-foreground">
            Ative ou desative módulos do sistema de forma segura
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {Object.values(features).filter(Boolean).length} de {features.length} ativos
        </Badge>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Alterações nos módulos afetam todo o sistema. Desative módulos com cuidado para não impactar usuários ativos.
        </AlertDescription>
      </Alert>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
              <CardTitle className="text-lg">{category}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {categoryFeatures.filter(f => f.enabled).length}/{categoryFeatures.length}
              </Badge>
            </div>
            <CardDescription>
              Módulos de {category.toLowerCase()} do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFeatures.map((feature) => {
              const Icon = feature.icon;
              const isToggling = toggling === feature.key;
              const hasUnmetDependencies = feature.dependencies?.some(dep => !features[dep]);

              return (
                <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${feature.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{feature.name}</h3>
                        <Badge className={`text-xs ${getImpactColor(feature.impact)}`}>
                          {feature.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                      {hasUnmetDependencies && (
                        <p className="text-xs text-orange-600 mt-1">
                          Dependências não atendidas: {feature.dependencies?.filter(dep => !features[dep]).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(enabled) => handleToggle(feature.key, enabled)}
                      disabled={isToggling || hasUnmetDependencies}
                    />
                    {isToggling && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Ativação Rápida
          </CardTitle>
          <CardDescription>
            Ative múltiplos módulos de uma vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                features.forEach((enabled, key) => {
                  if (!enabled) {
                    handleToggle(key, true);
                  }
                });
              }}
            >
              Ativar Todos
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                features.forEach((enabled, key) => {
                  if (enabled && key !== 'advanced_security') {
                    handleToggle(key, false);
                  }
                });
              }}
            >
              Desativar Todos (exceto segurança)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
