import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  Loader2,
  Calendar,
  User,
  Scissors
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
  services?: {
    name: string;
    price: number;
    duration_minutes: number;
  };
  professionals?: {
    name: string;
    commission_percent: number;
  };
}

interface FinalizarAtendimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export const FinalizarAtendimentoModal = ({ 
  open, 
  onOpenChange, 
  appointment, 
  onSuccess 
}: FinalizarAtendimentoModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix">("cash");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixData, setPixData] = useState<any>(null);

  useEffect(() => {
    if (appointment?.services?.price) {
      setAmount(appointment.services.price.toString());
    }
  }, [appointment]);

  const handleFinalize = async () => {
    if (!appointment || !amount) {
      toast.error("Informe o valor do atendimento");
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar status do agendamento
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ 
          status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (appointmentError) {
        throw appointmentError;
      }

      // 2. Registrar pagamento
      const paymentData: any = {
        appointment_id: appointment.id,
        barbershop_id: appointment.barbershop_id,
        client_user_id: appointment.client_user_id,
        amount: Number(amount),
        payment_method: paymentMethod === "cash" ? "cash" : "pix",
        status: paymentMethod === "cash" ? "paid" : "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (paymentMethod === "cash") {
        paymentData.paid_at = new Date().toISOString();
      }

      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // 3. Calcular e registrar comissão do profissional
      if (appointment.professionals?.commission_percent) {
        const commissionAmount = (Number(amount) * appointment.professionals.commission_percent) / 100;
        
        await db
          .from("professional_commissions")
          .insert({
            professional_id: appointment.professional_id,
            appointment_id: appointment.id,
            payment_id: payment.id,
            commission_percent: appointment.professionals.commission_percent,
            commission_amount: commissionAmount,
            total_amount: Number(amount),
            status: "pending",
            created_at: new Date().toISOString()
          });
      }

      // 4. Atualizar métricas da barbearia
      const today = new Date().toISOString().split('T')[0];
      await db.rpc('update_daily_metrics', {
        p_barbershop_id: appointment.barbershop_id,
        p_date: today,
        p_revenue: Number(amount),
        p_services_count: 1,
        p_appointments_count: 1,
        p_clients_count: 1,
        p_cash_revenue: paymentMethod === "cash" ? Number(amount) : 0,
        p_pix_revenue: paymentMethod === "pix" ? Number(amount) : 0
      });

      // 5. Gerar PIX se método for PIX
      if (paymentMethod === "pix") {
        const { data: pixResponse, error: pixError } = await supabase.functions.invoke('process-payment', {
          body: {
            amount: Number(amount),
            description: `Atendimento: ${appointment.services?.name || 'Serviço'}`,
            customerInfo: {
              name: appointment.client_name,
              email: "cliente@example.com"
            },
            paymentMethod: "pix"
          }
        });

        if (pixError) {
          throw pixError;
        }

        setPixData(pixResponse);
        setPixGenerated(true);

        // Atualizar pagamento com dados do PIX
        await supabase
          .from("payments")
          .update({
            asaas_payment_id: pixResponse.paymentId,
            asaas_pix_qr_code: pixResponse.qrCode?.encodedImage,
            asaas_pix_copy_paste: pixResponse.qrCode?.payload,
            split_data: pixResponse.splitData
          })
          .eq("id", payment.id);
      } else {
        // Pagamento em dinheiro já concluído
        toast.success("Atendimento finalizado com sucesso!");
        onSuccess();
        onOpenChange(false);
      }

    } catch (error: any) {
      console.error("Erro ao finalizar atendimento:", error);
      toast.error(error.message || "Erro ao finalizar atendimento");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pixData?.paymentId) return;

    setLoading(true);
    try {
      // Verificar status do pagamento no Asaas
      const { data: statusResponse, error: statusError } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: pixData.paymentId }
      });

      if (statusError) {
        throw statusError;
      }

      if (statusResponse.status === 'CONFIRMED' || statusResponse.status === 'RECEIVED') {
        // Atualizar pagamento como confirmado
        await supabase
          .from("payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString()
          })
          .eq("appointment_id", appointment?.id);

        toast.success("Pagamento PIX confirmado!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Pagamento ainda não confirmado. Aguarde o cliente pagar.");
      }
    } catch (error: any) {
      console.error("Erro ao confirmar pagamento:", error);
      toast.error(error.message || "Erro ao verificar pagamento");
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Finalizar Atendimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do atendimento */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.client_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{appointment.services?.name || "Serviço"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(appointment.scheduled_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!pixGenerated ? (
            <>
              {/* Forma de pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: "cash" | "pix") => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="w-4 h-4" />
                      Dinheiro
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer">
                      <QrCode className="w-4 h-4" />
                      PIX
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Atendimento (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Botão finalizar */}
              <Button 
                onClick={handleFinalize} 
                disabled={loading || !amount}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Atendimento
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* PIX gerado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">QR Code PIX</CardTitle>
                  <CardDescription className="text-center">
                    Escaneie o QR Code ou copie o código PIX
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pixData?.qrCode?.encodedImage && (
                    <div className="flex justify-center">
                      <img 
                        src={`data:image/png;base64,${pixData.qrCode.encodedImage}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  )}
                  
                  {pixData?.qrCode?.payload && (
                    <div className="space-y-2">
                      <Label>Código PIX (Copiar e Colar)</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={pixData.qrCode.payload}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(pixData.qrCode.payload);
                            toast.success("Código PIX copiado!");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-center text-sm text-muted-foreground">
                    Valor: R$ {Number(amount).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* Botões de ação */}
              <div className="space-y-2">
                <Button 
                  onClick={handleConfirmPayment} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPixGenerated(false);
                    setPixData(null);
                  }}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
