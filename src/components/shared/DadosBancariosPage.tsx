import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle2, Building2 } from "lucide-react";

/**
 * Exibe os dados bancários/gateway criados automaticamente no cadastro do Dono.
 * Lê de: barbershops (asaas_customer_id, asaas_wallet_id) + profiles (cpf_cnpj, pix_key, bank_info)
 */
const DadosBancariosPage = () => {
  const { user } = useAuth();
  const [barbershop, setBarbershop] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("barbershops").select("name, asaas_customer_id, asaas_wallet_id").eq("owner_user_id", user.id).limit(1).maybeSingle(),
      supabase.from("profiles").select("cpf_cnpj, pix_key, bank_info").eq("user_id", user.id).maybeSingle(),
    ]).then(([shop, prof]) => {
      setBarbershop(shop.data);
      setProfileData(prof.data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const bankInfo = profileData?.bank_info as any;
  const hasGateway = !!barbershop?.asaas_customer_id;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dados Bancários</h1>
      <p className="text-muted-foreground text-sm">
        Dados criados automaticamente no gateway durante seu cadastro.
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
                <p className="text-xs text-muted-foreground">Será criada automaticamente ao gerar o primeiro pagamento.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile bank data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informações de Recebimento
          </CardTitle>
          <CardDescription>Dados vinculados ao seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoField label="CPF/CNPJ" value={profileData?.cpf_cnpj} />
            <InfoField label="Chave PIX" value={profileData?.pix_key} />
            <InfoField label="Banco" value={bankInfo?.bank_name} />
            <InfoField label="Agência" value={bankInfo?.agency} />
            <InfoField label="Conta" value={bankInfo?.account ? `${bankInfo.account} (${bankInfo.account_type || "corrente"})` : undefined} />
          </div>
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

const InfoField = ({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) => (
  <div className="p-3 bg-muted rounded-lg">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</p>
  </div>
);

export default DadosBancariosPage;
