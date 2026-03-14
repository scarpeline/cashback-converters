import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { 
  Webhook, 
  RefreshCw, 
  Copy, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Key,
  Link as LinkIcon,
  TestTube
} from "lucide-react";

interface WebhookConfig {
  id: string;
  service_name: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  last_triggered: string | null;
  last_success: string | null;
  created_at: string;
  updated_at: string;
}

export const WebhookManagementPanel = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("webhook_configs")
        .select("*")
        .order("service_name");

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar webhooks:", error);
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const saveWebhook = async () => {
    if (!editingWebhook) return;

    setSaving(true);
    try {
      const webhookData = {
        service_name: editingWebhook.service_name,
        webhook_url: editingWebhook.webhook_url,
        webhook_secret: editingWebhook.webhook_secret || generateSecret(),
        is_active: editingWebhook.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingWebhook.id) {
        // Atualizar
        const { error } = await supabase
          .from("webhook_configs")
          .update(webhookData)
          .eq("id", editingWebhook.id);

        if (error) throw error;
        toast.success("Webhook atualizado com sucesso!");
      } else {
        // Criar
        const { error } = await supabase
          .from("webhook_configs")
          .insert(webhookData);

        if (error) throw error;
        toast.success("Webhook criado com sucesso!");
      }

      setEditingWebhook(null);
      loadWebhooks();
    } catch (error: any) {
      console.error("Erro ao salvar webhook:", error);
      toast.error(error.message || "Erro ao salvar webhook");
    } finally {
      setSaving(false);
    }
  };

  const regenerateSecret = async (webhook: WebhookConfig) => {
    try {
      const newSecret = generateSecret();
      const { error } = await supabase
        .from("webhook_configs")
        .update({
          webhook_secret: newSecret,
          updated_at: new Date().toISOString()
        })
        .eq("id", webhook.id);

      if (error) throw error;
      
      toast.success("Segredo do webhook regenerado!");
      loadWebhooks();
    } catch (error: any) {
      console.error("Erro ao regenerar segredo:", error);
      toast.error("Erro ao regenerar segredo");
    }
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTesting({ ...testing, [webhook.id]: true });
    try {
      const testPayload = {
        event: "test",
        timestamp: new Date().toISOString(),
        data: {
          message: "Webhook test realizado com sucesso!",
          service: webhook.service_name
        }
      };

      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.webhook_secret
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast.success("Webhook testado com sucesso!");
        
        // Atualizar último sucesso
        await supabase
          .from("webhook_configs")
          .update({
            last_success: new Date().toISOString(),
            last_triggered: new Date().toISOString()
          })
          .eq("id", webhook.id);
        
        loadWebhooks();
      } else {
        throw new Error(`Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Erro ao testar webhook:", error);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setTesting({ ...testing, [webhook.id]: false });
    }
  };

  const toggleWebhook = async (webhook: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from("webhook_configs")
        .update({
          is_active: !webhook.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", webhook.id);

      if (error) throw error;
      
      toast.success(`Webhook ${!webhook.is_active ? 'ativado' : 'desativado'}!`);
      loadWebhooks();
    } catch (error: any) {
      console.error("Erro ao alternar webhook:", error);
      toast.error("Erro ao alterar webhook");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const getStatusBadge = (webhook: WebhookConfig) => {
    if (!webhook.is_active) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    
    if (webhook.last_success) {
      const lastSuccess = new Date(webhook.last_success);
      const now = new Date();
      const diffHours = (now.getTime() - lastSuccess.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return <Badge className="bg-green-100 text-green-800">Funcionando</Badge>;
      }
    }
    
    return <Badge variant="outline">Sem resposta recente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6" />
            Gestão de Webhooks
          </h2>
          <p className="text-muted-foreground">
            Configure e monitore os webhooks do sistema
          </p>
        </div>
        
        <Button onClick={() => setEditingWebhook({
          id: '',
          service_name: '',
          webhook_url: '',
          webhook_secret: '',
          is_active: true,
          last_triggered: null,
          last_success: null,
          created_at: '',
          updated_at: ''
        })}>
          <LinkIcon className="w-4 h-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {/* Lista de Webhooks */}
      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{webhook.service_name}</h3>
                    {getStatusBadge(webhook)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">URL:</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={webhook.webhook_url}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.webhook_url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Segredo:</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type={showSecret[webhook.id] ? "text" : "password"}
                          value={webhook.webhook_secret}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecret({
                            ...showSecret,
                            [webhook.id]: !showSecret[webhook.id]
                          })}
                        >
                          {showSecret[webhook.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.webhook_secret)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {webhook.last_triggered && (
                      <span>Último disparo: {new Date(webhook.last_triggered).toLocaleString('pt-BR')}</span>
                    )}
                    {webhook.last_success && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Último sucesso: {new Date(webhook.last_success).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant={webhook.is_active ? "default" : "outline"}
                    onClick={() => toggleWebhook(webhook)}
                  >
                    {webhook.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(webhook)}
                    disabled={testing[webhook.id]}
                  >
                    {testing[webhook.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateSecret(webhook)}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Regenerar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingWebhook(webhook)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum webhook configurado.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setEditingWebhook({
                id: '',
                service_name: '',
                webhook_url: '',
                webhook_secret: '',
                is_active: true,
                last_triggered: null,
                last_success: null,
                created_at: '',
                updated_at: ''
              })}
            >
              Criar primeiro webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      {editingWebhook && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>
              {editingWebhook.id ? "Editar Webhook" : "Novo Webhook"}
            </CardTitle>
            <CardDescription>
              Configure as informações do webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input
                  value={editingWebhook.service_name}
                  onChange={(e) => setEditingWebhook({
                    ...editingWebhook,
                    service_name: e.target.value
                  })}
                  placeholder="Ex: Asaas, Twilio"
                />
              </div>
              
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <Input
                  value={editingWebhook.webhook_url}
                  onChange={(e) => setEditingWebhook({
                    ...editingWebhook,
                    webhook_url: e.target.value
                  })}
                  placeholder="https://sua-api.com/webhook"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={editingWebhook.is_active}
                onChange={(e) => setEditingWebhook({
                  ...editingWebhook,
                  is_active: e.target.checked
                })}
                className="rounded"
              />
              <Label htmlFor="active">Webhook ativo</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={saveWebhook} 
                disabled={saving || !editingWebhook.service_name || !editingWebhook.webhook_url}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingWebhook(null)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
