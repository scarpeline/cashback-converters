/**
 * Tela de Configurações de Integração - Super Admin
 * Gerenciamento completo de APIs, Webhooks, Pixels e mais
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, Settings, Webhook, Mail, CreditCard, AlertTriangle, CheckCircle,
  Plus, Trash2, Eye, EyeOff, RefreshCw, Shield, Smartphone, MessageSquare,
  Image, Database, Activity, Copy, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface Integration {
  id: string;
  name: string;
  type: string;
  provider_name: string;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  base_url: string | null;
  environment: string;
  status: string;
  config_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface IntegrationEndpoint {
  id: string;
  integration_id: string;
  event_name: string;
  endpoint_url: string;
  method: string;
  headers_json: Record<string, unknown> | null;
  retry_enabled: boolean;
  retry_count: number;
  active: boolean;
}

interface Pixel {
  id: string;
  owner_type: string;
  owner_id: string | null;
  pixel_type: string;
  pixel_id: string;
  events_json: unknown[];
  active: boolean;
}

interface WebhookLog {
  id: string;
  event: string;
  target_url: string;
  response_code: number | null;
  success: boolean;
  created_at: string;
}

// ============================================
// CONSTANTS
// ============================================

const INTEGRATION_TYPES = [
  { value: "payment", label: "Gateway de Pagamento", icon: CreditCard },
  { value: "sms", label: "SMS / OTP", icon: Smartphone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "pixel", label: "Pixel", icon: Image },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "storage", label: "Storage", icon: Database },
  { value: "antifraud", label: "Anti-fraude", icon: Shield },
];

const PIXEL_TYPES = [
  { value: "meta", label: "Meta (Facebook)" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "google_ads", label: "Google Ads Conversion" },
];

// ============================================
// HOOKS
// ============================================

function useIntegrationsData() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [intRes, pixRes, logRes] = await Promise.all([
        supabase.from("integrations").select("*").order("created_at", { ascending: false }),
        supabase.from("pixels").select("*").order("created_at", { ascending: false }),
        supabase.from("webhooks_log").select("id, event, target_url, response_code, success, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      if (intRes.data) setIntegrations(intRes.data as Integration[]);
      if (pixRes.data) setPixels(pixRes.data as Pixel[]);
      if (logRes.data) setWebhookLogs(logRes.data as WebhookLog[]);
    } catch (err) {
      console.error("Failed to fetch integrations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { integrations, pixels, webhookLogs, loading, refresh: fetchAll, toast };
}

// ============================================
// SUB COMPONENTS
// ============================================

function AddIntegrationDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    type: "payment",
    provider_name: "",
    api_key: "",
    api_secret: "",
    base_url: "",
    environment: "sandbox" as string,
    status: "inactive" as string,
  });

  const handleSave = async () => {
    if (!form.name || !form.provider_name) {
      toast({ title: "Erro", description: "Nome e provedor são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("integrations").insert({
        name: form.name,
        type: form.type,
        provider_name: form.provider_name,
        api_key_encrypted: form.api_key || null,
        api_secret_encrypted: form.api_secret || null,
        base_url: form.base_url || null,
        environment: form.environment,
        status: form.status,
      });
      if (error) throw error;
      toast({ title: "Integração criada", description: `${form.name} foi adicionada.` });
      setOpen(false);
      setForm({ name: "", type: "payment", provider_name: "", api_key: "", api_secret: "", base_url: "", environment: "sandbox", status: "inactive" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Nova Integração</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Integração</DialogTitle>
          <DialogDescription>Configure uma nova integração externa</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Asaas Produção" />
            </div>
            <div>
              <Label>Provedor</Label>
              <Input value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} placeholder="Ex: Asaas, Resend" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTEGRATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ambiente</Label>
              <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">🧪 Sandbox</SelectItem>
                  <SelectItem value="production">🚀 Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>API Key</Label>
            <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Chave de API" />
          </div>
          <div>
            <Label>API Secret</Label>
            <Input type="password" value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} placeholder="Secret / Webhook Secret" />
          </div>
          <div>
            <Label>URL Base</Label>
            <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.provedor.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPixelDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    pixel_type: "meta",
    pixel_id: "",
    owner_type: "platform",
    active: true,
  });

  const handleSave = async () => {
    if (!form.pixel_id) {
      toast({ title: "Erro", description: "ID do pixel é obrigatório.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("pixels").insert({
        pixel_type: form.pixel_type,
        pixel_id: form.pixel_id,
        owner_type: form.owner_type,
        active: form.active,
      });
      if (error) throw error;
      toast({ title: "Pixel criado" });
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Pixel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Pixel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={form.pixel_type} onValueChange={(v) => setForm({ ...form, pixel_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIXEL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ID do Pixel</Label>
            <Input value={form.pixel_id} onChange={(e) => setForm({ ...form, pixel_id: e.target.value })} placeholder="Ex: 123456789" />
          </div>
          <div>
            <Label>Proprietário</Label>
            <Select value={form.owner_type} onValueChange={(v) => setForm({ ...form, owner_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">Plataforma (Global)</SelectItem>
                <SelectItem value="salon">Salão</SelectItem>
                <SelectItem value="affiliate">Afiliado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationsTable({ integrations, onRefresh }: { integrations: Integration[]; onRefresh: () => void }) {
  const { toast } = useToast();

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("integrations").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      onRefresh();
    }
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase.from("integrations").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removida" });
      onRefresh();
    }
  };

  const getTypeIcon = (type: string) => {
    const found = INTEGRATION_TYPES.find((t) => t.value === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Settings className="w-4 h-4" />;
  };

  if (integrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma integração configurada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Integração</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ambiente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.provider_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{INTEGRATION_TYPES.find(t => t.value === item.type)?.label || item.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.environment === "production" ? "destructive" : "secondary"}>
                    {item.environment === "production" ? "Produção" : "Sandbox"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.status === "active"}
                      onCheckedChange={() => toggleStatus(item.id, item.status)}
                    />
                    <span className={`text-xs ${item.status === "active" ? "text-green-500" : "text-muted-foreground"}`}>
                      {item.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteIntegration(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PixelsTable({ pixels, onRefresh }: { pixels: Pixel[]; onRefresh: () => void }) {
  const { toast } = useToast();

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("pixels").update({ active: !active }).eq("id", id);
    if (!error) onRefresh();
  };

  const deletePixel = async (id: string) => {
    const { error } = await supabase.from("pixels").delete().eq("id", id);
    if (!error) { toast({ title: "Pixel removido" }); onRefresh(); }
  };

  if (pixels.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum pixel configurado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pixels.map((px) => (
              <TableRow key={px.id}>
                <TableCell>
                  <Badge variant="outline">{PIXEL_TYPES.find(t => t.value === px.pixel_type)?.label || px.pixel_type}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{px.pixel_id}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {px.owner_type === "platform" ? "Plataforma" : px.owner_type === "salon" ? "Salão" : "Afiliado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch checked={px.active} onCheckedChange={() => toggleActive(px.id, px.active)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deletePixel(px.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function WebhookLogsTable({ logs }: { logs: WebhookLog[] }) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum log de webhook registrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.event}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.target_url}</TableCell>
                <TableCell>
                  {log.success ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>
                  ) : (
                    <Badge variant="destructive">Falha</Badge>
                  )}
                </TableCell>
                <TableCell>{log.response_code || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IntegrationSettingsPage() {
  const { integrations, pixels, webhookLogs, loading, refresh } = useIntegrationsData();

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Integrações
          </h2>
          <p className="text-muted-foreground">
            Gerencie APIs, gateways, pixels, webhooks e provedores externos
          </p>
        </div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gateways" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="gateways" className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />Gateways
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />SMS/OTP
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />WhatsApp
          </TabsTrigger>
          <TabsTrigger value="pixels" className="flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" />Pixels
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1.5">
            <Webhook className="w-3.5 h-3.5" />Webhooks
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />Storage
          </TabsTrigger>
          <TabsTrigger value="antifraud" className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />Anti-fraude
          </TabsTrigger>
        </TabsList>

        {/* GATEWAYS */}
        <TabsContent value="gateways" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gateways de Pagamento</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "payment")} onRefresh={refresh} />

          {/* Webhook URL Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Webhook className="h-4 w-4" />
                URL do Webhook de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md text-sm break-all">{webhookUrl}</code>
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(webhookUrl); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Configure esta URL no painel do gateway para receber notificações automáticas.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS / OTP */}
        <TabsContent value="sms" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">SMS / OTP</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "sms")} onRefresh={refresh} />
        </TabsContent>

        {/* WHATSAPP */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">WhatsApp Business</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "whatsapp")} onRefresh={refresh} />
        </TabsContent>

        {/* PIXELS */}
        <TabsContent value="pixels" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pixels de Rastreamento</h3>
            <AddPixelDialog onSaved={refresh} />
          </div>
          <PixelsTable pixels={pixels} onRefresh={refresh} />
        </TabsContent>

        {/* WEBHOOKS */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Logs de Webhook</h3>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-2" />Atualizar
            </Button>
          </div>
          <WebhookLogsTable logs={webhookLogs} />
        </TabsContent>

        {/* STORAGE */}
        <TabsContent value="storage" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Storage / Armazenamento</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "storage")} onRefresh={refresh} />
        </TabsContent>

        {/* ANTI-FRAUDE */}
        <TabsContent value="antifraud" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Anti-fraude</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "antifraud")} onRefresh={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
