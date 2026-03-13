/**
 * InteligenciaAgendaPage - Página principal de Inteligência de Agenda
 * 
 * Wrapper para o AgendaIntelligencePanel com verificação de permissões
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaIntelligencePanel } from "@/components/waitlist/AgendaIntelligencePanel";
import { useBarbershop } from "@/hooks/useBarbershop";
import { AlertCircle, Settings } from "lucide-react";

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
          <h3 className="text-lg font-medium mb-2">Barbearia não encontrada</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar as informações da sua barbearia.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Inteligência de Agenda</h1>
      </div>

      <AgendaIntelligencePanel barbershopId={barbershop.id} />
    </div>
  );
};

export default InteligenciaAgendaPage;
