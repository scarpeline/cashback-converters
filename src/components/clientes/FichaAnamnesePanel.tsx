import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Plus, Search, User, FileText, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ficha {
  id: string;
  barbershop_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  data_nascimento?: string;
  alergias?: string;
  medicamentos?: string;
  condicoes_saude?: string;
  observacoes?: string;
  assinatura_digital?: boolean;
  assinado_em?: string;
  created_at: string;
}

function FichaForm({ onClose }: { onClose: () => void }) {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    cliente_nome: "", cliente_telefone: "", data_nascimento: "",
    alergias: "", medicamentos: "", condicoes_saude: "", observacoes: "",
  });

  const save = async () => {
    if (!barbershop || !form.cliente_nome) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const { error } = await (supabase as any).from("fichas_anamnese").insert({
      barbershop_id: barbershop.id,
      ...form,
      data_nascimento: form.data_nascimento || null,
      assinatura_digital: false,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ficha cadastrada!");
    qc.invalidateQueries({ queryKey: ["fichas"] });
    onClose();
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nome do Cliente *</Label>
          <Input placeholder="Nome completo" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
        </div>
        <div>
          <Label>Telefone / WhatsApp</Label>
          <Input placeholder="(00) 00000-0000" value={form.cliente_telefone} onChange={e => setForm(f => ({ ...f, cliente_telefone: e.target.value }))} />
        </div>
        <div>
          <Label>Data de Nascimento</Label>
          <Input type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Alergias</Label>
        <Textarea placeholder="Descreva alergias conhecidas..." rows={2} value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} />
      </div>
      <div>
        <Label>Medicamentos em uso</Label>
        <Textarea placeholder="Liste medicamentos em uso..." rows={2} value={form.medicamentos} onChange={e => setForm(f => ({ ...f, medicamentos: e.target.value }))} />
      </div>
      <div>
        <Label>Condições de Saúde</Label>
        <Textarea placeholder="Diabetes, hipertensão, etc..." rows={2} value={form.condicoes_saude} onChange={e => setForm(f => ({ ...f, condicoes_saude: e.target.value }))} />
      </div>
      <div>
        <Label>Observações Gerais</Label>
        <Textarea placeholder="Preferências, histórico de serviços..." rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={save}>Salvar Ficha</Button>
      </div>
    </div>
  );
}

export function FichaAnamnesePanel() {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: fichas = [], isLoading } = useQuery({
    queryKey: ["fichas", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await (supabase as any)
        .from("fichas_anamnese")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ficha[];
    },
    enabled: !!barbershop?.id,
  });

  const assinar = async (id: string) => {
    const { error } = await (supabase as any).from("fichas_anamnese")
      .update({ assinatura_digital: true, assinado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Ficha assinada digitalmente!");
    qc.invalidateQueries({ queryKey: ["fichas"] });
  };

  const filtered = fichas.filter(f =>
    f.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
    f.cliente_telefone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Nova Ficha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Ficha de Anamnese</DialogTitle></DialogHeader>
            <FichaForm onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma ficha encontrada</p>
          <p className="text-sm mt-1">Cadastre a ficha de anamnese dos seus clientes</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(ficha => (
            <Card key={ficha.id} className="border-slate-200 hover:border-orange-200 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{ficha.cliente_nome}</p>
                      <p className="text-xs text-slate-500">{ficha.cliente_telefone}</p>
                      {ficha.data_nascimento && (
                        <p className="text-xs text-slate-400">
                          Nasc: {format(new Date(ficha.data_nascimento + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ficha.assinatura_digital ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Assinada
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => assinar(ficha.id)}>
                        <FileText className="w-3 h-3 mr-1" /> Assinar
                      </Button>
                    )}
                  </div>
                </div>
                {(ficha.alergias || ficha.medicamentos || ficha.condicoes_saude) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ficha.alergias && (
                      <div className="text-xs bg-red-50 rounded-lg p-2">
                        <span className="font-semibold text-red-600">Alergias:</span>
                        <p className="text-red-500 mt-0.5">{ficha.alergias}</p>
                      </div>
                    )}
                    {ficha.medicamentos && (
                      <div className="text-xs bg-blue-50 rounded-lg p-2">
                        <span className="font-semibold text-blue-600">Medicamentos:</span>
                        <p className="text-blue-500 mt-0.5">{ficha.medicamentos}</p>
                      </div>
                    )}
                    {ficha.condicoes_saude && (
                      <div className="text-xs bg-yellow-50 rounded-lg p-2">
                        <span className="font-semibold text-yellow-600">Condições:</span>
                        <p className="text-yellow-500 mt-0.5">{ficha.condicoes_saude}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
