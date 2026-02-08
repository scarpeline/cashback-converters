/**
 * Tela de Configurações de Integração
 * Gerenciamento de APIs (Asaas, Resend) com suporte a sandbox/produção
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Webhook, Mail, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { useIntegrationSettings } from "@/hooks/use-integration-settings";
import { useToast } from "@/hooks/use-toast";
import type { Environment, ServiceName } from "@/lib/integrations/api-config";

interface ServiceFormProps {
  service: ServiceName;
  environment: Environment;
  currentConfig?: {
    api_key_hash: string | null;
    webhook_secret_hash: string | null;
    base_url: string | null;
    from_email: string | null;
    is_active: boolean;
  };
  onSave: (config: {
    apiKey?: string;
    webhookSecret?: string;
    baseUrl?: string;
    fromEmail?: string;
    isActive: boolean;
  }) => Promise<boolean>;
}

function ServiceForm({ service, environment, currentConfig, onSave }: ServiceFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [baseUrl, setBaseUrl] = useState(currentConfig?.base_url || "");
  const [fromEmail, setFromEmail] = useState(currentConfig?.from_email || "");
  const [isActive, setIsActive] = useState(currentConfig?.is_active ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onSave({
        apiKey: apiKey || undefined,
        webhookSecret: webhookSecret || undefined,
        baseUrl: baseUrl || undefined,
        fromEmail: fromEmail || undefined,
        isActive,
      });
      if (success) {
        setApiKey("");
        setWebhookSecret("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label>Ativo</Label>
        </div>
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Habilitado" : "Desabilitado"}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <Label>API Key {currentConfig?.api_key_hash && "(já configurada)"}</Label>
          <Input
            type="password"
            placeholder={currentConfig?.api_key_hash ? "••••••••" : "Insira a chave de API"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {service === "asaas" && (
          <>
            <div>
              <Label>Webhook Secret {currentConfig?.webhook_secret_hash && "(já configurado)"}</Label>
              <Input
                type="password"
                placeholder={currentConfig?.webhook_secret_hash ? "••••••••" : "Insira o secret do webhook"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>
            <div>
              <Label>URL Base</Label>
              <Input
                placeholder={environment === "sandbox" ? "https://sandbox.asaas.com" : "https://api.asaas.com"}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          </>
        )}

        {service === "resend" && (
          <div>
            <Label>E-mail de Envio</Label>
            <Input
              type="email"
              placeholder="no-reply@seudominio.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Salvar Configuração
      </Button>
    </div>
  );
}

export default function IntegrationSettingsPage() {
  const { settings, appEnvironment, loading, switchEnvironment, saveSettings, refresh } = useIntegrationSettings();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  const handleEnvironmentSwitch = async (env: Environment) => {
    setSwitching(true);
    await switchEnvironment(env);
    setSwitching(false);
  };

  const getServiceConfig = (service: ServiceName, env: Environment) => {
    return settings.find((s) => s.service_name === service && s.environment === env);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações de Integração
          </h2>
          <p className="text-muted-foreground">
            Gerencie suas chaves de API e alterne entre ambientes
          </p>
        </div>
        <Button variant="outline" onClick={refresh}>
          Atualizar
        </Button>
      </div>

      {/* Seletor de Ambiente Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Ambiente Ativo
          </CardTitle>
          <CardDescription>
            Selecione o ambiente que será usado para todas as integrações.
            <br />
            <strong className="text-destructive">
              ATENÇÃO: Em produção, transações são REAIS!
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={appEnvironment?.current_env === "sandbox" ? "default" : "outline"}
              onClick={() => handleEnvironmentSwitch("sandbox")}
              disabled={switching}
              className="flex-1"
            >
              {appEnvironment?.current_env === "sandbox" && <CheckCircle className="mr-2 h-4 w-4" />}
              🧪 Sandbox (Teste)
            </Button>
            <Button
              variant={appEnvironment?.current_env === "production" ? "destructive" : "outline"}
              onClick={() => handleEnvironmentSwitch("production")}
              disabled={switching}
              className="flex-1"
            >
              {appEnvironment?.current_env === "production" && <CheckCircle className="mr-2 h-4 w-4" />}
              🚀 Produção
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Serviço */}
      <Tabs defaultValue="asaas" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="asaas" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Asaas (Pagamentos)
          </TabsTrigger>
          <TabsTrigger value="resend" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Resend (E-mails)
          </TabsTrigger>
        </TabsList>

        {/* ASAAS */}
        <TabsContent value="asaas">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Sandbox</Badge>
                  Asaas Teste
                </CardTitle>
                <CardDescription>
                  Use para testes. Nenhuma cobrança real será criada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceForm
                  service="asaas"
                  environment="sandbox"
                  currentConfig={getServiceConfig("asaas", "sandbox")}
                  onSave={(config) => saveSettings("asaas", "sandbox", config)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="destructive">Produção</Badge>
                  Asaas Produção
                </CardTitle>
                <CardDescription>
                  <strong className="text-destructive">Cobranças REAIS</strong>. Use com cuidado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceForm
                  service="asaas"
                  environment="production"
                  currentConfig={getServiceConfig("asaas", "production")}
                  onSave={(config) => saveSettings("asaas", "production", config)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Webhook Info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configuração de Webhook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>URL do Webhook (configure no painel de pagamentos)</Label>
                <code className="block p-3 bg-muted rounded-md text-sm break-all">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`}
                </code>
                <p className="text-sm text-muted-foreground">
                  Use esta URL para receber atualizações automáticas de status (sandbox e produção).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESEND */}
        <TabsContent value="resend">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Sandbox</Badge>
                  Resend Teste
                </CardTitle>
                <CardDescription>
                  E-mails de teste. Pode usar domínio não verificado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceForm
                  service="resend"
                  environment="sandbox"
                  currentConfig={getServiceConfig("resend", "sandbox")}
                  onSave={(config) => saveSettings("resend", "sandbox", config)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="destructive">Produção</Badge>
                  Resend Produção
                </CardTitle>
                <CardDescription>
                  E-mails reais. Requer domínio verificado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceForm
                  service="resend"
                  environment="production"
                  currentConfig={getServiceConfig("resend", "production")}
                  onSave={(config) => saveSettings("resend", "production", config)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
