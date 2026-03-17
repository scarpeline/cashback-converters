// Dashboard de Parceiros - Super Admin
// Integração com IA e automação

import { useState } from 'react';
import { usePartnerStats } from '@/hooks/usePartners';
import { useReactivationCheck } from '@/hooks/useEnhancedAI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Crown,
  MessageCircle,
  Bell,
  Activity,
  Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PartnersDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { stats, isLoading: statsLoading } = usePartnerStats();
  const { data: reactivationStats } = useReactivationCheck('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Parceiros</h1>
          <p className="text-muted-foreground">
            Gerencie afiliados, franqueados e diretores do sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button>
            <MessageCircle className="w-4 h-4 mr-2" />
            Comunicar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Parceiros</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {stats.active} ativos
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                {stats.blocked} bloqueados
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-2xl font-bold text-gradient-gold">
                  R$ {stats.totalEarnings || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Comissões pagas aos parceiros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Indicações</p>
                <p className="text-2xl font-bold">{stats.totalIndicados}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total de clientes indicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reativação</p>
                <p className="text-2xl font-bold">
                  {reactivationStats?.needsReactivation ? '⚠️' : '✅'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Bell className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Parceiros inativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="afiliados" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="franqueados" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Franqueados
          </TabsTrigger>
          <TabsTrigger value="diretores" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Diretores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Rede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Parceiros Ativos</p>
                    <p className="text-xl font-bold">{stats.active}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Bloqueados</p>
                    <p className="text-xl font-bold text-red-500">{stats.blocked}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Afiliados</p>
                    <p className="text-xl font-bold">{stats.byType.afiliado}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Franqueados</p>
                    <p className="text-xl font-bold">{stats.byType.franqueado}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Diretores</p>
                    <p className="text-xl font-bold">{stats.byType.diretor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance da Rede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Distribuição por Tipo</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Taxa de Ativos</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ 
                            width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="afiliados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerencie seus afiliados e acompanhe suas indicações.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="franqueados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Franqueados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerencie seus franqueados e acompanhe suas unidades.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diretores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diretores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerencie seus diretores e acompanhe suas redes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}