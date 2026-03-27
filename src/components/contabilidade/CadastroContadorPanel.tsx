// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserCheck, Plus, Loader2, Search, CheckCircle, XCircle,
  Clock, Edit2, Save, X, Phone, Mail, MapPin, Building2
} from "lucide-react";

interface Contador {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  crc_registro: string | null;
  empresa_contabil: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  status_verificado: string;
  bio: string | null;
  is_active: boolean;
  aceita_novos_clientes: boolean;
  valor_mensalidade: number | null;
  commission_mei: number | null;
  commission_me: number | null;
  commission_declaration: number | null;
}

const STATUS_CONFIG = {
  pending:  { label: "Pendente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="w-3 h-3" /> },
  verified: { label: "Verificado", color: "bg-green-500/10 text-green-600 border-green-500/20",  icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-600 border-red-500/20",         icon: <XCircle className="w-3 h-3" /> },
};

const EMPTY_FORM = {
  name: "", email: "", whatsapp: "", cpf_cnpj: "",
  crc_registro: "", empresa_contabil: "", cidade: "", estado: "",
  telefone: "", bio: "", valor_mensalidade: "",
  commission_mei: "", commission_me: "", commission_declaration: "",
};

export function CadastroContadorPanel() {
  const [contadores, setContadores] = useState<Contador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchContadores(); }, []);

  const fetchContadores = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("accountants")
      .select("id, name, email, whatsapp, cpf_cnpj, crc_registro, empresa_contabil, cidade, estado, telefone, status_verificado, bio, is_active, aceita_novos_clientes, valor_mensalidade, commission_mei, commission_me, commission_declaration")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setContadores((data as Contador[]) || []);
  };

  const handleEditar = (c: Contador) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      email: c.email,
      whatsapp: c.whatsapp || "",
      cpf_cnpj: c.cpf_cnpj || "",
      crc_registro: c.crc_registro || "",
      empresa_contabil: c.empresa_contabil || "",
      cidade: c.cidade || "",
      estado: c.estado || "",
      telefone: c.telefone || "",
      bio: c.bio || "",
      valor_mensalidade: c.valor_mensalidade != null ? String(c.valor_mensalidade) : "",
      commission_mei: c.commission_mei != null ? String(c.commission_mei) : "",
      commission_me: c.commission_me != null ? String(c.commission_me) : "",
      commission_declaration: c.commission_declaration != null ? String(c.commission_declaration) : "",
    });
    setShowForm(true);
  };

  const handleSalvar = async () => {
    if (!form.name || !form.email) { toast.error("Nome e email são obrigatórios."); return; }
    setSaving(true);
    const payload = {
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp || null,
      cpf_cnpj: form.cpf_cnpj || null,
      crc_registro: form.crc_registro || null,
      empresa_contabil: form.empresa_contabil || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      telefone: form.telefone || null,
      bio: form.bio || null,
      valor_mensalidade: form.valor_mensalidade ? Number(form.valor_mensalidade) : null,
      commission_mei: form.commission_mei ? Number(form.commission_mei) : 0,
      commission_me: form.commission_me ? Number(form.commission_me) : 0,
      commission_declaration: form.commission_declaration ? Number(form.commission_declaration) : 0,
    };

    if (editId) {
      const { error } = await (supabase as any).from("accountants").update(payload).eq("id", editId);
      setSaving(false);
      if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
      toast.success("Contador atualizado!");
    } else {
      toast.error("Novo cadastro de contador precisa de um user_id. Use via cadastro do próprio contador.");
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    await fetchContadores();
  };

  const handleVerificar = async (id: string, status: "verified" | "rejected") => {
    const { error } = await (supabase as any)
      .from("accountants")
      .update({ status_verificado: status, is_active: status === "verified" })
      .eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(status === "verified" ? "Contador verificado!" : "Contador rejeitado.");
    await fetchContadores();
  };

  const handleToggleAtivo = async (id: string, atual: boolean) => {
    const { error } = await (supabase as any)
      .from("accountants")
      .update({ is_active: !atual })
      .eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(atual ? "Contador desativado." : "Contador ativado.");
    await fetchContadores();
  };

  const filtrados = contadores.filter((c) =>
    busca === "" ||
    c.name.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cidade || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Contadores Cadastrados</h2>
          <p className="text-sm text-muted-foreground">Gerencie verificação e dados dos contadores</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 w-48"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editId ? "Editar Contador" : "Novo Contador"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Nome Completo *", type: "text" },
                { key: "email", label: "Email *", type: "email" },
                { key: "whatsapp", label: "WhatsApp", type: "text" },
                { key: "cpf_cnpj", label: "CPF/CNPJ", type: "text" },
                { key: "crc_registro", label: "Registro CRC", type: "text" },
                { key: "empresa_contabil", label: "Empresa Contábil", type: "text" },
                { key: "cidade", label: "Cidade", type: "text" },
                { key: "estado", label: "Estado (UF)", type: "text" },
                { key: "telefone", label: "Telefone Comercial", type: "text" },
                { key: "valor_mensalidade", label: "Mensalidade (R$)", type: "number" },
                { key: "commission_mei", label: "Comissão MEI (R$)", type: "number" },
                { key: "commission_me", label: "Comissão ME (R$)", type: "number" },
                { key: "commission_declaration", label: "Comissão Declaração (R$)", type: "number" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type={type}
                    className="mt-1"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label>Bio / Apresentação</Label>
              <Input
                className="mt-1"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Descreva a especialidade e experiência do contador"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleSalvar} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum contador cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => {
            const sc = STATUS_CONFIG[c.status_verificado as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            return (
              <Card key={c.id} className="border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{c.name}</p>
                        <Badge className={`text-xs ${sc.color} flex items-center gap-1`}>
                          {sc.icon}{sc.label}
                        </Badge>
                        {!c.is_active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                        {c.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.whatsapp}</span>}
                        {c.empresa_contabil && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.empresa_contabil}</span>}
                        {c.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.cidade}/{c.estado}</span>}
                        {c.crc_registro && <span className="text-xs">CRC: {c.crc_registro}</span>}
                      </div>
                      {c.valor_mensalidade != null && c.valor_mensalidade > 0 && (
                        <p className="text-sm text-primary font-medium">
                          Mensalidade: R$ {c.valor_mensalidade.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEditar(c)}>
                        <Edit2 className="w-3 h-3 mr-1" />Editar
                      </Button>
                      {c.status_verificado === "pending" && (
                        <>
                          <Button size="sm" variant="gold"
                            onClick={() => handleVerificar(c.id, "verified")}
                            className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />Verificar
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => handleVerificar(c.id, "rejected")}
                            className="text-xs">
                            <XCircle className="w-3 h-3 mr-1" />Rejeitar
                          </Button>
                        </>
                      )}
                      {c.status_verificado === "verified" && (
                        <Button size="sm" variant="destructive"
                          onClick={() => handleVerificar(c.id, "rejected")}
                          className="text-xs">
                          <XCircle className="w-3 h-3 mr-1" />Revogar
                        </Button>
                      )}
                      {c.status_verificado === "rejected" && (
                        <Button size="sm" variant="outline"
                          onClick={() => handleVerificar(c.id, "verified")}
                          className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />Re-verificar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs"
                        onClick={() => handleToggleAtivo(c.id, c.is_active)}>
                        {c.is_active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
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

export default CadastroContadorPanel;
