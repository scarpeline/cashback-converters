import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, MapPin, FileText, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import { z } from "zod";
import logo from "@/assets/logo.png";

const onboardingSchema = z.object({
  name: z.string().min(2, "Nome da barbearia deve ter no mínimo 2 caracteres").max(100),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres").max(200),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido"),
  phone: z.string().min(10, "Telefone inválido").optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
});

interface DonoOnboardingProps {
  onComplete: () => void;
}

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

    try {
      onboardingSchema.parse({
        name: form.name,
        address: form.address,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
        phone: form.phone,
        description: form.description,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    if (!user) return;

    setSaving(true);
    try {
      // Create or update barbershop (idempotent for owners with existing records)
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

      const { data: existingList, error: existingError } = await supabase
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
        const { error: updateError } = await supabase
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
          supabase.from("barbershops").insert({
            ...payload,
            slug,
          });

        let { error: insertError } = await insertOnce(slugToUse);

        // Retry once with unique suffix if slug already exists
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

      // Update profile with CPF/CNPJ if provided
      if (form.cpf_cnpj) {
        await supabase
          .from("profiles")
          .update({ cpf_cnpj: form.cpf_cnpj })
          .eq("user_id", user.id);
      }

      toast.success("Barbearia cadastrada com sucesso! 🎉");
      onComplete();
    } catch (err) {
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
                <Label htmlFor="name">Nome da Barbearia *</Label>
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
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Breve descrição do seu negócio"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone/WhatsApp</Label>
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
                <Label htmlFor="address">Endereço Completo *</Label>
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
                <Label htmlFor="cpf_cnpj">CPF ou CNPJ *</Label>
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
