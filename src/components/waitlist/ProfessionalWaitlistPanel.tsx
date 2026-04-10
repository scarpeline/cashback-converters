// @ts-nocheck
/**
 * ProfessionalWaitlistPanel - Painel para Profissionais gerenciarem fila de espera
 * 
 * Interface para profissionais:
 * - Visualizar fila de espera (se permitido)
 * - Oferecer vagas manualmente
 * - Visualizar antecipações
 * - Realocar clientes
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { waitlistManager, type WaitlistEntry, type AgendaIntelligenceSettings } from "@/services/waitlist/WaitlistManager";
import { useAuth } from "@/lib/auth";
import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  ArrowRight,
  User,
  Phone
} from "lucide-react";

interface ProfessionalWaitlistPanelProps {
  barbershopId: string;
  professionalId?: string;
}

export const ProfessionalWaitlistPanel = ({ barbershopId, professionalId }: ProfessionalWaitlistPanelProps) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AgendaIntelligenceSettings | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<WaitlistEntry | null>(null);
  const [offeringSlot, setOfferingSlot] = useState(false);

  // Estado do formulário de oferta manual
  const [offerForm, setOfferForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "",
    professional_id: professionalId || "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [settingsData, waitlistData] = await Promise.all([
        waitlistManager.getAgendaSettings(barbershopId),
        waitlistManager.getWaitlist(barbershopId, {
          date: selectedDate,
          professionalId: professionalId,
          status: "waiting",
        }),
      ]);

      setSettings(settingsData);
      setWaitlist(waitlistData);
    } catch (error) {
      console.error("[PROFESSIONAL_WAITLIST] Error loading data:", error);
      toast.error("Erro ao carregar dados da fila");
    } finally {
      setLoading(false);
    }
  }, [barbershopId, selectedDate, professionalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOfferSlot = async (client: WaitlistEntry) => {
    if (!offerForm.time) {
      toast.error("Selecione um horário para oferecer");
      return;
    }

    setOfferingSlot(true);
    
    try {
      const result = await waitlistManager.processSlotRelease(
        barbershopId,
        offerForm.date,
        offerForm.time,
        offerForm.professional_id || null,
        client.service_id
      );

      if (result.processed) {
        toast.success("Oferta enviada com sucesso!");
        setShowOfferDialog(false);
        setSelectedClient(null);
        setOfferForm({
          date: new Date().toISOString().split('T')[0],
          time: "",
          professional_id: professionalId || "",
          notes: "",
        });
        await loadData(); // Recarregar fila
      } else {
        toast.error("Erro ao enviar oferta");
      }
    } catch (error) {
      console.error("[PROFESSIONAL_WAITLIST] Error offering slot:", error);
      toast.error("Erro ao enviar oferta");
    } finally {
      setOfferingSlot(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "default";
      case "offered":
        return "secondary";
      case "accepted":
        return "default";
      case "declined":
        return "destructive";
      case "expired":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Users className="w-4 h-4" />;
      case "offered":
        return <MessageSquare className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "declined":
        return <XCircle className="w-4 h-4" />;
      case "expired":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Aguardando";
      case "offered":
        return "Oferta enviada";
      case "accepted":
        return "Aceito";
      case "declined":
        return "Recusado";
      case "expired":
        return "Expirado";
      default:
        return status;
    }
  };

  const getPreferenceIcon = (accepts: { other: boolean; nearby: boolean; any: boolean }) => {
    if (accepts.any) return <Calendar className="w-4 h-4 text-green-600" />;
    if (accepts.nearby) return <Clock className="w-4 h-4 text-orange-600" />;
    if (accepts.other) return <Users className="w-4 h-4 text-orange-600" />;
    return <User className="w-4 h-4 text-purple-600" />;
  };

  const getPreferenceText = (accepts: { other: boolean; nearby: boolean; any: boolean }) => {
    if (accepts.any) return "Aceita qualquer horário";
    if (accepts.nearby) return "Aceita horário próximo";
    if (accepts.other) return "Aceita outro profissional";
    return "Apenas profissional escolhido";
  };

  if (!settings) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Configurações não encontradas</p>
        </CardContent>
      </Card>
    );
  }

  // Verificar se profissional tem permissão para ver fila
  if (!settings.allow_professionals_view_queue) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar a fila de espera.
            Entre em contato com o dono da barbearia para solicitar acesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Fila de Espera
          </h2>
          <p className="text-muted-foreground">
            Gerencie clientes aguardando por horários disponíveis
          </p>
        </div>
        {settings.allow_professionals_offer_slots && (
          <Button onClick={() => setShowOfferDialog(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Oferecer Vaga
          </Button>
        )}
      </div>

      <Tabs defaultValue="waiting" className="space-y-6">
        <TabsList>
          <TabsTrigger value="waiting">Aguardando ({waitlist.filter(w => w.status === 'waiting').length})</TabsTrigger>
          <TabsTrigger value="offered">Ofertas Enviadas ({waitlist.filter(w => w.status === 'offered').length})</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Filtro por data */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Data:</Label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Atualizar
          </Button>
        </div>

        {/* Aba: Aguardando */}
        <TabsContent value="waiting" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : waitlist.filter(w => w.status === 'waiting').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente aguardando</h3>
                <p className="text-muted-foreground">
                  Não há clientes na fila de espera para esta data.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {waitlist
                .filter(w => w.status === 'waiting')
                .sort((a, b) => a.position_in_queue - b.position_in_queue)
                .map((client) => (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{client.position_in_queue}</Badge>
                            <h4 className="font-medium">{client.clients?.name}</h4>
                            {client.clients?.whatsapp && (
                              <a
                                href={`https://wa.me/${client.clients.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Horário desejado:</span>
                              <p className="font-medium">{client.desired_time}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Serviço:</span>
                              <p className="font-medium">{client.services?.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Profissional:</span>
                              <p className="font-medium">
                                {client.professionals?.name || 'Sem preferência'}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Preferência:</span>
                              <div className="flex items-center gap-1">
                                {getPreferenceIcon({
                                  other: client.accepts_other_professional,
                                  nearby: client.accepts_nearby_time,
                                  any: client.accepts_any_time,
                                })}
                                <span className="text-xs">
                                  {getPreferenceText({
                                    other: client.accepts_other_professional,
                                    nearby: client.accepts_nearby_time,
                                    any: client.accepts_any_time,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {client.notes && (
                            <div className="p-2 bg-muted/50 rounded text-sm">
                              <span className="text-muted-foreground">Observações:</span>
                              <p>{client.notes}</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Entrou na fila: {new Date(client.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>

                        {settings.allow_professionals_offer_slots && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client);
                                setOfferForm({
                                  ...offerForm,
                                  date: client.desired_date,
                                  professional_id: client.professional_preferred_id || professionalId || "",
                                });
                                setShowOfferDialog(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Oferecer
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Ofertas Enviadas */}
        <TabsContent value="offered" className="space-y-4">
          {waitlist.filter(w => w.status === 'offered').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma oferta enviada</h3>
                <p className="text-muted-foreground">
                  Não há ofertas pendentes de resposta.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {waitlist
                .filter(w => w.status === 'offered')
                .map((client) => (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getStatusIcon(client.status)}
                              {getStatusText(client.status)}
                            </Badge>
                            <h4 className="font-medium">{client.clients?.name}</h4>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Oferta enviada:</span>
                            <p>{new Date(client.offered_at!).toLocaleString('pt-BR')}</p>
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">Prazo de resposta:</span>
                            <p>{new Date(client.response_deadline!).toLocaleString('pt-BR')}</p>
                          </div>

                          {client.notes && (
                            <div className="p-2 bg-muted/50 rounded text-sm">
                              <span className="text-muted-foreground">Observações:</span>
                              <p>{client.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {waitlist.filter(w => ['accepted', 'declined', 'expired'].includes(w.status)).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum histórico</h3>
                <p className="text-muted-foreground">
                  Não há histórico de ofertas para esta data.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {waitlist
                .filter(w => ['accepted', 'declined', 'expired'].includes(w.status))
                .map((client) => (
                  <Card key={client.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(client.status)} className="flex items-center gap-1">
                              {getStatusIcon(client.status)}
                              {getStatusText(client.status)}
                            </Badge>
                            <h4 className="font-medium">{client.clients?.name}</h4>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Respondido:</span>
                            <p>
                              {client.responded_at 
                                ? new Date(client.responded_at).toLocaleString('pt-BR')
                                : 'Não respondido'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de oferta manual */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Oferecer Horário
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Informações do cliente */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium">Cliente selecionado:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{selectedClient.clients?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Posição:</span>
                    <p className="font-medium">#{selectedClient.position_in_queue}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Horário desejado:</span>
                    <p className="font-medium">{selectedClient.desired_time}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Serviço:</span>
                    <p className="font-medium">{selectedClient.services?.name}</p>
                  </div>
                </div>
              </div>

              {/* Formulário de oferta */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <input
                      type="date"
                      value={offerForm.date}
                      onChange={(e) => setOfferForm({ ...offerForm, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <input
                      type="time"
                      value={offerForm.time}
                      onChange={(e) => setOfferForm({ ...offerForm, time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select
                    value={offerForm.professional_id}
                    onValueChange={(value) => setOfferForm({ ...offerForm, professional_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem preferência</SelectItem>
                      {/* Aqui viria a lista de profissionais da barbearia */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem (opcional)</Label>
                  <Textarea
                    placeholder="Alguma informação adicional sobre o horário oferecido?"
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowOfferDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleOfferSlot(selectedClient)} 
                  disabled={offeringSlot || !offerForm.time}
                  className="flex-1"
                >
                  {offeringSlot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Enviar Oferta
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
