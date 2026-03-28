import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Repeat, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  RecurringAppointmentService, 
  RecurringAppointment, 
  RecurringSettings,
  RECURRING_TYPES, 
  WEEKDAYS,
  formatRecurringDescription 
} from '@/services/recurring/RecurringAppointmentService';
import { useBarbershop } from '@/hooks/useBarbershop';

interface RecurringAppointmentPanelProps {
  barbershopId: string;
}

export const RecurringAppointmentPanel: React.FC<RecurringAppointmentPanelProps> = ({ barbershopId }) => {
  const { barbershop } = useBarbershop();
  const [appointments, setAppointments] = useState<RecurringAppointment[]>([]);
  const [settings, setSettings] = useState<RecurringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    professional_id: '',
    service_id: '',
    client_name: '',
    client_whatsapp: '',
    first_date: new Date(),
    time: '',
    recurring_type: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurring_day: 1,
    recurring_end_date: new Date(),
    notes: ''
  });

  // Settings state
  const [settingsData, setSettingsData] = useState({
    max_recurring_days: 90,
    allow_conflicts: false,
    notify_conflicts: true
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsData, settingsData] = await Promise.all([
        RecurringAppointmentService.getRecurringAppointments(barbershopId),
        RecurringAppointmentService.getRecurringSettings(barbershopId)
      ]);

      setAppointments(appointmentsData);
      setSettings(settingsData);
      
      if (settingsData) {
        setSettingsData({
          max_recurring_days: settingsData.max_recurring_days,
          allow_conflicts: settingsData.allow_conflicts,
          notify_conflicts: settingsData.notify_conflicts
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar agendamentos recorrentes');
    } finally {
      setLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    loadData();
  }, [barbershopId, loadData]);

  const handleCreateAppointment = async () => {
    if (!formData.professional_id || !formData.service_id || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const result = await RecurringAppointmentService.createRecurringAppointment({
        barbershop_id: barbershopId,
        professional_id: formData.professional_id,
        service_id: formData.service_id,
        client_name: formData.client_name,
        client_whatsapp: formData.client_whatsapp,
        first_date: format(formData.first_date, 'yyyy-MM-dd'),
        time: formData.time,
        recurring_type: formData.recurring_type,
        recurring_day: formData.recurring_day,
        recurring_end_date: format(formData.recurring_end_date, 'yyyy-MM-dd'),
        notes: formData.notes
      });

      if (result.success) {
        toast.success('Agendamento recorrente criado com sucesso!');
        setShowCreateForm(false);
        setFormData({
          professional_id: '',
          service_id: '',
          client_name: '',
          client_whatsapp: '',
          first_date: new Date(),
          time: '',
          recurring_type: 'weekly',
          recurring_day: 1,
          recurring_end_date: new Date(),
          notes: ''
        });
        loadData();
      } else {
        toast.error(result.error || 'Erro ao criar agendamento recorrente');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento recorrente');
    }
  };

  const handleCancelSeries = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja cancelar toda a série de agendamentos recorrentes?')) {
      return;
    }

    try {
      const result = await RecurringAppointmentService.cancelRecurringSeries(appointmentId);
      
      if (result.success) {
        toast.success(`Série cancelada! ${result.cancelled} agendamentos removidos.`);
        loadData();
      } else {
        toast.error(result.error || 'Erro ao cancelar série');
      }
    } catch (error) {
      console.error('Erro ao cancelar série:', error);
      toast.error('Erro ao cancelar série');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const result = await RecurringAppointmentService.updateRecurringSettings(barbershopId, settingsData);
      
      if (result.success) {
        toast.success('Configurações atualizadas com sucesso!');
        setShowSettings(false);
        loadData();
      } else {
        toast.error(result.error || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Agendado</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Repeat className="w-6 h-6" />
            Agendamentos Recorrentes
          </h2>
          <p className="text-muted-foreground">
            Gerencie agendamentos automáticos recorrentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Novo Recorrente
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Recorrência</CardTitle>
            <CardDescription>
              Configure como os agendamentos recorrentes devem funcionar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Max dias para gerar</Label>
                <Input
                  type="number"
                  value={settingsData.max_recurring_days}
                  onChange={(e) => setSettingsData(prev => ({
                    ...prev,
                    max_recurring_days: parseInt(e.target.value) || 90
                  }))}
                  min="7"
                  max="365"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settingsData.allow_conflicts}
                  onCheckedChange={(checked) => setSettingsData(prev => ({
                    ...prev,
                    allow_conflicts: checked
                  }))}
                />
                <Label>Permitir conflitos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settingsData.notify_conflicts}
                  onCheckedChange={(checked) => setSettingsData(prev => ({
                    ...prev,
                    notify_conflicts: checked
                  }))}
                />
                <Label>Notificar conflitos</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateSettings}>
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento Recorrente</CardTitle>
            <CardDescription>
              Configure um agendamento que se repete automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Profissional</Label>
                <Select value={formData.professional_id} onValueChange={(value) => setFormData(prev => ({ ...prev, professional_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui você deve carregar os profissionais da barbearia */}
                    <SelectItem value="prof1">Profissional 1</SelectItem>
                    <SelectItem value="prof2">Profissional 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={formData.service_id} onValueChange={(value) => setFormData(prev => ({ ...prev, service_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Aqui você deve carregar os serviços da barbearia */}
                    <SelectItem value="svc1">Corte</SelectItem>
                    <SelectItem value="svc2">Barba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={formData.client_whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_whatsapp: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Primeira Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.first_date ? format(formData.first_date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.first_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, first_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tipo de Recorrência</Label>
                <Select value={formData.recurring_type} onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => setFormData(prev => ({ ...prev, recurring_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRING_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label} - {value.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dia da Semana</Label>
                <Select value={formData.recurring_day.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_day: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WEEKDAYS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.recurring_end_date ? format(formData.recurring_end_date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.recurring_end_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, recurring_end_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o agendamento"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                Criar Agendamento Recorrente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum agendamento recorrente encontrado. Crie seu primeiro agendamento recorrente acima.
            </AlertDescription>
          </Alert>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{appointment.client_name || 'Cliente sem nome'}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatRecurringDescription(appointment)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.recurring_time}
                      </span>
                      {appointment.client_whatsapp && (
                        <span>{appointment.client_whatsapp}</span>
                      )}
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSeries(appointment.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelar Série
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
