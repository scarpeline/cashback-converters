import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ClipboardList, Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const SERVICE_LABELS: Record<string, string> = {
  mei_declaration: "Declaração MEI",
  me_declaration: "Declaração ME",
  income_tax: "Imposto de Renda",
  cnpj_opening: "Abertura de CNPJ (MEI/ME)",
  cnpj_closing: "Encerramento de CNPJ",
  cnpj_migration: "Migração CPF → CNPJ",
  other: "Outro Serviço",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-primary/10 text-primary" },
  accepted: { label: "Aceito", color: "bg-accent/20 text-accent-foreground" },
  in_progress: { label: "Em Andamento", color: "bg-secondary/20 text-secondary-foreground" },
  completed: { label: "Concluído", color: "bg-primary/10 text-primary" },
  rejected: { label: "Rejeitado", color: "bg-destructive/10 text-destructive" },
};

const SolicitarServicoFiscalPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ service_type: "cnpj_opening", description: "" });

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("fiscal_service_requests")
      .select("*")
      .eq("client_user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any).from("fiscal_service_requests").insert({
      client_user_id: user.id,
      service_type: form.service_type,
      description: form.description || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Pedido enviado ao contador!");
    setShowForm(false);
    setForm({ service_type: "cnpj_opening", description: "" });
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Serviços Contábeis</h1>
          <p className="text-muted-foreground text-sm">Solicite abertura de CNPJ, declarações e mais</p>
        </div>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <ClipboardList className="w-4 h-4 mr-2" />Solicitar
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Novo Pedido</CardTitle>
            <CardDescription>Selecione o serviço e envie ao contador da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Serviço</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-muted/30 px-4 py-2 text-sm mt-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              >
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Descrição / Observações</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do que precisa, CNAE sugerido, etc."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Enviando..." : "Enviar Pedido"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available services info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: "cnpj_opening", icon: "🏢", desc: "Abrir MEI ou ME" },
          { key: "mei_declaration", icon: "📋", desc: "Declaração anual MEI" },
          { key: "me_declaration", icon: "📊", desc: "Declaração ME" },
          { key: "income_tax", icon: "💰", desc: "IRPF" },
          { key: "cnpj_migration", icon: "🔄", desc: "CPF → CNPJ" },
          { key: "other", icon: "📝", desc: "Outros" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => { setForm({ service_type: s.key, description: "" }); setShowForm(true); }}
            className="p-3 rounded-xl border border-border bg-card text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xs font-medium">{SERVICE_LABELS[s.key]}</p>
            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum pedido realizado.</p>
            <p className="text-sm text-muted-foreground mt-1">Solicite seu primeiro serviço contábil acima!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Meus Pedidos</h2>
          {requests.map((r) => {
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{SERVICE_LABELS[r.service_type] || r.service_type}</p>
                      {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${sc.color}`}>{sc.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitarServicoFiscalPage;
