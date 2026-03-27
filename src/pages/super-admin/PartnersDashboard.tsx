// Dashboard de Parceiros - Super Admin
// Versão integrada com sistema real (sem dependências inexistentes)

import { usePartnerStats, usePartners } from '@/hooks/usePartners';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Users, TrendingUp, DollarSign, Shield, Crown,
  MessageCircle, Bell, Activity, Download
} from 'lucide-react';
import PartnerList from '@/components/partners/PartnerList';
import { exportPartnersToCSV } from '@/lib/csvExporter';
import { formatCurrency } from '@/lib/formatters';

export default function PartnersDashboard() {
  const { stats, isLoading } = usePartnerStats();
  const { data: partners = [] } = usePartners();

  const totalPago = 0; // campo não existe na tabela partners — placeholder para futuro

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Parceiros</h1>
          <p className="text-muted-foreground">Gerencie afiliados, franqueados e diretores do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPartnersToCSV(partners)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Relatórios
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
              <Badge variant="outline" className="bg-green-500/10 text-green-500">{stats.active} ativos</Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-500">{stats.blocked} bloqueados</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Indicações Totais</p>
                <p className="text-2xl font-bold">{stats.totalIndicados}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total de clientes indicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Afiliados</p>
                <p className="text-2xl font-bold">{stats.byType.afiliado}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Indicam clientes e ganham comissão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Franqueados / Diretores</p>
                <p className="text-2xl font-bold">{stats.byType.franqueado + stats.byType.diretor}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Crown className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.byType.franqueado} franqueados · {stats.byType.diretor} diretores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
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
            <CardHeader><CardTitle>Performance da Rede</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Distribuição por Tipo</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-6 text-right">{count}</span>
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
                        style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="afiliados">
          <PartnerList showFilters={false} filterByType="afiliado" />
        </TabsContent>

        <TabsContent value="franqueados">
          <PartnerList showFilters={false} filterByType="franqueado" />
        </TabsContent>

        <TabsContent value="diretores">
          <PartnerList showFilters={false} filterByType="diretor" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
