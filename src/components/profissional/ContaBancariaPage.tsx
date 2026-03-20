import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";

interface ProfessionalBankData {
  name: string;
  cpf_cnpj: string;
  mobile_phone: string;
  pix_key: string;
  pix_key_type: string;
  asaas_wallet_id: string | null;
}

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF/CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

const ContaBancariaPage = () => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<ProfessionalBankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    mobile_phone: "",
    pix_key: "",
    pix_key_type: "cpf",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await (supabase as any)
        .from("professionals")
        .select("id, name, cpf_cnpj, whatsapp, pix_key, asaas_wallet_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof) {
        setProfessionalId(prof.id);
        const ph = (prof as any).whatsapp || "";
        const bankData: ProfessionalBankData = {
          name: prof.name || "",
          cpf_cnpj: prof.cpf_cnpj || "",
          mobile_phone: typeof ph === "string" ? ph.replace(/\D/g, "") : "",
          pix_key: prof.pix_key || "",
          pix_key_type: "cpf",
          asaas_wallet_id: prof.asaas_wallet_id,
        };
        setData(bankData);
        setForm({
          name: prof.name || profile?.name || "",
          cpf_cnpj: prof.cpf_cnpj || "",
          mobile_phone: bankData.mobile_phone,
          pix_key: prof.pix_key || "",
          pix_key_type: "cpf",
        });
      } else {
        setForm(f => ({ ...f, name: profile?.name || "" }));
      }
      setLoading(false);
    })();
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
    const phoneDigits = form.mobile_phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Telefone/WhatsApp é obrigatório para criar conta no gateway (formato: 11999990000).");
      return;
    }

    setSaving(true);

    // Save to professionals table
    const updatePayload: Record<string, string> = {
      name: form.name,
      cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
      pix_key: form.pix_key,
    };
    if (phoneDigits.length >= 10) (updatePayload as any).whatsapp = `+55${phoneDigits}`;

    const { error } = await (supabase as any)
      .from("professionals")
      .update(updatePayload)
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      setSaving(false);
      return;
    }

    // Call edge function to create gateway account
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "create-professional-account",
          professional_id: professionalId,
          cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
          name: form.name,
          email: profile?.email,
          mobile_phone: phoneDigits.length >= 10 ? phoneDigits : undefined,
          pix_key: form.pix_key,
        },
      });

      if (fnError) throw new Error(fnError.message);

      setData({
        ...form,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
        asaas_wallet_id: result?.wallet_id || data?.asaas_wallet_id || null,
      });

      toast.success("Dados salvos e conta criada no gateway!");
    } catch (e: any) {
      console.error("Gateway error:", e);
      setData({
        ...form,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
        asaas_wallet_id: data?.asaas_wallet_id || null,
      });
      toast.success("Dados salvos! A conta no gateway será criada automaticamente.");
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

  if (!professionalId) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Conta Bancária / PIX</h1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Seu cadastro de profissional não foi encontrado. Contate o dono da barbearia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasGatewayAccount = !!data?.asaas_wallet_id;
  const hasData = !!data?.cpf_cnpj;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Conta Bancária / PIX</h1>

      {/* Status card */}
      {hasGatewayAccount && (
      <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-sm">Conta ativa no gateway</p>
              <p className="text-xs text-muted-foreground">Seus recebimentos cairão automaticamente via PIX.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados para Recebimento
          </CardTitle>
          <CardDescription>
            Preencha seu CPF/CNPJ e chave PIX. Sua conta no gateway de pagamentos será criada automaticamente.
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
              <Label>Telefone / WhatsApp *</Label>
              <Input
                value={form.mobile_phone}
                onChange={(e) => setForm({ ...form, mobile_phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                placeholder="11999990000"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Obrigatório para API gateway</p>
            </div>
            <div>
              <Label>CPF/CNPJ *</Label>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : hasData ? "Atualizar Dados" : "Salvar e Criar Conta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContaBancariaPage;
