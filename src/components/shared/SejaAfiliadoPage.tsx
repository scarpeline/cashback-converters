/**
 * SejaAfiliadoPage - Componente compartilhado para tornar-se afiliado do app
 * Inclui sistema antifraude completo com fingerprint, IP, CPF e validações
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Share2, Shield, AlertTriangle, CheckCircle, Copy, Loader2,
  DollarSign, Users, TrendingUp, Ban, Fingerprint, Wifi, Smartphone,
  Eye, Globe, Clock, UserX, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";
import { collectDeviceFingerprint, getPublicIP, detectVPNHeuristics } from "@/lib/fraud/fingerprint";

// ============ REGRAS ANTIFRAUDE ============
const FRAUD_RULES = [
  {
    icon: UserX,
    title: "Auto-indicação proibida",
    description: "Você NÃO pode usar seu próprio link de afiliado para cadastrar sua barbearia ou qualquer conta pessoal. O sistema cruza CPF/CNPJ, e-mail, WhatsApp e dispositivo.",
    severity: "critical" as const,
  },
  {
    icon: Wifi,
    title: "Mesma rede WiFi / IP",
    description: "Cadastros originados do mesmo IP público (mesma WiFi/rede) do afiliado são sinalizados automaticamente. Se detectado padrão de auto-comissão, a conta é bloqueada.",
    severity: "critical" as const,
  },
  {
    icon: Fingerprint,
    title: "Fingerprint do dispositivo",
    description: "O sistema coleta impressão digital do navegador (canvas, WebGL, fontes, resolução, hardware). Dispositivos idênticos ou muito similares ao do afiliado geram alerta de fraude.",
    severity: "critical" as const,
  },
  {
    icon: Smartphone,
    title: "Múltiplas contas no mesmo dispositivo",
    description: "Se o mesmo dispositivo físico for usado para criar a conta de afiliado E a conta indicada, o sistema detecta e bloqueia ambas automaticamente.",
    severity: "critical" as const,
  },
  {
    icon: Globe,
    title: "VPN / Proxy / Tor",
    description: "Tentativas de mascarar IP com VPN, proxy ou Tor são detectadas por heurísticas (WebRTC leak, timezone inconsistente, navegador headless). Cadastros sob VPN são sinalizados.",
    severity: "high" as const,
  },
  {
    icon: Eye,
    title: "CPF/CNPJ e dados pessoais",
    description: "O CPF/CNPJ do afiliado é cruzado com todos os cadastros indicados. Mesmos titulares, familiares no mesmo endereço ou CNPJs com sócios em comum são detectados.",
    severity: "critical" as const,
  },
  {
    icon: Clock,
    title: "Padrão temporal de cadastros",
    description: "Cadastros em sequência rápida (menos de 5 minutos entre si) a partir do mesmo link geram score alto de suspeita. O sistema analisa velocidade e padrão de indicações.",
    severity: "high" as const,
  },
  {
    icon: Ban,
    title: "Punições por fraude",
    description: "Fraude confirmada resulta em: bloqueio permanente da conta, perda de TODAS as comissões (pagas e pendentes), blacklist do CPF/CNPJ e dispositivo, e possível ação legal.",
    severity: "critical" as const,
  },
];

const SejaAfiliadoPage = () => {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAntifraud, setAcceptedAntifraud] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState(profile?.cpf_cnpj || "");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "afiliado_saas")
      .maybeSingle()
      .then(({ data }) => {
        setAffiliate(data);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (profile?.cpf_cnpj) setCpfCnpj(profile.cpf_cnpj);
  }, [profile]);

  const handleRegister = async () => {
    if (!user || !profile) return;
    if (!acceptedTerms || !acceptedAntifraud) {
      toast.error("Você deve aceitar os termos e a política antifraude.");
      return;
    }
    if (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11) {
      toast.error("CPF/CNPJ obrigatório para verificação antifraude.");
      return;
    }

    setRegistering(true);

    try {
      // 1. Coletar fingerprint e IP
      const [fingerprint, publicIP] = await Promise.all([
        collectDeviceFingerprint(),
        getPublicIP(),
      ]);

      const vpnCheck = detectVPNHeuristics();

      // 2. Chamar edge function com validação antifraude
      const { data, error } = await supabase.functions.invoke("register-affiliate", {
        body: {
          user_id: user.id,
          name: profile.name,
          email: profile.email,
          whatsapp: profile.whatsapp,
          cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
          type: "afiliado_saas",
          fingerprint: {
            combined_hash: fingerprint.combinedHash,
            canvas_hash: fingerprint.canvasHash,
            webgl_renderer: fingerprint.webglRenderer,
            screen: `${fingerprint.screenWidth}x${fingerprint.screenHeight}`,
            platform: fingerprint.platform,
            language: fingerprint.language,
            timezone: fingerprint.timezone,
            hardware_concurrency: fingerprint.hardwareConcurrency,
            device_memory: fingerprint.deviceMemory,
            max_touch_points: fingerprint.maxTouchPoints,
          },
          ip_address: publicIP,
          vpn_suspicious: vpnCheck.suspicious,
          vpn_reasons: vpnCheck.reasons,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setRegistering(false);
        return;
      }

      toast.success("Conta de afiliado criada com sucesso!");
      // Reload affiliate data
      const { data: aff } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "afiliado_saas")
        .maybeSingle();
      setAffiliate(aff);
    } catch (err: any) {
      toast.error("Erro ao registrar: " + (err?.message || "Tente novamente"));
    }

    setRegistering(false);
  };

  const referralLink = affiliate
    ? `${window.location.origin}/?ref=${affiliate.referral_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado!");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============ JÁ É AFILIADO ============
  if (affiliate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Programa de Afiliado</h1>
          <p className="text-muted-foreground">Indique barbearias e ganhe comissões recorrentes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Ganhos Totais</CardDescription>
              <CardTitle className="text-2xl text-gradient-gold">
                R$ {Number(affiliate.total_earnings || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Empresas Ativas</CardDescription>
              <CardTitle className="text-2xl">{affiliate.active_referrals || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo Pendente</CardDescription>
              <CardTitle className="text-2xl">
                R$ {Number(affiliate.pending_earnings || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Seu Link de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded-lg text-sm overflow-x-auto">
                {referralLink}
              </code>
              <Button variant="gold" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Conheça o melhor sistema para barbearias: ${referralLink}`)}`,
                    "_blank"
                  )
                }
              >
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (navigator.share) navigator.share({ title: "SalãoCashBack", url: referralLink });
                  else copyLink();
                }}
              >
                Compartilhar
              </Button>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Código</p>
              <p className="text-2xl font-bold tracking-widest">{affiliate.referral_code}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Como Você Ganha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-gradient-gold">60%</p>
                <p className="text-sm text-muted-foreground">Primeira mensalidade</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-gradient-gold">20%</p>
                <p className="text-sm text-muted-foreground">Mensalidades recorrentes</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold text-gradient-gold">10%</p>
                <p className="text-sm text-muted-foreground">Taxa SaaS (0,5%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ CADASTRO DE AFILIADO ============
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Seja Afiliado do App</h1>
        <p className="text-muted-foreground">
          Indique barbearias para usar nosso sistema e ganhe comissões recorrentes
        </p>
      </div>

      {/* Benefícios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="pt-6 text-center">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">60%</p>
            <p className="text-sm text-muted-foreground">da 1ª mensalidade</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">20%</p>
            <p className="text-sm text-muted-foreground">recorrente mensal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-10 h-10 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">10%</p>
            <p className="text-sm text-muted-foreground">da taxa SaaS 0,5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Regras Antifraude */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="w-5 h-5" />
            Política Antifraude Obrigatória
          </CardTitle>
          <CardDescription>
            Leia TODAS as regras antes de se cadastrar. Fraude resulta em banimento permanente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-destructive/30"
            onClick={() => setShowRules(!showRules)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {showRules ? "Ocultar regras detalhadas" : "Ver todas as regras antifraude"}
          </Button>

          {showRules && (
            <div className="space-y-3">
              {FRAUD_RULES.map((rule, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    rule.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-yellow-500/30 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <rule.icon
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        rule.severity === "critical" ? "text-destructive" : "text-yellow-600"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{rule.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Resumo das detecções automáticas:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>IP público</strong> — mesmo IP do afiliado e indicado = bloqueio</li>
                  <li>• <strong>Fingerprint</strong> — canvas, WebGL, fontes, resolução, hardware</li>
                  <li>• <strong>CPF/CNPJ</strong> — cruzamento com base de indicados</li>
                  <li>• <strong>E-mail</strong> — padrões similares (nome+num@gmail)</li>
                  <li>• <strong>WhatsApp</strong> — mesmo número ou DDDs muito próximos</li>
                  <li>• <strong>Timing</strong> — cadastros rápidos demais são suspeitos</li>
                  <li>• <strong>VPN/Proxy</strong> — heurísticas de detecção ativas</li>
                  <li>• <strong>Dispositivo</strong> — mesmo device para afiliado + indicado</li>
                  <li>• <strong>Cookies</strong> — rastreamento de sessão cruzada</li>
                  <li>• <strong>Geolocalização</strong> — inconsistência IP vs timezone</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Ativar Conta de Afiliado</CardTitle>
          <CardDescription>
            Seus dados serão validados pelo sistema antifraude antes da ativação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={profile?.name || ""} disabled className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={profile?.email || ""} disabled className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={profile?.whatsapp || ""} disabled className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>CPF/CNPJ *</Label>
            <Input
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatCpfCnpjBR(e.target.value))}
              placeholder="000.000.000-00"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Obrigatório para verificação antifraude e recebimento de comissões
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(!!v)}
              />
              <label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                Li e aceito os <strong>Termos de Uso do Programa de Afiliados</strong>, incluindo as
                regras de comissão, saque mínimo de 3 empresas ativas e política de pagamento.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="antifraud"
                checked={acceptedAntifraud}
                onCheckedChange={(v) => setAcceptedAntifraud(!!v)}
              />
              <label htmlFor="antifraud" className="text-sm leading-snug cursor-pointer">
                Li e aceito a <strong>Política Antifraude</strong>. Entendo que qualquer tentativa de
                burlar o sistema (auto-indicação, contas falsas, mesma rede, dispositivo compartilhado)
                resultará em <strong>bloqueio permanente e perda de todas as comissões</strong>.
              </label>
            </div>
          </div>

          <Button
            variant="gold"
            className="w-full"
            disabled={!acceptedTerms || !acceptedAntifraud || registering}
            onClick={handleRegister}
          >
            {registering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando antifraude...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Ativar Conta de Afiliado
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SejaAfiliadoPage;
