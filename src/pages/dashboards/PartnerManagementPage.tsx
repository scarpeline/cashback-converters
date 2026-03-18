import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, TrendingUp, DollarSign, Crown, Shield } from 'lucide-react';
import PartnerList from '@/components/partners/PartnerList';
import PartnerForm from '@/components/partners/PartnerForm';
import { usePartnerStats } from '@/hooks/usePartners';

export default function PartnerManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const { stats, isLoading } = usePartnerStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Parceiros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie afiliados, franqueados e diretores do sistema
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Ver Lista' : 'Novo Parceiro'}
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Parceiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">
                  {stats.active} ativos
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Indicados Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIndicados}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de indicações da rede
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Diretores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.byType.diretor}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Coordenadores da rede
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Franqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byType.franqueado}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gerentes de unidades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PartnerForm 
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações</CardTitle>
                <CardDescription>
                  Tipos de parceiros disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">Afiliado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Indica clientes e ganha comissão sobre vendas
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium">Franqueado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gerencia uma unidade e ganha sobre faturamento
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-medium">Diretor</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coordena franqueados e ganha sobre rede
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos os Parceiros</TabsTrigger>
            <TabsTrigger value="afiliados">Afiliados</TabsTrigger>
            <TabsTrigger value="franqueados">Franqueados</TabsTrigger>
            <TabsTrigger value="diretores">Diretores</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <PartnerList showFilters={true} />
          </TabsContent>

          <TabsContent value="afiliados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Afiliados
                </CardTitle>
                <CardDescription>
                  Parceiros que indicam clientes e ganham comissão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartnerList showFilters={false} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="franqueados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Franqueados
                </CardTitle>
                <CardDescription>
                  Gerentes de unidades com faturamento próprio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartnerList showFilters={false} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diretores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Diretores
                </CardTitle>
                <CardDescription>
                  Coordenadores da rede com comissão sobre franqueados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartnerList showFilters={false} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Commission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Sistema de Comissões
          </CardTitle>
          <CardDescription>
            Como funcionam as comissões para cada tipo de parceiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Afiliados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 10% sobre primeira compra do indicado</li>
                <li>• 5% sobre compras recorrentes</li>
                <li>• Pagamento mensal via PIX</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Franqueados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 30% sobre faturamento da unidade</li>
                <li>• 5% sobre indicações de novos franqueados</li>
                <li>• Pagamento quinzenal</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Diretores</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 5% sobre faturamento da rede</li>
                <li>• 10% sobre novos franqueados na região</li>
                <li>• Bônus por metas atingidas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}