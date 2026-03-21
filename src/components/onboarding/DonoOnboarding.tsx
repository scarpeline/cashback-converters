import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import logo from "@/assets/logo.png";

interface DonoOnboardingProps {
  onComplete: () => void;
}

const validateForm = (form: { name: string; address: string; cpf_cnpj: string }) => {
  const errors: Record<string, string> = {};
  if (!form.name || form.name.length < 2) {
    errors.name = "Nome da barbearia deve ter no mínimo 2 caracteres";
  }
  if (!form.address || form.address.length < 5) {
    errors.address = "Endereço deve ter no mínimo 5 caracteres";
  }
  const cleanCpfCnpj = form.cpf_cnpj.replace(/\D/g, "");
  if (cleanCpfCnpj.length < 11) {
    errors.cpf_cnpj = "CPF/CNPJ inválido";
  }
  return errors;
};

export function DonoOnboarding({ onComplete }: DonoOnboardingProps) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    address: "",
    cpf_cnpj: profile?.cpf_cnpj || "",
    phone: profile?.whatsapp || "",
    description: "",
  });

  const validateAndSubmit = async () => {
    setErrors({});
    const validationErrors = validateForm(form);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const baseSlug = form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `barbearia-${user.id.slice(0, 8)}`;

      const payload = {
        owner_user_id: user.id,
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        description: form.description || null,
      };

      const { data: existingList, error: existingError } = await (supabase as any)
        .from("barbershops")
        .select("id, slug")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (existingError) {
        toast.error("Erro ao validar cadastro existente: " + existingError.message);
        setSaving(false);
        return;
      }

      const existing = existingList?.[0];

      if (existing) {
        const { error: updateError } = await (supabase as any)
          .from("barbershops")
          .update({
            ...payload,
            slug: existing.slug || baseSlug,
          })
          .eq("id", existing.id);

        if (updateError) {
          toast.error("Erro ao atualizar barbearia: " + updateError.message);
          setSaving(false);
          return;
        }
      } else {
        let slugToUse = baseSlug;

        const insertOnce = async (slug: string) =>
          (supabase as any).from("barbershops").insert({
            ...payload,
            slug,
          });

        let { error: insertError } = await insertOnce(slugToUse);

        if (insertError?.message?.toLowerCase().includes("barbershops_slug_key")) {
          slugToUse = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await insertOnce(slugToUse);
          insertError = retry.error;
        }

        if (insertError) {
          toast.error("Erro ao cadastrar barbearia: " + insertError.message);
          setSaving(false);
          return;
        }
      }

      if (form.cpf_cnpj) {
        await (supabase as any)
          .from("profiles")
          .update({ cpf_cnpj: form.cpf_cnpj })
          .eq("user_id", user.id);
      }

      toast.success("Barbearia cadastrada com sucesso! 🎉");
      onComplete();
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="SalãoCashBack" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold">Configure sua Barbearia</h1>
          <p className="text-muted-foreground mt-2">
            Complete o cadastro para começar a usar o sistema
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 ${s <= step ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground border-primary"
                    : s === step
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div className={`w-12 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Dados da Barbearia</CardTitle>
              <CardDescription>Informações básicas do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nome da Barbearia *</label>
                <Input
                  id="name"
                  placeholder="Ex: Barbearia do João"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`mt-1 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Descrição (opcional)</label>
                <Input
                  id="description"
                  placeholder="Breve descrição do seu negócio"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Telefone/WhatsApp</label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatWhatsAppBR(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={() => {
                  if (!form.name || form.name.length < 2) {
                    setErrors({ name: "Nome é obrigatório" });
                    return;
                  }
                  setErrors({});
                  setStep(2);
                }}
              >
                Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle>Endereço e Documentos</CardTitle>
              <CardDescription>Informações fiscais e localização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Endereço Completo *</label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`mt-1 ${errors.address ? "border-destructive" : ""}`}
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="cpf_cnpj" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">CPF ou CNPJ *</label>
                <Input
                  id="cpf_cnpj"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={form.cpf_cnpj}
                  onChange={(e) => setForm({ ...form, cpf_cnpj: formatCpfCnpjBR(e.target.value) })}
                  className={`mt-1 ${errors.cpf_cnpj ? "border-destructive" : ""}`}
                />
                {errors.cpf_cnpj && <p className="text-xs text-destructive mt-1">{errors.cpf_cnpj}</p>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  variant="gold"
                  className="flex-1"
                  onClick={validateAndSubmit}
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {saving ? "Cadastrando..." : "Finalizar Cadastro"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Você poderá alterar essas informações depois nas configurações.
        </p>
      </div>
    </div>
  );
}
