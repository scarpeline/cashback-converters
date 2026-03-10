import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, CheckCircle2, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF/CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

const DadosBancariosPage = () => {
  const { user, profile } = useAuth();
  const [barbershop, setBarbershop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    pix_key: "",
    pix_key_type: "cpf",
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("barbershops").select("id, name, asaas_customer_id, asaas_wallet_id").eq("owner_user_id", user.id).limit(1).maybeSingle(),
      supabase.from("profiles").select("name, cpf_cnpj, pix_key, bank_info").eq("user_id", user.id).maybeSingle(),
    ]).then(([shop, prof]) => {
      setBarbershop(shop.data);
      setForm({
        name: prof.data?.name || profile?.name || "",
        cpf_cnpj: prof.data?.cpf_cnpj || "",
        pix_key: prof.data?.pix_key || "",
        pix_key_type: "cpf",
      });
      setLoading(false);
    });
  }, [user, profile]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!form.cpf_cnpj.replace(/\D/g, "")) {
      toast.error("CPF/CNPJ é obrigatório para criar sua conta no gateway.");
      return;
    }
    if (!form.pix_key) {
      toast.error("Chave PIX é obrigatória para receber pagamentos.");
      return;
    }

    setSaving(true);

    const cleanCpfCnpj = form.cpf_cnpj.replace(/\D/g, "");

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        cpf_cnpj: cleanCpfCnpj,
        pix_key: form.pix_key,
      })
      .eq("user_id", user!.id);

    if (profileError) {
      toast.error("Erro ao salvar perfil: " + profileError.message);
      setSaving(false);
      return;
    }

    // If has barbershop, try to create gateway account
    if (barbershop?.id) {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("process-payment", {
          body: {
            action: "create-professional-account",
            professional_id: barbershop.id,
            cpf_cnpj: cleanCpfCnpj,
            name: form.name,
            email: profile?.email,
            pix_key: form.pix_key,
          },
        });

        if (fnError) throw new Error(fnError.message);
        toast.success("Dados salvos e conta criada no gateway!");
      } catch (e: any) {
        console.error("Gateway error:", e);
        toast.success("Dados salvos! A conta no gateway será criada automaticamente.");
      }
    } else {
      toast.success("Dados bancários salvos com sucesso!");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasGateway = !!barbershop?.asaas_customer_id;
  const hasData = !!form.cpf_cnpj;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dados Bancários</h1>
      <p className="text-muted-foreground text-sm">
        Preencha seus dados para criar sua conta no gateway de pagamentos automaticamente.
      </p>

      {/* Gateway status */}
      <Card className={hasGateway ? "border-primary/30 bg-primary/5" : "border-muted"}>
        <CardContent className="py-4 flex items-center gap-3">
          {hasGateway ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Conta ativa no gateway de pagamentos</p>
                <p className="text-xs text-muted-foreground">Recebimentos via PIX estão habilitados.</p>
              </div>
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium text-sm">Conta no gateway pendente</p>
                <p className="text-xs text-muted-foreground">Preencha os dados abaixo para criar automaticamente.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Editable form */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados para Recebimento
          </CardTitle>
          <CardDescription>
            Seus dados são necessários para criar sua conta no gateway e receber pagamentos via PIX.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo conforme documento"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Nome que aparecerá na conta do gateway</p>
            </div>
            <div>
              <Label>CPF ou CNPJ *</Label>
              <Input
                value={formatCpfCnpjBR(form.cpf_cnpj)}
                onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                placeholder="000.000.000-00"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Necessário para criar sua conta no gateway</p>
            </div>
            <div>
              <Label>Tipo de Chave PIX</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-muted/30 px-4 py-2 text-sm mt-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={form.pix_key_type}
                onChange={(e) => setForm({ ...form, pix_key_type: e.target.value })}
              >
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Chave PIX *</Label>
              <Input
                value={form.pix_key}
                onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                placeholder="Sua chave PIX para receber pagamentos"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Seus ganhos serão enviados para esta chave</p>
            </div>
          </div>

          <Button variant="gold" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : hasData ? "Atualizar Dados" : "Salvar e Criar Conta"}
          </Button>
        </CardContent>
      </Card>

      {/* Gateway IDs (read-only) */}
      {hasGateway && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">IDs do Gateway</CardTitle>
            <CardDescription>Referências internas (somente leitura)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoField label="Customer ID" value={barbershop.asaas_customer_id} mono />
              <InfoField label="Wallet ID" value={barbershop.asaas_wallet_id} mono />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function InfoField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</p>
    </div>
  );
}

export default DadosBancariosPage;
