import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpCircle, ArrowDownCircle, Plus, CheckCircle, Clock, AlertCircle, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ContaType = "pagar" | "receber";
type ContaStatus = "pendente" | "pago" | "vencido" | "cancelado";

interface Conta {
  id: string;
  barbershop_id: string;
  tipo: ContaType;
  descricao: string;
  valor: number;
  vencimento: string;
  status: ContaStatus;
  categoria: string;
  observacao?: string;
  created_at: string;
}

const CATEGORIAS_PAGAR = ["Aluguel", "Fornecedor", "Salário", "Energia", "Água", "Internet", "Equipamento", "Marketing", "Outros"];
const CATEGORIAS_RECEBER = ["Serviço", "Produto", "Pacote", "Mensalidade", "Outros"];

const statusConfig: Record<ContaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
  pago:     { label: "Pago",     color: "bg-green-100 text-green-700 border-green-200",   icon: <CheckCircle className="w-3 h-3" /> },
  vencido:  { label: "Vencido",  color: "bg-red-100 text-red-700 border-red-200",         icon: <AlertCircle className="w-3 h-3" /> },
  cancelado:{ label: "Cancelado",color: "bg-slate-100 text-slate-500 border-slate-200",   icon: <Trash2 className="w-3 h-3" /> },
};

function ContaForm({ tipo, onClose }: { tipo: ContaType; onClose: () => void }) {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    descricao: "", valor: "", vencimento: "", categoria: "", observacao: "",
  });

  const save = async () => {
    if (!barbershop || !form.descricao || !form.valor || !form.vencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const { error } = await (supabase as any).from("contas_financeiras").insert({
      barbershop_id: barbershop.id,
      tipo,
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(",", ".")),
      vencimento: form.vencimento,
      categoria: form.categoria || "Outros",
      observacao: form.observacao || null,
      status: "pendente",
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Conta a ${tipo} cadastrada!`);
    qc.invalidateQueries({ queryKey: ["contas"] });
    onClose();
  };

  const categorias = tipo === "pagar" ? CATEGORIAS_PAGAR : CATEGORIAS_RECEBER;

  return (
    <div className="space-y-4">
      <div>
        <Label>Descrição *</Label>
        <Input placeholder="Ex: Aluguel do espaço" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Valor (R$) *</Label>
          <Input placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
        </div>
        <div>
          <Label>Vencimento *</Label>
          <Input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Observação</Label>
        <Input placeholder="Opcional" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={save}>Salvar</Button>
      </div>
    </div>
  );
}

export function ContasPanel() {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"todos" | ContaType>("todos");
  const [openPagar, setOpenPagar] = useState(false);
  const [openReceber, setOpenReceber] = useState(false);

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data, error } = await (supabase as any)
        .from("contas_financeiras")
        .select("*")
        .eq("barbershop_id", barbershop.id)
        .order("vencimento", { ascending: true });
      if (error) throw error;
      return data as Conta[];
    },
    enabled: !!barbershop?.id,
  });

  const marcarPago = async (id: string) => {
    const { error } = await (supabase as any).from("contas_financeiras").update({ status: "pago" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marcado como pago!");
    qc.invalidateQueries({ queryKey: ["contas"] });
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta conta?")) return;
    await (supabase as any).from("contas_financeiras").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["contas"] });
  };

  const filtered = filter === "todos" ? contas : contas.filter(c => c.tipo === filter);
  const totalPagar = contas.filter(c => c.tipo === "pagar" && c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalReceber = contas.filter(c => c.tipo === "receber" && c.status === "pendente").reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-red-600 font-medium">A Pagar</p>
              <p className="text-xl font-black text-red-700">R$ {totalPagar.toFixed(2).replace(".", ",")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowDownCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-green-600 font-medium">A Receber</p>
              <p className="text-xl font-black text-green-700">R$ {totalReceber.toFixed(2).replace(".", ",")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(["todos", "pagar", "receber"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
              {f === "todos" ? "Todos" : f === "pagar" ? "A Pagar" : "A Receber"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Dialog open={openPagar} onOpenChange={setOpenPagar}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <Plus className="w-4 h-4 mr-1" /> A Pagar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
              <ContaForm tipo="pagar" onClose={() => setOpenPagar(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={openReceber} onOpenChange={setOpenReceber}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                <Plus className="w-4 h-4 mr-1" /> A Receber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
              <ContaForm tipo="receber" onClose={() => setOpenReceber(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg font-medium">Nenhuma conta encontrada</p>
          <p className="text-sm mt-1">Adicione contas a pagar ou receber acima</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conta => {
            const st = statusConfig[conta.status];
            return (
              <div key={conta.id} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                {conta.tipo === "pagar"
                  ? <ArrowUpCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  : <ArrowDownCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{conta.descricao}</p>
                  <p className="text-xs text-slate-500">
                    {conta.categoria} · Vence {format(new Date(conta.vencimento + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-base ${conta.tipo === "pagar" ? "text-red-600" : "text-green-600"}`}>
                    R$ {conta.valor.toFixed(2).replace(".", ",")}
                  </p>
                  <Badge className={`text-[10px] border ${st.color} flex items-center gap-1 mt-1`}>
                    {st.icon}{st.label}
                  </Badge>
                </div>
                <div className="flex gap-1 ml-2">
                  {conta.status === "pendente" && (
                    <button onClick={() => marcarPago(conta.id)} title="Marcar como pago"
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => excluir(conta.id)} title="Excluir"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
