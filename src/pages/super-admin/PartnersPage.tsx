// Página de gerenciamento de parceiros - Super Admin
// Integração com estrutura existente

import { useState } from 'react';
import { usePartnerStats, usePartners } from '@/hooks/usePartners';
import PartnerList from '@/components/partners/PartnerList';
import PartnerForm from '@/components/partners/PartnerForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Shield, 
  Crown,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { exportPartnersToCSV } from '@/lib/csvExporter';

export default function PartnersPage() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { stats, isLoading: statsLoading } = usePartnerStats();
  const { data: allPartners = [] } = usePartners();

  const handleExport = () => {
    exportPartnersToCSV(allPartners);
  };

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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Parceiro
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
                <p className="text-sm text-muted-foreground">Afiliados</p>
                <p className="text-2xl font-bold">{stats.byType.afiliado}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Indicam clientes e ganham comissão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Franqueados</p>
                <p className="text-2xl font-bold">{stats.byType.franqueado}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Gerenciam unidades e faturamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Diretores</p>
                <p className="text-2xl font-bold">{stats.byType.diretor}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Crown className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Coordenam rede e ganham sobre rede
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Rede de Indicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold text-gradient-gold">
                {stats.totalIndicados}
              </p>
              <p className="text-sm text-muted-foreground">Indicações Totais</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">
                {stats.total > 0 ? (stats.totalIndicados / stats.total).toFixed(1) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Média por Parceiro</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-3xl font-bold">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa de Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="afiliado" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="franqueado" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Franqueados
          </TabsTrigger>
          <TabsTrigger value="diretor" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Diretores
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <PartnerList showFilters={true} />
        </TabsContent>

        <TabsContent value="afiliado" className="space-y-4">
          <PartnerList showFilters={false} filterByType="afiliado" />
        </TabsContent>

        <TabsContent value="franqueado" className="space-y-4">
          <PartnerList showFilters={false} filterByType="franqueado" />
        </TabsContent>

        <TabsContent value="diretor" className="space-y-4">
          <PartnerList showFilters={false} filterByType="diretor" />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise da Rede</CardTitle>
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
                  <h3 className="font-semibold mb-2">Status da Rede</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                      <p className="text-sm text-muted-foreground">Ativos</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-red-500">{stats.blocked}</p>
                      <p className="text-sm text-muted-foreground">Bloqueados</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    A rede possui <strong>{stats.totalIndicados}</strong> indicações totais, 
                    com uma média de <strong>
                      {stats.total > 0 ? (stats.totalIndicados / stats.total).toFixed(1) : 0}
                    </strong> indicações por parceiro.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>
                      {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
                    </strong> dos parceiros estão ativos e gerando resultados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Partner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Novo Parceiro</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                >
                  ✕
                </Button>
              </div>
              <PartnerForm
                onSuccess={() => {
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}