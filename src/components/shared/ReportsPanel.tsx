// @ts-nocheck
/**
 * ReportsPanel — Relatórios do Dono
 * Financeiro, comissões, serviços, produtos vendidos
 * Usa useReports + useFinanceDashboard existentes
 */
import React, { useState } from "react";
import { useFinancialReport, useAppointmentReport, useClientReport } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Scissors, Calendar, Download, Loader2 } from "lucide-react";

interface ReportsPanelProps {
  barbershopId: string;
}

type Period = "7d" | "30d" | "90d";

function getPeriodDates(period: Period): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (period === "7d") start.setDate(start.getDate() - 7);
  else if (period === "30d") start.setDate(start.getDate() - 30);
  else start.setDate(start.getDate() - 90);
  return { start, end };
}

export function ReportsPanel({ barbershopId }: ReportsPanelProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const { start, end } = getPeriodDates(period);

  const { report: financial, isLoading: loadingFin } = useFinancialReport(start, end);
  const { report: appointments, isLoading: loadingAppt } = useAppointmentReport(barbershopId, start, end);
  const { report: clients, isLoading: loadingClients } = useClientReport(barbershopId, start, end);

  const loading = loadingFin || loadingAppt || loadingClients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground text-sm">Visão completa do seu negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="financeiro" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Faturamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gradient-gold">
                    {formatCurrency(financial?.totalRevenue ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Comissões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(financial?.totalCommissions ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Ticket Médio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(financial?.averageTicket ?? 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pagamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{financial?.totalPayments ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Comissões por profissional */}
            {financial?.commissionsByProfessional?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comissões por Profissional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financial.commissionsByProfessional.map((p: any) => (
                      <div key={p.professional_id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{p.professional_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{p.appointments_count} atend.</span>
                          <Badge variant="outline">{formatCurrency(p.commission_amount)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SERVIÇOS */}
          <TabsContent value="servicos" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{appointments?.totalAppointments ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5" /> Concluídos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {appointments?.completedAppointments ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {appointments?.serviceBreakdown?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Serviços Realizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointments.serviceBreakdown.map((s: any) => (
                      <div key={s.service_id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{s.service_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{s.count}x</span>
                          <Badge variant="secondary">{formatCurrency(s.revenue)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CLIENTES */}
          <TabsContent value="clientes" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Total Clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{clients?.totalClients ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Novos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{clients?.newClients ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Recorrentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-500">{clients?.returningClients ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            {clients?.topClients?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients.topClients.slice(0, 10).map((c: any, i: number) => (
                      <div key={c.client_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                          <span className="text-sm font-medium">{c.client_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{c.visits} visitas</span>
                          <Badge variant="outline">{formatCurrency(c.total_spent)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
