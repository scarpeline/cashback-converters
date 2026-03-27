import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useClientReactivation } from '@/hooks/useClientReactivation';
import { useToast } from '@/hooks/use-toast';
import type { InactiveClient } from '@/services/clientReactivationService';

export function ClientReactivationDashboard() {
  const {
    inactiveClients,
    stats,
    loading,
    error,
    campaignRunning,
    fetchInactiveClients,
    fetchStats,
    sendMessage,
    runCampaign,
    trackResponse,
  } = useClientReactivation();

  const { toast } = useToast();
  const [daysInactive, setDaysInactive] = useState('15');
  const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleRunCampaign = async () => {
    try {
      const result = await runCampaign(parseInt(daysInactive), 50);
      toast({
        title: 'Campanha Executada',
        description: `${result.sent} mensagens enviadas, ${result.failed} falhas`,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao executar campanha',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (client: InactiveClient) => {
    try {
      setSendingMessage(true);
      const result = await sendMessage(client, customMessage || undefined);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Mensagem enviada com sucesso',
        });
        setSelectedClient(null);
        setCustomMessage('');
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar mensagem',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTrackResponse = async (clientId: string, responseType: 'scheduled' | 'declined' | 'no_response') => {
    try {
      await trackResponse(clientId, responseType);
      toast({
        title: 'Resposta Registrada',
        description: 'Resposta registrada com sucesso',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao registrar resposta',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reativação de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Automação inteligente para reativar clientes inativos
          </p>
        </div>
        <Button
          onClick={handleRunCampaign}
          disabled={campaignRunning || loading}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          {campaignRunning ? 'Executando...' : 'Executar Campanha'}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Erro</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Campanhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_campaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mensagens Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.success_rate}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveClients.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Configure os parâmetros da campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Dias Inativo</label>
              <Input
                type="number"
                value={daysInactive}
                onChange={(e) => setDaysInactive(e.target.value)}
                min="1"
                max="365"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => fetchInactiveClients(parseInt(daysInactive), 100)}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientes Inativos ({inactiveClients.length})
          </CardTitle>
          <CardDescription>
            Clientes inativos há {daysInactive} dias ou mais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">Nenhum cliente inativo encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inactiveClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{client.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {client.days_inactive} dias inativo
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {client.total_visits} visitas
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Ticket médio: R$ {client.average_ticket.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedClient(client)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Mensagem
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enviar Mensagem</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedClient(null);
                  setCustomMessage('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mensagem Personalizada</label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Deixe em branco para usar mensagem automática..."
                  className="min-h-24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  WhatsApp: {selectedClient.whatsapp}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendMessage(selectedClient)}
                  disabled={sendingMessage}
                  className="flex-1 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedClient(null);
                    setCustomMessage('');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Registrar Resposta</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTrackResponse(selectedClient.id, 'scheduled')}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Agendou
                  </Button>
                  <Button
                    onClick={() => handleTrackResponse(selectedClient.id, 'declined')}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <X className="w-4 h-4" />
                    Recusou
                  </Button>
                  <Button
                    onClick={() => handleTrackResponse(selectedClient.id, 'no_response')}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    Sem Resposta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
