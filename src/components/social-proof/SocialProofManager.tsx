import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Trash2, Megaphone, Edit, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PAGE_OPTIONS = [
  { value: "landing", label: "Landing Page" },
  { value: "login", label: "Página de Login" },
  { value: "painel-dono", label: "Painel Dono" },
  { value: "painel-profissional", label: "Painel Profissional" },
  { value: "app-cliente", label: "Painel Cliente" },
  { value: "afiliado-saas", label: "Painel Afiliado" },
  { value: "all", label: "Todas as Páginas" },
];

interface SocialProofManagerProps {
  /** If provided, restricts to barbershop-level proofs */
  barbershopId?: string;
  /** Whether to show page selector (super admin only) */
  showPageSelector?: boolean;
}

export function SocialProofManager({ barbershopId, showPageSelector = false }: SocialProofManagerProps) {
  const { user } = useAuth();
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    message: "",
    type: "fake" as "fake" | "real",
    pages: ["landing"] as string[],
    action_type: "none" as "none" | "vitrine" | "agendar",
    show_in_vitrine: false,
    booking_link: "",
  });

  const fetchProofs = async () => {
    let query = supabase.from("social_proofs").select("*").order("created_at", { ascending: false });
    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }
    const { data } = await query;
    setProofs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProofs(); }, [barbershopId]);

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setShowForm(true);
    setForm({
      message: p.message,
      type: (p.type === "real" ? "real" : "fake") as "fake" | "real",
      pages: Array.isArray(p.pages) ? p.pages : ["landing"],
      action_type: (p.action_type || "none") as "none" | "vitrine" | "agendar",
      show_in_vitrine: !!p.show_in_vitrine,
      booking_link: p.booking_link || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ message: "", type: "fake", pages: ["landing"], action_type: "none", show_in_vitrine: false, booking_link: "" });
  };

  const handleSave = async () => {
    if (!form.message.trim()) { toast.error("Preencha a mensagem."); return; }
    if (showPageSelector && form.pages.length === 0) { toast.error("Selecione ao menos uma página."); return; }
    setSaving(true);

    const payload: any = {
      message: form.message.trim(),
      type: form.type,
      pages: form.pages,
      action_type: form.action_type,
      show_in_vitrine: form.show_in_vitrine,
      booking_link: form.booking_link || null,
    };
    if (barbershopId) payload.barbershop_id = barbershopId;

    if (editingId) {
      const { error } = await supabase.from("social_proofs").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) { console.error("Social proof update error:", error); toast.error("Erro ao atualizar: " + error.message); return; }
      toast.success("Prova social atualizada!");
    } else {
      payload.created_by = user?.id;
      payload.is_active = true;
      const { error } = await supabase.from("social_proofs").insert(payload);
      setSaving(false);
      if (error) { console.error("Social proof insert error:", error); toast.error("Erro ao criar: " + error.message); return; }
      toast.success("Prova social criada!");
    }
    setShowForm(false);
    resetForm();
    fetchProofs();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("social_proofs").update({ is_active: !current }).eq("id", id);
    fetchProofs();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("social_proofs").delete().eq("id", id);
    toast.success("Removido!");
    fetchProofs();
  };

  const togglePage = (page: string) => {
    if (page === "all") {
      setForm({ ...form, pages: form.pages.includes("all") ? [] : ["all"] });
      return;
    }
    const newPages = form.pages.filter(p => p !== "all");
    if (newPages.includes(page)) {
      setForm({ ...form, pages: newPages.filter(p => p !== page) });
    } else {
      setForm({ ...form, pages: [...newPages, page] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6" /> Prova Social
          </h1>
          <p className="text-muted-foreground text-sm">Popups de atividade recente para aumentar conversões</p>
        </div>
        <Button variant="gold" onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />Nova Prova
        </Button>
      </div>

      {(showForm || editingId) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Prova Social" : "Criar Prova Social"}</CardTitle>
            <CardDescription>Mensagens aparecem como popups. Configure ações: vitrine ou link de agendamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Mensagem <span className="text-destructive">*</span></Label>
              <Input
                className="mt-1"
                placeholder='Ex: "João acabou de agendar um corte!"'
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={form.type === "fake" ? "gold" : "outline"} size="sm" onClick={() => setForm({ ...form, type: "fake" })}>🎭 Fake</Button>
                <Button variant={form.type === "real" ? "gold" : "outline"} size="sm" onClick={() => setForm({ ...form, type: "real" })}>✅ Real</Button>
              </div>
            </div>
            <div>
              <Label>Ação ao clicar</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Button variant={form.action_type === "none" ? "gold" : "outline"} size="sm" onClick={() => setForm({ ...form, action_type: "none" })}>Nenhuma</Button>
                <Button variant={form.action_type === "vitrine" ? "gold" : "outline"} size="sm" onClick={() => setForm({ ...form, action_type: "vitrine", show_in_vitrine: true })}>Vitrine</Button>
                <Button variant={form.action_type === "agendar" ? "gold" : "outline"} size="sm" onClick={() => setForm({ ...form, action_type: "agendar" })}>Agendar</Button>
              </div>
            </div>
            {form.action_type === "agendar" && (
              <div>
                <Label>Link de Agendamento</Label>
                <Input placeholder="https://..." value={form.booking_link} onChange={(e) => setForm({ ...form, booking_link: e.target.value })} className="mt-1" />
              </div>
            )}
            {form.action_type === "vitrine" && (
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_vitrine} onCheckedChange={v => setForm({ ...form, show_in_vitrine: v })} />
                <Label>Exibir em Vitrine</Label>
              </div>
            )}
            {showPageSelector && (
              <div>
                <Label>Páginas</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {PAGE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer text-sm">
                      <Checkbox checked={form.pages.includes(opt.value)} onCheckedChange={() => togglePage(opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="gold" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Salvando..." : (editingId ? "Salvar" : "Criar")}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="w-full sm:w-auto">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing proofs list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : proofs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma prova social cadastrada.</p>
            <p className="text-sm text-muted-foreground mt-1">Crie popups para aumentar a confiança dos visitantes!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proofs.map((p) => (
            <Card key={p.id} className={!p.is_active ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.message}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.type === "real" ? "bg-primary/10 text-primary" : "bg-secondary/20 text-secondary-foreground"}`}>
                        {p.type === "real" ? "✅ Real" : "🎭 Fake"}
                      </span>
                      {p.action_type === "vitrine" && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">Vitrine</span>}
                      {p.action_type === "agendar" && p.booking_link && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" />Agendar</span>}
                      {showPageSelector && Array.isArray(p.pages) && p.pages.map((pg: string) => (
                        <span key={pg} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {PAGE_OPTIONS.find(o => o.value === pg)?.label || pg}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
