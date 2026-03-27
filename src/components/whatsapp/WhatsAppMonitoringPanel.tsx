import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  Settings,
  Play,
  Pause,
} from 'lucide-react';
import {
  getNumbersByBarbershop,
  getSendingStats,
  blockNumber,
  unblockNumber,
  WhatsAppNumber,
} from '@/services/messageBalanceService';
import {
  getAlerts,
  resolveAlert,
  BlockedAlert,
} from '@/services/blockingAlertService';
import {
  getJobStats,
  getRecentJobs,
  Job,
} from '@/services/jobQueueService';

interface WhatsAppMonitoringPanelProps {
  barbershopId: string;
}

export function WhatsAppMonitoringPanel({ barbershopId }: WhatsAppMonitoringPanelProps) {
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [alerts, setAlerts] = useState<BlockedAlert[]>([]);
  const [jobStats, setJobStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0, total: 0 });
  const [sendingStats, setSendingStats] = useState({ today: 0, thisHour: 0, thisMinute: 0, blockedNumbers: 0, activeNumbers: 0 });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<BlockedAlert | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [barbershopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nums, als, stats, sendStats, jobs] = await Promise.all([
        getNumbersByBarbershop(barbershopId),
        getAlerts({ barbershopId, isResolved: false }),
        getJobStats(),
        getSendingStats(barbershopId),
        getRecentJobs(20),
      ]);

      setNumbers(nums);
      setAlerts(als);
      setJobStats(stats);
      setSendingStats(sendStats);
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockNumber = async (numberId: string) => {
    const until = new Date();
    until.setHours(until.getHours() + 24);

    const success = await blockNumber(numberId, until, 'Bloqueio manual pelo admin');
    if (success) {
      toast({ title: 'Número bloqueado', description: 'O número foi bloqueado por 24 horas' });
      loadData();
    } else {
      toast({ title: 'Erro', description: 'Falha ao bloquear número', variant: 'destructive' });
    }
  };

  const handleUnblockNumber = async (numberId: string) => {
    const success = await unblockNumber(numberId);
    if (success) {
      toast({ title: 'Número desbloqueado', description: 'O número está disponível novamente' });
      loadData();
    } else {
      toast({ title: 'Erro', description: 'Falha ao desbloquear número', variant: 'destructive' });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const success = await resolveAlert(alertId, 'system');
    if (success) {
      toast({ title: 'Alerta resolvido' });
      loadData();
    } else {
      toast({ title: 'Erro', description: 'Falha ao resolver alerta', variant: 'destructive' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (number: WhatsAppNumber) => {
    if (number.is_blocked) return <XCircle className="w-5 h-5 text-red-500" />;
    if (!number.is_active) return <Pause className="w-5 h-5 text-gray-400" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  if (loading && numbers.length === 0) {
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
          <h2 className="text-2xl font-bold">Monitoramento WhatsApp</h2>
          <p className="text-muted-foreground">Balanceamento, filas e alertas do sistema</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sendingStats.today}</div>
            <p className="text-xs text-muted-foreground">
              {sendingStats.thisHour}h | {sendingStats.thisMinute}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Números Ativos</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sendingStats.activeNumbers}</div>
            <p className="text-xs text-muted-foreground">
              {sendingStats.blockedNumbers} bloqueados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}</div>
            <p className="text-xs text-muted-foreground">
              {alerts.length} total não resolvidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs na Fila</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {jobStats.processing} processando
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="numbers">
        <TabsList>
          <TabsTrigger value="numbers">Números</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="queue">Fila de Jobs</TabsTrigger>
          <TabsTrigger value="logs">Logs Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="numbers">
          <Card>
            <CardHeader>
              <CardTitle>Números de WhatsApp</CardTitle>
              <CardDescription>Status e uso de cada número cadastrado</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Sucessos</TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum número cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    numbers.map((number) => (
                      <TableRow key={number.id}>
                        <TableCell>{getStatusIcon(number)}</TableCell>
                        <TableCell className="font-mono">{number.phone_number}</TableCell>
                        <TableCell>{number.usage_count}</TableCell>
                        <TableCell className="text-green-600">{number.successful_count}</TableCell>
                        <TableCell className="text-red-600">{number.failed_count}</TableCell>
                        <TableCell>
                          {number.last_used_at
                            ? new Date(number.last_used_at).toLocaleString('pt-BR')
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {number.is_blocked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblockNumber(number.id)}
                              >
                                Desbloquear
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBlockNumber(number.id)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Bloqueio</CardTitle>
              <CardDescription>Notificações sobre problemas nos números</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhum alerta pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 mt-0.5 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-muted-foreground">{alert.suggested_action}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Processamento</CardTitle>
              <CardDescription>Status dos jobs pendentes e em processamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-yellow-100 rounded-lg text-center">
                  <div className="text-2xl font-bold">{jobStats.pending}</div>
                  <div className="text-sm text-yellow-800">Pendentes</div>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg text-center">
                  <div className="text-2xl font-bold">{jobStats.processing}</div>
                  <div className="text-sm text-blue-800">Processando</div>
                </div>
                <div className="p-4 bg-green-100 rounded-lg text-center">
                  <div className="text-2xl font-bold">{jobStats.completed}</div>
                  <div className="text-sm text-green-800">Completos</div>
                </div>
                <div className="p-4 bg-red-100 rounded-lg text-center">
                  <div className="text-2xl font-bold">{jobStats.failed}</div>
                  <div className="text-sm text-red-800">Falharam</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.filter(j => j.status !== 'completo').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum job em processamento
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentJobs
                      .filter(j => j.status !== 'completo')
                      .map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Badge variant="outline">{job.job_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                job.status === 'processando'
                                  ? 'default'
                                  : job.status === 'falhou'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.attempts} / {job.max_attempts}
                          </TableCell>
                          <TableCell>
                            {new Date(job.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
              <CardDescription>Últimos jobs processados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum job recente
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentJobs.slice(0, 10).map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Badge variant="outline">{job.job_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              job.status === 'completo'
                                ? 'default'
                                : job.status === 'falhou'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.attempts}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">
                          {job.error_message || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(job.updated_at).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getSeverityColor(selectedAlert.severity)}>
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedAlert.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mensagem</Label>
                <p className="font-medium">{selectedAlert.message}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sugestão</Label>
                <p>{selectedAlert.suggested_action}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                  Fechar
                </Button>
                <Button onClick={() => handleResolveAlert(selectedAlert.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Resolver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-muted-foreground mb-1 ${className || ''}`}>{children}</p>;
}
