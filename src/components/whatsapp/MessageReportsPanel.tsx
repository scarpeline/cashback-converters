import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, BarChart3, TrendingUp, MessageSquare, Users, PieChart } from 'lucide-react';
import {
  getReportSummary,
  getDailyUsage,
  getTopRecipients,
  getMessageUsage,
  exportMessageUsage,
  MessageUsage,
  MessageReportSummary,
  DailyUsage,
} from '@/services/messageReportService';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';

interface MessageReportsPanelProps {
  barbershopId: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MessageReportsPanel({ barbershopId }: MessageReportsPanelProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<MessageReportSummary | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [topRecipients, setTopRecipients] = useState<{ phone: string; count: number; last_sent: string }[]>([]);
  const [usageData, setUsageData] = useState<MessageUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    messageType: 'all',
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageUsage | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      const [sum, daily, top, usage] = await Promise.all([
        getReportSummary(barbershopId, start, end),
        getDailyUsage(barbershopId, 30),
        getTopRecipients(barbershopId, 10),
        getMessageUsage(barbershopId, {
          startDate: start,
          endDate: end,
          messageType: filters.messageType !== 'all' ? filters.messageType : undefined,
          limit: 20,
          offset: page * 20,
        }),
      ]);

      setSummary(sum);
      setDailyUsage(daily);
      setTopRecipients(top);
      setUsageData(usage.data);
      setTotalCount(usage.total);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar relatórios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [barbershopId, filters, toast, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      const csv = await exportMessageUsage(barbershopId, start, end);

      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-mensagens-${filters.startDate}-${filters.endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Exportação concluída!' });
      } else {
        toast({ title: 'Erro', description: 'Falha ao gerar CSV', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar dados', variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      notification: 'Notificação',
      marketing: 'Marketing',
      automation: 'Automação',
      reminder: 'Lembrete',
      confirmation: 'Confirmação',
    };
    return labels[type] || type;
  };

  const pieChartData = summary
    ? Object.entries(summary.by_type).map(([name, data]) => ({
        name: getTypeLabel(name),
        value: data.count,
      }))
    : [];

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
          <h2 className="text-2xl font-bold">Relatórios de Mensagens</h2>
          <p className="text-muted-foreground">Acompanhe o envio de mensagens e custos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_sent || 0}</div>
            <p className="text-xs text-muted-foreground">mensagens enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary?.total_cost.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">total gasto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Dono</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary?.owner_cost.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">custo do salão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary?.professional_cost.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">dividido com profis.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{summary?.success_rate || 0}%</div>
            <p className="text-sm text-muted-foreground">mensagens entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{filters.startDate} até {filters.endDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full"
              />
            </div>
            <Select value={filters.messageType} onValueChange={(v) => setFilters({ ...filters, messageType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de mensagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="automation">Automação</SelectItem>
                <SelectItem value="reminder">Lembrete</SelectItem>
                <SelectItem value="confirmation">Confirmação</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="daily">Uso Diário</TabsTrigger>
          <TabsTrigger value="recipients">Principais Destinatários</TabsTrigger>
          <TabsTrigger value="details">Detalhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados disponíveis</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(summary?.by_type || {}).map(([type, data], index) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{getTypeLabel(type)}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {(data as any).cost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{(data as any).count} msgs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Uso Diário de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="messages_sent" stroke="#22c55e" name="Mensagens" />
                    <Line yAxisId="right" type="monotone" dataKey="total_cost" stroke="#3b82f6" name="Custo (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Principais Destinatários</CardTitle>
              <CardDescription>Clientes que mais receberam mensagens</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagens Recebidas</TableHead>
                    <TableHead>Última Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    topRecipients.map((recipient) => (
                      <TableRow key={recipient.phone}>
                        <TableCell className="font-mono">{recipient.phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{recipient.count}</Badge>
                        </TableCell>
                        <TableCell>{new Date(recipient.last_sent).toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Custo Total</TableHead>
                    <TableHead>Custo Dono</TableHead>
                    <TableHead>Custo Prof.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma mensagem registrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageData.map((msg) => (
                      <TableRow key={msg.id} className="cursor-pointer" onClick={() => setSelectedMessage(msg)}>
                        <TableCell className="text-sm">{new Date(msg.created_at).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="font-mono text-sm">{msg.recipient_phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(msg.message_type)}</Badge>
                        </TableCell>
                        <TableCell>R$ {msg.total_cost.toFixed(4)}</TableCell>
                        <TableCell>R$ {msg.owner_cost_share.toFixed(4)}</TableCell>
                        <TableCell>R$ {msg.professional_cost_share.toFixed(4)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={msg.twilio_status === 'delivered' ? 'default' : msg.twilio_status === 'failed' ? 'destructive' : 'secondary'}
                          >
                            {msg.twilio_status || 'pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {usageData.length} de {totalCount} mensagens
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={usageData.length < 20}>
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                  <p>{new Date(selectedMessage.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status Twilio</Label>
                  <p>{selectedMessage.twilio_status || 'Pendente'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destinatário</Label>
                  <p className="font-mono">{selectedMessage.recipient_phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <p>{getTypeLabel(selectedMessage.message_type)}</p>
                </div>
              </div>
              {selectedMessage.message_content && (
                <div>
                  <Label className="text-xs text-muted-foreground">Conteúdo</Label>
                  <p className="p-3 bg-muted rounded-lg mt-1">{selectedMessage.message_content}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Custo Total</Label>
                  <p className="text-lg font-bold">R$ {selectedMessage.total_cost.toFixed(4)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Custo Dono</Label>
                  <p className="text-lg font-bold">R$ {selectedMessage.owner_cost_share.toFixed(4)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Custo Prof.</Label>
                  <p className="text-lg font-bold">R$ {selectedMessage.professional_cost_share.toFixed(4)}</p>
                </div>
              </div>
              {selectedMessage.twilio_message_sid && (
                <div>
                  <Label className="text-xs text-muted-foreground">Twilio SID</Label>
                  <p className="font-mono text-sm">{selectedMessage.twilio_message_sid}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
