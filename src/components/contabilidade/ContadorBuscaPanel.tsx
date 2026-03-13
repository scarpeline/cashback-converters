import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserCheck, MapPin, Building2, Phone, MessageCircle, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface ContadorResult {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  crc_registro: string | null;
  empresa_contabil: string | null;
  cidade: string | null;
  estado: string | null;
  valor_mensalidade: number | null;
  aceita_novos_clientes: boolean;
}

interface Props {
  barbershopId?: string;
  userId?: string;
  userType?: "barbershop" | "profissional" | "afiliado";
  onContadorSelecionado?: (contador: ContadorResult) => void;
  onAbrirChat?: (contadorId: string) => void;
  onSolicitarVinculo?: (contadorId: string) => void;
}

export function ContadorBuscaPanel({
  barbershopId,
  userId,
  userType = "barbershop",
  onContadorSelecionado,
  onAbrirChat,
  onSolicitarVinculo,
}: Props) {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ContadorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [vinculosExistentes, setVinculosExistentes] = useState<Record<string, string>>({});

  useEffect(() => {
    buscarContadores();
    if (barbershopId) carregarVinculos();
  }, [barbershopId]);

  const buscarContadores = async (termo?: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("search_contadores_verificados", {
      _search: termo || "",
    });
    setLoading(false);
    if (error) { toast.error("Erro ao buscar contadores: " + error.message); return; }
    setResultados((data as ContadorResult[]) || []);
  };

  const carregarVinculos = async () => {
    if (!barbershopId) return;
    const { data } = await supabase
      .from("accountant_barbershop_links")
      .select("accountant_id, status")
      .eq("barbershop_id", barbershopId);
    if (data) {
      const mapa: Record<string, string> = {};
      data.forEach((v) => { mapa[v.accountant_id] = v.status; });
      setVinculosExistentes(mapa);
    }
  };

  const handleBusca = () => buscarContadores(busca);

  const handleSolicitarVinculo = async (contadorId: string) => {
    if (!barbershopId || !user) {
      toast.error("Selecione sua empresa primeiro.");
      return;
    }
    setVinculando(contadorId);
    const { error } = await supabase.from("accountant_barbershop_links").insert({
      barbershop_id: barbershopId,
      accountant_id: contadorId,
      status: "pending",
      requested_by_user_id: user.id,
    });
    setVinculando(null);
    if (error) {
      if (error.code === "23505") toast.error("Solicitação já enviada para este contador.");
      else toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Solicitação enviada ao contador!");
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Solicitação de Vínculo Enviada",
      message: "Sua solicitação foi enviada. Aguarde aprovação do contador.",
      type: "info",
    });
    carregarVinculos();
    if (onSolicitarVinculo) onSolicitarVinculo(contadorId);
  };

  const getStatusVinculo = (contadorId: string) => vinculosExistentes[contadorId];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" /> Encontrar Contador
          </CardTitle>
          <CardDescription>
            Busque contadores verificados pelo sistema. Converse antes de contratar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome, cidade ou empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBusca()}
            />
            <Button variant="gold" onClick={handleBusca} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && resultados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum contador verificado encontrado.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar por outro termo ou aguarde novos contadores serem verificados.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {resultados.map((c) => {
          const statusVinculo = getStatusVinculo(c.id);
          return (
            <Card key={c.id} className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{c.name}</p>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                        ✓ Verificado
                      </Badge>
                      {!c.aceita_novos_clientes && (
                        <Badge variant="secondary" className="text-xs">Sem vagas</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {c.empresa_contabil && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{c.empresa_contabil}
                        </span>
                      )}
                      {(c.cidade || c.estado) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{[c.cidade, c.estado].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {c.crc_registro && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />CRC: {c.crc_registro}
                        </span>
                      )}
                    </div>

                    {c.valor_mensalidade != null && c.valor_mensalidade > 0 && (
                      <p className="text-sm font-medium text-primary">
                        Mensalidade: R$ {c.valor_mensalidade.toFixed(2)}/mês
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {onAbrirChat && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAbrirChat(c.id)}
                        className="gap-1"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat
                      </Button>
                    )}

                    {barbershopId && (
                      <>
                        {!statusVinculo && c.aceita_novos_clientes && (
                          <Button
                            size="sm"
                            variant="gold"
                            disabled={vinculando === c.id}
                            onClick={() => handleSolicitarVinculo(c.id)}
                          >
                            {vinculando === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-1" />Vincular</>
                            )}
                          </Button>
                        )}
                        {statusVinculo === "pending" && (
                          <Badge variant="secondary">Aguardando</Badge>
                        )}
                        {statusVinculo === "active" && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            ✓ Vinculado
                          </Badge>
                        )}
                        {statusVinculo === "revoked" && (
                          <Badge variant="destructive">Revogado</Badge>
                        )}
                      </>
                    )}

                    {onContadorSelecionado && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onContadorSelecionado(c)}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ContadorBuscaPanel;
