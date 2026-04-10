import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FinalizarAtendimentoModal } from "@/components/atendimento/FinalizarAtendimentoModal";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2
} from "lucide-react";

interface Appointment {
  id: string;
  client_name: string;
  client_user_id?: string;
  service_id: string;
  professional_id: string;
  barbershop_id: string;
  scheduled_at: string;
  status: string;
  notes?: string;
  services?: {
    name: string;
    price: number;
    duration_minutes: number;
  };
  professionals?: {
    name: string;
    commission_percent: number;
  };
  barbershops?: {
    name: string;
  };
}

interface AgendaProfissionalProps {
  professionalId?: string;
}

export const AgendaProfissional = ({ professionalId }: AgendaProfissionalProps) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [filter, setFilter] = useState<"today" | "all">("today");

  const loadAppointments = useCallback(async () => {
    if (!user && !professionalId) return;

    setLoading(true);
    try {
      const query = (supabase as any)
        .from("appointments")
        .select(`
          *,
          services(name, price, duration_minutes),
          professionals(name, commission_percent),
          barbershops(name)
        `)
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_at", { ascending: true });

      if (professionalId) {
        query.eq("professional_id", professionalId);
      } else {
        query.eq("professional_id", user?.user_metadata?.professional_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      
      if (filter === "today") {
        const today = new Date().toISOString().split('T')[0];
        filteredData = filteredData.filter(apt => 
          apt.scheduled_at.startsWith(today)
        );
      }

      setAppointments(filteredData);
    } catch (error: any) {
      console.error("Erro ao carregar agenda:", error);
      toast.error("Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  }, [user, professionalId, filter]);

  useEffect(() => {
    loadAppointments();
  }, [user, professionalId, filter, loadAppointments]);

  const handleFinalizarAtendimento = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowFinalizarModal(true);
  };

  const handleCancelarAtendimento = async (appointment: Appointment) => {
    try {
      const { error } = await (supabase as any)
        .from("appointments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast.success("Atendimento cancelado");
      loadAppointments();
    } catch (error: any) {
      console.error("Erro ao cancelar atendimento:", error);
      toast.error("Erro ao cancelar atendimento");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const isPastAppointment = (scheduledAt: string) => {
    return new Date(scheduledAt) < new Date();
  };

  const isInProgressAppointment = (scheduledAt: string) => {
    const now = new Date();
    const appointmentTime = new Date(scheduledAt);
    const diffMinutes = (now.getTime() - appointmentTime.getTime()) / (1000 * 60);
    return diffMinutes >= -15 && diffMinutes <= 120; // 15min antes até 2h depois
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Minha Agenda
          </h2>
          <p className="text-muted-foreground">
            {filter === "today" ? "Agendamentos de hoje" : "Todos os agendamentos"}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("today")}
          >
            Hoje
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === "today" 
                ? "Nenhum atendimento agendado para hoje." 
                : "Nenhum atendimento agendado."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{appointment.client_name}</span>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Scissors className="w-4 h-4" />
                        {appointment.services?.name || "Serviço"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        R$ {appointment.services?.price?.toFixed(2) || "0,00"}
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Observações:</strong> {appointment.notes}
                      </p>
                    )}

                    {appointment.barbershops && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Local:</strong> {appointment.barbershops.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {appointment.status === "scheduled" && isInProgressAppointment(appointment.scheduled_at) && (
                      <Button
                        size="sm"
                        onClick={() => handleFinalizarAtendimento(appointment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    
                    {appointment.status === "scheduled" && isPastAppointment(appointment.scheduled_at) && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleFinalizarAtendimento(appointment)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Finalizar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelarAtendimento(appointment)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {appointment.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleFinalizarAtendimento(appointment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FinalizarAtendimentoModal
        open={showFinalizarModal}
        onOpenChange={setShowFinalizarModal}
        appointment={selectedAppointment}
        onSuccess={() => {
          loadAppointments();
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
};
