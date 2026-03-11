import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Fallback labels when DB services not loaded
const SERVICE_LABELS_FALLBACK: Record<string, string> = {
  cnpj_opening: "Abertura de CNPJ (MEI/ME)",
  mei_declaration: "Declaração Anual MEI (DASN-SIMEI)",
  me_declaration: "Declaração ME / Simples Nacional",
  income_tax: "Imposto de Renda (IRPF)",
  cnpj_migration: "Migração CPF → CNPJ",
  cnpj_closing: "Encerramento de CNPJ",
  other: "Outro Serviço",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-primary/10 text-primary" },
  accepted: { label: "Aceito", color: "bg-accent/20 text-accent-foreground" },
  in_progress: { label: "Em Andamento", color: "bg-secondary/20 text-secondary-foreground" },
  completed: { label: "Concluído", color: "bg-primary/10 text-primary" },
  rejected: { label: "Rejeitado", color: "bg-destructive/10 text-destructive" },
};

/** Campos dinâmicos por tipo de serviço */
interface DynamicField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
}

// Fallback fields when DB services not loaded
const SERVICE_FIELDS_FALLBACK: Record<string, DynamicField[]> = {
  cnpj_opening: [
    { key: "full_name", label: "Nome Completo", placeholder: "Nome conforme RG/CNH", required: true },
    { key: "cpf", label: "CPF", placeholder: "000.000.000-00", required: true },
    { key: "company_type", label: "Tipo de Empresa", placeholder: "", type: "select", options: [
      { value: "mei", label: "MEI - Microempreendedor Individual" },
      { value: "me", label: "ME - Microempresa (Simples Nacional)" },
    ], required: true },
    { key: "activity", label: "Atividade Principal (CNAE)", placeholder: "Ex: 9602-5/01 - Cabeleireiros, 9602-5/02 - Manicure" },
    { key: "address", label: "Endereço Comercial", placeholder: "Rua, número, bairro, cidade/UF, CEP" },
    { key: "phone", label: "Telefone de Contato", placeholder: "(11) 99999-0000" },
    { key: "start_date", label: "Data Prevista de Início", placeholder: "Ex: 01/04/2026" },
  ],
  mei_declaration: [
    { key: "cnpj", label: "CNPJ MEI", placeholder: "00.000.000/0001-00", required: true },
    { key: "company_name", label: "Nome da Empresa", placeholder: "Razão social no CNPJ" },
    { key: "year", label: "Ano-Calendário", placeholder: "Ex: 2025", required: true },
    { key: "annual_revenue", label: "Faturamento Bruto Anual (R$)", placeholder: "Ex: 72.000,00", required: true },
    { key: "had_employee", label: "Teve Funcionário?", type: "select", placeholder: "", options: [
      { value: "no", label: "Não" },
      { value: "yes", label: "Sim" },
    ] },
  ],
  me_declaration: [
    { key: "cnpj", label: "CNPJ da Empresa", placeholder: "00.000.000/0001-00", required: true },
    { key: "company_name", label: "Razão Social", placeholder: "Nome da empresa" },
    { key: "year", label: "Ano-Calendário", placeholder: "Ex: 2025", required: true },
    { key: "annual_revenue", label: "Faturamento Bruto Anual (R$)", placeholder: "Ex: 360.000,00", required: true },
    { key: "employees_count", label: "Nº de Funcionários", placeholder: "Ex: 3" },
    { key: "tax_regime", label: "Regime Tributário", type: "select", placeholder: "", options: [
      { value: "simples", label: "Simples Nacional" },
      { value: "lucro_presumido", label: "Lucro Presumido" },
      { value: "nao_sei", label: "Não sei" },
    ] },
  ],
  income_tax: [
    { key: "cpf", label: "CPF do Declarante", placeholder: "000.000.000-00", required: true },
    { key: "full_name", label: "Nome Completo", placeholder: "Nome conforme documentos", required: true },
    { key: "year", label: "Ano-Calendário", placeholder: "Ex: 2025", required: true },
    { key: "income_sources", label: "Fontes de Renda", placeholder: "Ex: Salário, Autônomo, Aluguel, etc.", type: "textarea" },
    { key: "dependents", label: "Nº de Dependentes", placeholder: "Ex: 2" },
    { key: "has_assets", label: "Possui Bens (imóvel, veículo)?", type: "select", placeholder: "", options: [
      { value: "no", label: "Não" },
      { value: "yes", label: "Sim" },
    ] },
    { key: "had_investments", label: "Teve Investimentos?", type: "select", placeholder: "", options: [
      { value: "no", label: "Não" },
      { value: "yes", label: "Sim" },
    ] },
  ],
  cnpj_migration: [
    { key: "cpf", label: "CPF Atual", placeholder: "000.000.000-00", required: true },
    { key: "full_name", label: "Nome Completo", placeholder: "Nome conforme RG", required: true },
    { key: "target_type", label: "Migrar Para", type: "select", placeholder: "", options: [
      { value: "mei", label: "MEI - Microempreendedor Individual" },
      { value: "me", label: "ME - Microempresa" },
    ], required: true },
    { key: "activity", label: "Atividade Principal (CNAE)", placeholder: "Ex: 9602-5/01 - Cabeleireiros" },
    { key: "monthly_revenue", label: "Faturamento Mensal Estimado (R$)", placeholder: "Ex: 5.000,00" },
    { key: "address", label: "Endereço Comercial", placeholder: "Rua, número, bairro, cidade/UF" },
  ],
  cnpj_closing: [
    { key: "cnpj", label: "CNPJ a Encerrar", placeholder: "00.000.000/0001-00", required: true },
    { key: "company_name", label: "Razão Social", placeholder: "Nome da empresa" },
    { key: "reason", label: "Motivo do Encerramento", type: "textarea", placeholder: "Ex: Encerramento das atividades, mudança de regime, etc." },
    { key: "has_debts", label: "Possui Débitos Fiscais?", type: "select", placeholder: "", options: [
      { value: "no", label: "Não" },
      { value: "yes", label: "Sim" },
      { value: "nao_sei", label: "Não sei" },
    ] },
  ],
  other: [
    { key: "description", label: "Descreva o Serviço", type: "textarea", placeholder: "Detalhe o que precisa para o contador avaliar", required: true },
  ],
};

function parseRequiredFields(rf: any[]): DynamicField[] {
  if (!Array.isArray(rf)) return [];
  return rf.map((f: any) => ({
    key: f.key || "",
    label: f.label || f.key || "",
    placeholder: f.placeholder || "",
    type: (f.type || "text") as "text" | "select" | "textarea",
    options: f.options,
    required: !!f.required,
  })).filter(f => f.key);
}

export default function SolicitarServicoFiscalPage() {
  const { user, getPrimaryRole } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState("cnpj_opening");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [requestAsCompany, setRequestAsCompany] = useState(false);
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [allowMatching, setAllowMatching] = useState(true);

  useEffect(() => {
    (supabase as any).from("fiscal_service_types").select("service_type, label, price, required_fields").eq("status", "approved").eq("is_active", true).then(({ data }: any) => {
      setServices(data || []);
    });
  }, []);

  const serviceMap = Object.fromEntries((services || []).map(s => [s.service_type, s]));
  const SERVICE_LABELS = Object.fromEntries(services.length ? services.map(s => [s.service_type, s.label]) : Object.entries(SERVICE_LABELS_FALLBACK));
  const getFieldsForType = (type: string) => {
    const s = serviceMap[type];
    if (s?.required_fields) {
      const parsed = parseRequiredFields(s.required_fields);
      if (parsed.length) return parsed;
    }
    return SERVICE_FIELDS_FALLBACK[type] || [];
  };
  const getPriceForType = (type: string) => {
    const s = serviceMap[type];
    return s ? Number(s.price) : 0;
  };

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("fiscal_service_requests")
      .select("*")
      .eq("client_user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const primaryRole = getPrimaryRole();
  const canRequestAsCompany = primaryRole === "dono";

  useEffect(() => {
    if (!user) return;
    if (!canRequestAsCompany) {
      setRequestAsCompany(false);
      setBarbershopId(null);
      return;
    }

    supabase
      .from("barbershops")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setBarbershopId(data?.id || null);
      });
  }, [user, canRequestAsCompany]);

  const openForm = (type: string) => {
    setServiceType(type);
    setFields({});
    setNotes("");
    setAllowMatching(true);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate required fields
    const requiredFields = getFieldsForType(serviceType).filter(f => f.required);
    const missing = requiredFields.filter(f => !fields[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.map(f => f.label).join(", ")}`);
      return;
    }

    setSaving(true);

    // Build description with all fields for the accountant
    const dynamicFields = getFieldsForType(serviceType);
    const descriptionParts = dynamicFields
      .filter(f => fields[f.key]?.trim())
      .map(f => {
        let val = fields[f.key];
        if (f.type === "select" && f.options) {
          const opt = f.options.find(o => o.value === val);
          if (opt) val = opt.label;
        }
        return `${f.label}: ${val}`;
      });
    if (notes.trim()) descriptionParts.push(`Observações: ${notes}`);

    const description = descriptionParts.join("\n");

    const requestedByRole = (primaryRole || "cliente");

    if (requestAsCompany) {
      if (!canRequestAsCompany) {
        toast.error("Apenas o dono pode solicitar serviços em nome da empresa.");
        return;
      }
      if (!barbershopId) {
        toast.error("Nenhuma barbearia encontrada para sua conta. Conclua o cadastro da barbearia.");
        return;
      }
    }

    const { error } = await supabase.from("fiscal_service_requests").insert({
      client_user_id: user.id,
      requested_by_user_id: user.id,
      requested_by_role: requestedByRole,
      is_company_request: requestAsCompany,
      barbershop_id: requestAsCompany ? barbershopId : null,
      allow_accountant_matching: allowMatching,
      service_type: serviceType,
      description,
    } as any);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Pedido enviado ao contador com todos os dados!");
    setShowForm(false);
    setFields({});
    setNotes("");
    setRequestAsCompany(false);
    fetchRequests();
  };

  const currentFields = getFieldsForType(serviceType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Serviços Contábeis</h1>
          <p className="text-muted-foreground text-sm">Solicite abertura de CNPJ, declarações e mais</p>
        </div>
        <Button variant="gold" onClick={() => openForm("cnpj_opening")} className="w-full sm:w-auto">
          <ClipboardList className="w-4 h-4 mr-2" />Solicitar
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Novo Pedido — {SERVICE_LABELS[serviceType] || SERVICE_LABELS_FALLBACK[serviceType]}</CardTitle>
            <CardDescription>Preencha os dados para o contador processar seu pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canRequestAsCompany && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Pedido em nome da empresa</p>
                    <p className="text-xs text-muted-foreground">
                      Marque para enviar este pedido como barbearia (dono). O contador só terá acesso aos dados da empresa com autorização.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={requestAsCompany}
                    onChange={(e) => setRequestAsCompany(e.target.checked)}
                  />
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Permitir que um contador aceite seu pedido</p>
                  <p className="text-xs text-muted-foreground">
                    Se desmarcar, o pedido só será visível para o contador após atribuição (por você ou Super Admin).
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={allowMatching}
                  onChange={(e) => setAllowMatching(e.target.checked)}
                />
              </div>
            </div>

            {/* Service type selector */}
            <div>
              <Label>Tipo de Serviço</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-muted/30 px-4 py-2 text-sm mt-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={serviceType}
                onChange={(e) => { setServiceType(e.target.value); setFields({}); }}
              >
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentFields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === "select" ? (
                    <select
                      className="flex h-11 w-full rounded-lg border border-input bg-muted/30 px-4 py-2 text-sm mt-1"
                      value={fields[field.key] || ""}
                      onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      className="mt-1 min-h-[80px]"
                      placeholder={field.placeholder}
                      value={fields[field.key] || ""}
                      onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      placeholder={field.placeholder}
                      value={fields[field.key] || ""}
                      onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Extra notes */}
            {serviceType !== "other" && (
              <div>
                <Label>Observações Adicionais</Label>
                <Textarea
                  className="mt-1 min-h-[60px]"
                  placeholder="Informações extras que ajudem o contador..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="gold" onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Enviando..." : "Enviar Pedido"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available services grid - mobile friendly */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { key: "cnpj_opening", icon: "🏢", desc: "Abrir MEI ou ME" },
          { key: "mei_declaration", icon: "📋", desc: "DASN-SIMEI anual" },
          { key: "me_declaration", icon: "📊", desc: "Declaração ME" },
          { key: "income_tax", icon: "💰", desc: "Declaração IRPF" },
          { key: "cnpj_migration", icon: "🔄", desc: "CPF → CNPJ" },
          { key: "cnpj_closing", icon: "🚫", desc: "Encerrar CNPJ" },
          { key: "other", icon: "📝", desc: "Outros serviços" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => openForm(s.key)}
            className="p-3 rounded-xl border border-border bg-card text-center hover:border-primary/50 hover:bg-primary/5 transition-colors active:scale-95"
          >
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xs font-medium leading-tight">{SERVICE_LABELS[s.key] || SERVICE_LABELS_FALLBACK[s.key]}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
            {getPriceForType(s.key) > 0 && <p className="text-xs font-bold text-primary mt-1">R$ {getPriceForType(s.key).toFixed(2)}</p>}
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
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{SERVICE_LABELS[r.service_type] || r.service_type}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{r.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {r.notes && (
                        <p className="text-xs text-primary mt-1 italic">Resposta: {r.notes}</p>
                      )}
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
}
