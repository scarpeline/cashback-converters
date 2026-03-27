import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Mode = "owner" | "accountant";

type TaxGuideStatus = "draft" | "pending" | "paid" | "overdue" | "archived";

type TaxGuideRow = {
  id: string;
  barbershop_id: string;
  tax_type: string;
  reference_period: string | null;
  due_date: string | null;
  amount: number | null;
  status: TaxGuideStatus;
  guide_document_id: string | null;
  notes: string | null;
  created_at: string;
};

type LinkedBarbershop = {
  id: string;
  name: string | null;
};

export function AccountingTaxesPanel({
  mode,
  barbershopId,
}: {
  mode: Mode;
  barbershopId?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guides, setGuides] = useState<TaxGuideRow[]>([]);

  const [linkedBarbershops, setLinkedBarbershops] = useState<LinkedBarbershop[]>([]);
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string | null>(barbershopId || null);

  const [taxType, setTaxType] = useState("das");
  const [referencePeriod, setReferencePeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TaxGuideStatus>("pending");
  const [guideDocumentId, setGuideDocumentId] = useState("");
  const [notes, setNotes] = useState("");

  const title = useMemo(() => {
    return "Impostos & Guias";
  }, []);

  const description = useMemo(() => {
    return mode === "owner"
      ? "Cadastre e acompanhe guias (DAS, DARF, GPS, ISS etc.) vinculadas à sua barbearia."
      : "Cadastre e acompanhe guias (DAS, DARF, GPS, ISS etc.) de empresas com vínculo ativo.";
  }, [mode]);

  const taxTypeOptions = useMemo(
    () => [
      { value: "das", label: "DAS" },
      { value: "darf", label: "DARF" },
      { value: "gps", label: "GPS" },
      { value: "iss", label: "ISS" },
      { value: "irpj", label: "IRPJ" },
      { value: "csll", label: "CSLL" },
      { value: "other", label: "Outro" },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: "draft", label: "Rascunho" },
      { value: "pending", label: "Pendente" },
      { value: "paid", label: "Pago" },
      { value: "overdue", label: "Vencido" },
      { value: "archived", label: "Arquivado" },
    ],
    [],
  );

  const fetchLinkedBarbershops = async () => {
    if (mode !== "accountant") return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    if (authErr || !currentUserId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const { data: accountantRow, error: accountantErr } = await (supabase as any)
      .from("accountants")
      .select("id")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (accountantErr) {
      toast.error(accountantErr.message);
      return;
    }

    const accountantId = (accountantRow as any)?.id as string | undefined;
    if (!accountantId) {
      return;
    }

    const { data: linkRows, error: linksErr } = await db
      .from("accountant_barbershop_links")
      .select("barbershop_id, barbershops(name)")
      .eq("accountant_id", accountantId)
      .eq("status", "active")
      .order("requested_at", { ascending: false });

    if (linksErr) {
      toast.error(linksErr.message);
      return;
    }

    const mapped = (linkRows || []).map((r: any) => ({
      id: r.barbershop_id,
      name: r.barbershops?.name || null,
    }));

    setLinkedBarbershops(mapped);
    if (!selectedBarbershopId && mapped[0]?.id) {
      setSelectedBarbershopId(mapped[0].id);
    }
  };

  const fetchGuides = async () => {
    setLoading(true);

    const effectiveBarbershopId = mode === "owner" ? barbershopId : selectedBarbershopId;
    if (!effectiveBarbershopId) {
      setGuides([]);
      setLoading(false);
      return;
    }

    const { data, error } = await db
      .from("accounting_tax_guides")
      .select("id,barbershop_id,tax_type,reference_period,due_date,amount,status,guide_document_id,notes,created_at")
      .eq("barbershop_id", effectiveBarbershopId)
      .order("due_date", { ascending: true, nullsFirst: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setGuides((data || []) as any);
  };

  useEffect(() => {
    fetchLinkedBarbershops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === "owner") {
      setSelectedBarbershopId(barbershopId || null);
    }
  }, [mode, barbershopId]);

  useEffect(() => {
    fetchGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, barbershopId, selectedBarbershopId]);

  const createGuide = async () => {
    const effectiveBarbershopId = mode === "owner" ? barbershopId : selectedBarbershopId;
    if (!effectiveBarbershopId) {
      toast.error("Selecione uma barbearia.");
      return;
    }

    setSaving(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    if (authErr || !currentUserId) {
      setSaving(false);
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const payload: any = {
      barbershop_id: effectiveBarbershopId,
      tax_type: taxType,
      reference_period: referencePeriod.trim() || null,
      due_date: dueDate || null,
      amount: amount ? Number(amount) : null,
      status,
      guide_document_id: guideDocumentId.trim() || null,
      notes: notes.trim() || null,
      created_by_user_id: currentUserId,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("accounting_tax_guides").insert(payload as never);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Guia cadastrada!");
    setReferencePeriod("");
    setDueDate("");
    setAmount("");
    setNotes("");
    setGuideDocumentId("");
    await fetchGuides();
  };

  const updateGuideStatus = async (id: string, next: TaxGuideStatus) => {
    setSaving(true);

    const { error } = await db
      .from("accounting_tax_guides")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setGuides(guides.map((g) => (g.id === id ? { ...g, status: next } : g)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {mode === "accountant" && (
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
            <CardDescription>Selecione uma empresa vinculada para visualizar as guias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Barbearia vinculada</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedBarbershopId || ""}
                onChange={(e) => setSelectedBarbershopId(e.target.value || null)}
              >
                <option value="">Selecione...</option>
                {linkedBarbershops.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.id}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nova guia</CardTitle>
          <CardDescription>Cadastre a guia para acompanhar vencimento e status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
              >
                {taxTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Competência (referência)</Label>
              <Input value={referencePeriod} onChange={(e) => setReferencePeriod(e.target.value)} placeholder="Ex: 2026-03" />
            </div>

            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaxGuideStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>ID do documento (opcional)</Label>
              <Input value={guideDocumentId} onChange={(e) => setGuideDocumentId(e.target.value)} placeholder="Cole o ID do documento em Documentos Contábeis" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: guia gerada pelo contador, aguarda pagamento..." />
            </div>
          </div>

          <Button variant="gold" onClick={createGuide} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cadastrar guia
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guias</CardTitle>
          <CardDescription>Lista de guias cadastradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : guides.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma guia encontrada.</div>
          ) : (
            <div className="space-y-3">
              {guides.map((g) => (
                <div key={g.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {(taxTypeOptions.find((o) => o.value === g.tax_type)?.label || g.tax_type).toUpperCase()} {g.reference_period ? `• ${g.reference_period}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {g.due_date ? new Date(g.due_date).toLocaleDateString("pt-BR") : "-"} • Valor: {g.amount != null ? `R$ ${Number(g.amount).toFixed(2)}` : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {g.status}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      value={g.status}
                      onChange={(e) => updateGuideStatus(g.id, e.target.value as TaxGuideStatus)}
                      disabled={saving}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
