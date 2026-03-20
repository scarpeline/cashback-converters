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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Settings, Webhook, Mail, CreditCard, AlertTriangle, CheckCircle,
  Plus, Trash2, Eye, EyeOff, RefreshCw, Shield, Smartphone, MessageSquare,
  Image, Database, Activity, Copy, ExternalLink, Zap, PlayCircle, Key
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STANDARD_EVENT_LIST, PIXEL_EVENTS } from "@/lib/adapters/types";

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
];

// ============================================
// HOOKS
// ============================================

function useIntegrationsData() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [intRes, epRes, pixRes, logRes] = await Promise.all([
        (supabase as any).from("integrations").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("integration_endpoints").select("*").order("event_name"),
        (supabase as any).from("pixels").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("webhooks_log").select("id, event, target_url, response_code, success, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      if (intRes.data) setIntegrations(intRes.data as Integration[]);
      if (epRes.data) setEndpoints(epRes.data as IntegrationEndpoint[]);
      if (pixRes.data) setPixels(pixRes.data as Pixel[]);
      if (logRes.data) setWebhookLogs(logRes.data as WebhookLog[]);
    } catch (err) {
      console.error("Failed to fetch integrations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { integrations, endpoints, pixels, webhookLogs, loading, refresh: fetchAll, toast };
}

// ============================================
// TEST BUTTON COMPONENT
// ============================================

function TestIntegrationButton({ integration }: { integration: Integration }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      let testType = "ping";
      const config: Record<string, unknown> = {};

      if (integration.type === "payment" && integration.provider_name.toLowerCase().includes("asaas")) {
        testType = "asaas_auth";
        config.environment = integration.environment;
      } else if (integration.base_url) {
        testType = "ping";
        config.url = integration.base_url;
      }

      const { data, error } = await supabase.functions.invoke("test-integration", {
        body: { test_type: testType, config },
      });

      if (error) throw error;
      setResult(data as { success: boolean; message: string });
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Erro ao testar" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
        {testing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PlayCircle className="w-3 h-3 mr-1" />}
        Testar
      </Button>
      {result && (
        <Badge variant={result.success ? "default" : "destructive"} className={result.success ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
          {result.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
          {result.message.slice(0, 40)}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// ADD INTEGRATION DIALOG
// ============================================

function AddIntegrationDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", type: "payment", provider_name: "", api_key: "", api_secret: "",
    base_url: "", environment: "sandbox", status: "inactive",
  });

  const handleSave = async () => {
    if (!form.name || !form.provider_name) {
      toast({ title: "Erro", description: "Nome e provedor são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("integrations").insert({
        name: form.name, type: form.type, provider_name: form.provider_name,
        api_key_encrypted: form.api_key || null, api_secret_encrypted: form.api_secret || null,
        base_url: form.base_url || null, environment: form.environment, status: form.status,
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
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Asaas Produção" /></div>
            <div><Label>Provedor</Label><Input value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} placeholder="Ex: Asaas, Resend" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INTEGRATION_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
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
          <div><Label>API Key</Label><Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="••••••••" /></div>
          <div><Label>API Secret</Label><Input type="password" value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} placeholder="••••••••" /></div>
          <div><Label>URL Base</Label><Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.provedor.com" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ADD WEBHOOK ENDPOINT DIALOG
// ============================================

function AddEndpointDialog({ integrations, onSaved }: { integrations: Integration[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    integration_id: "", event_name: "", endpoint_url: "", method: "POST",
    headers_json: "", retry_enabled: true, retry_count: 3,
  });

  const handleSave = async () => {
    if (!form.integration_id || !form.event_name || !form.endpoint_url) {
      toast({ title: "Erro", description: "Integração, evento e URL são obrigatórios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let parsedHeaders = {};
      if (form.headers_json) {
        try { parsedHeaders = JSON.parse(form.headers_json); } catch { throw new Error("Headers JSON inválido"); }
      }
      const { error } = await (supabase as any).from("integration_endpoints").insert({
        integration_id: form.integration_id, event_name: form.event_name,
        endpoint_url: form.endpoint_url, method: form.method,
        headers_json: parsedHeaders, retry_enabled: form.retry_enabled,
        retry_count: form.retry_count,
      });
      if (error) throw error;
      toast({ title: "Endpoint criado" });
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
        <Button><Plus className="w-4 h-4 mr-2" />Novo Webhook</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Webhook Endpoint</DialogTitle>
          <DialogDescription>Configure um endpoint para receber eventos</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Integração</Label>
            <Select value={form.integration_id} onValueChange={(v) => setForm({ ...form, integration_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {integrations.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name} ({i.provider_name})</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Evento</Label>
            <Select value={form.event_name} onValueChange={(v) => setForm({ ...form, event_name: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o evento..." /></SelectTrigger>
              <SelectContent>
                {STANDARD_EVENT_LIST.map((e) => (<SelectItem key={e.event} value={e.event}>{e.label} ({e.event})</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>URL do Endpoint</Label><Input value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} placeholder="https://example.com/webhook" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Método</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Retry Count</Label>
              <Input type="number" value={form.retry_count} onChange={(e) => setForm({ ...form, retry_count: parseInt(e.target.value) || 3 })} min={0} max={10} />
            </div>
          </div>
          <div><Label>Headers (JSON)</Label><Input value={form.headers_json} onChange={(e) => setForm({ ...form, headers_json: e.target.value })} placeholder='{"Authorization": "Bearer xxx"}' /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.retry_enabled} onCheckedChange={(v) => setForm({ ...form, retry_enabled: v })} />
            <Label>Retry automático em caso de falha</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ADD PIXEL DIALOG
// ============================================

function AddPixelDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const [form, setForm] = useState({
    pixel_type: "meta", pixel_id: "", owner_type: "platform", active: true,
  });

  const handleSave = async () => {
    if (!form.pixel_id) {
      toast({ title: "Erro", description: "ID do pixel é obrigatório.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("pixels").insert({
        pixel_type: form.pixel_type, pixel_id: form.pixel_id,
        owner_type: form.owner_type, active: form.active,
        events_json: selectedEvents,
      });
      if (error) throw error;
      toast({ title: "Pixel criado" });
      setOpen(false);
      setSelectedEvents([]);
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Novo Pixel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Pixel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={form.pixel_type} onValueChange={(v) => setForm({ ...form, pixel_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PIXEL_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div><Label>ID do Pixel</Label><Input value={form.pixel_id} onChange={(e) => setForm({ ...form, pixel_id: e.target.value })} placeholder="Ex: 123456789" /></div>
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
          <div>
            <Label>Eventos que disparam o pixel</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PIXEL_EVENTS.map((event) => (
                <div key={event} className="flex items-center gap-2">
                  <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={() => toggleEvent(event)} id={`px-${event}`} />
                  <label htmlFor={`px-${event}`} className="text-sm">{event}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// TABLES
// ============================================

function IntegrationsTable({ integrations, onRefresh }: { integrations: Integration[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await (supabase as any).from("integrations").update({ status: newStatus }).eq("id", id);
    if (!error) onRefresh();
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await (supabase as any).from("integrations").delete().eq("id", id);
    if (!error) { toast({ title: "Removida" }); onRefresh(); }
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (integrations.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma integração configurada.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Integração</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Teste</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {integrations.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.provider_name}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.environment === "production" ? "destructive" : "secondary"}>
                  {item.environment === "production" ? "Produção" : "Sandbox"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {showKeys.has(item.id) && item.api_key_encrypted
                      ? item.api_key_encrypted.slice(0, 12) + "..."
                      : "••••••••"}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleKeyVisibility(item.id)}>
                    {showKeys.has(item.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Switch checked={item.status === "active"} onCheckedChange={() => toggleStatus(item.id, item.status)} />
              </TableCell>
              <TableCell>
                <TestIntegrationButton integration={item} />
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
    </CardContent></Card>
  );
}

function EndpointsTable({ endpoints, onRefresh }: { endpoints: IntegrationEndpoint[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await (supabase as any).from("integration_endpoints").update({ active: !active }).eq("id", id);
    if (!error) onRefresh();
  };

  const deleteEndpoint = async (id: string) => {
    const { error } = await (supabase as any).from("integration_endpoints").delete().eq("id", id);
    if (!error) { toast({ title: "Endpoint removido" }); onRefresh(); }
  };

  const testEndpoint = async (ep: IntegrationEndpoint) => {
    setTestingId(ep.id);
    try {
      const { data, error } = await supabase.functions.invoke("test-integration", {
        body: {
          test_type: "webhook_test",
          config: { url: ep.endpoint_url, headers: ep.headers_json || {} },
        },
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      toast({
        title: result.success ? "Teste OK" : "Teste falhou",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setTestingId(null);
    }
  };

  if (endpoints.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Webhook className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum webhook endpoint configurado.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Evento</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Retry</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((ep) => (
            <TableRow key={ep.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{ep.event_name}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{ep.endpoint_url}</TableCell>
              <TableCell><Badge variant="secondary">{ep.method}</Badge></TableCell>
              <TableCell>
                {ep.retry_enabled ? (
                  <span className="text-xs text-green-500">{ep.retry_count}x</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Off</span>
                )}
              </TableCell>
              <TableCell>
                <Switch checked={ep.active} onCheckedChange={() => toggleActive(ep.id, ep.active)} />
              </TableCell>
              <TableCell className="text-right flex items-center justify-end gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => testEndpoint(ep)} disabled={testingId === ep.id}>
                  {testingId === ep.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteEndpoint(ep.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function PixelsTable({ pixels, onRefresh }: { pixels: Pixel[]; onRefresh: () => void }) {
  const { toast } = useToast();

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await (supabase as any).from("pixels").update({ active: !active }).eq("id", id);
    if (!error) onRefresh();
  };

  const deletePixel = async (id: string) => {
    const { error } = await (supabase as any).from("pixels").delete().eq("id", id);
    if (!error) { toast({ title: "Pixel removido" }); onRefresh(); }
  };

  if (pixels.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum pixel configurado.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Proprietário</TableHead>
            <TableHead>Eventos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pixels.map((px) => (
            <TableRow key={px.id}>
              <TableCell><Badge variant="outline">{PIXEL_TYPES.find(t => t.value === px.pixel_type)?.label || px.pixel_type}</Badge></TableCell>
              <TableCell className="font-mono text-sm">{px.pixel_id}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {px.owner_type === "platform" ? "Plataforma" : px.owner_type === "salon" ? "Salão" : "Afiliado"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(px.events_json as string[])?.length > 0
                    ? (px.events_json as string[]).map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)
                    : <span className="text-xs text-muted-foreground">Todos</span>
                  }
                </div>
              </TableCell>
              <TableCell><Switch checked={px.active} onCheckedChange={() => toggleActive(px.id, px.active)} /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => deletePixel(px.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function WebhookLogsTable({ logs }: { logs: WebhookLog[] }) {
  if (logs.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum log de webhook registrado.</p>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
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
                {log.success
                  ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>
                  : <Badge variant="destructive">Falha</Badge>
                }
              </TableCell>
              <TableCell>{log.response_code || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

// ============================================
// STANDARD EVENTS OVERVIEW
// ============================================

function StandardEventsCard() {
  const eventsByCategory = STANDARD_EVENT_LIST.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {} as Record<string, typeof STANDARD_EVENT_LIST>);

  const categoryLabels: Record<string, string> = {
    user: "👤 Usuário",
    booking: "📅 Agendamento",
    payment: "💰 Pagamento",
    affiliate: "🤝 Afiliado",
    salon: "💈 Salão",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Eventos Padrão do Sistema
        </CardTitle>
        <CardDescription>Estes são os eventos disponíveis para webhooks e pixels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(eventsByCategory).map(([category, events]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm">{categoryLabels[category] || category}</h4>
              <div className="space-y-1">
                {events.map((e) => (
                  <div key={e.event} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-mono">{e.event}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IntegrationSettingsPage() {
  const { integrations, endpoints, pixels, webhookLogs, loading, refresh } = useIntegrationsData();

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
          <TabsTrigger value="gateways" className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />Gateways</TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />SMS/OTP</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="pixels" className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5" />Pixels</TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-1.5"><Webhook className="w-3.5 h-3.5" />Webhooks</TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />Storage</TabsTrigger>
          <TabsTrigger value="antifraud" className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Anti-fraude</TabsTrigger>
          <TabsTrigger value="apikeys" className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5" />API Keys</TabsTrigger>
        </TabsList>

        {/* GATEWAYS */}
        <TabsContent value="gateways" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gateways de Pagamento</h3>
            <AddIntegrationDialog onSaved={refresh} />
          </div>
          <IntegrationsTable integrations={integrations.filter(i => i.type === "payment")} onRefresh={refresh} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Webhook className="h-4 w-4" />URL do Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md text-sm break-all">{webhookUrl}</code>
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(webhookUrl); }}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Configure esta URL no painel do gateway.</p>
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
          <StandardEventsCard />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
            <AddEndpointDialog integrations={integrations} onSaved={refresh} />
          </div>
          <EndpointsTable endpoints={endpoints} onRefresh={refresh} />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Logs de Webhook</h3>
            <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-3 h-3 mr-1" />Atualizar</Button>
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

        {/* API KEYS */}
        <TabsContent value="apikeys" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">API Keys Customizadas</h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chaves de API</CardTitle>
              <CardDescription>Gerencie chaves de API personalizadas para integrações externas</CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Gerenciamento de API keys disponível em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
