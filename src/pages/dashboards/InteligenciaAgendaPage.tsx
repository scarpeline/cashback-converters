/**
 * InteligenciaAgendaPage - Página principal de Inteligência de Agenda
 * 
 * Combina o painel de análise (métricas, previsões, sugestões)
 * com o painel de configurações (fila de espera, preço dinâmico, permissões)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgendaIntelligencePanel as AgendaAnalyticsPanel } from "@/components/agenda/AgendaIntelligencePanel";
import { AgendaIntelligencePanel as AgendaSettingsPanel } from "@/components/waitlist/AgendaIntelligencePanel";
import { useBarbershop } from "@/hooks/useBarbershop";
import { AlertCircle, BarChart3, Settings, Brain } from "lucide-react";

const InteligenciaAgendaPage = () => {
  const { barbershop, loading } = useBarbershop();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Estabelecimento não encontrado</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar as informações do seu estabelecimento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Inteligência de Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Análise avançada e automações para otimizar sua agenda
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Análise & Insights
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AgendaAnalyticsPanel barbershopId={barbershop.id} />
        </TabsContent>

        <TabsContent value="settings">
          <AgendaSettingsPanel barbershopId={barbershop.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteligenciaAgendaPage;
