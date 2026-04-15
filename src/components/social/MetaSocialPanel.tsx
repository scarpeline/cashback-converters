import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/pages/dashboards/owner/hooks";
import { useFeature } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Instagram, Facebook, Plus, Trash2, Zap, MessageCircle,
  Send, Link2, CheckCircle, Clock, AlertTriangle, RefreshCw,
  Eye, BarChart3, Bell, Lock,
} from "lucide-react";

// ── Banner Em Breve ───────────────────────────────────────────────────────────
function ComingSoonBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5 p-8 text-center">
      {/* Ícones decorativos */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Instagram className="w-8 h-8 text-white" />
        </div>
        <div className="w-4 h-4 rounded-full bg-orange-500/30" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Facebook className="w-8 h-8 text-white" />
        </div>
      </div>

      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-black text-sm px-4 py-1.5 mb-4">
        🚀 EM BREVE
      </Badge>

      <h2 className="text-2xl font-black text-white mb-3">
        Automação Instagram & Facebook
      </h2>
      <p className="text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
        Responda comentários automaticamente, envie DMs para quem comentar nos seus Reels, Posts e Stories — tudo integrado ao seu sistema de agendamento.
      </p>

      {/* Funcionalidades previstas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-8 text-left">
        {[
          { icon: <MessageCircle className="w-4 h-4 text-pink-400" />, text: "Resposta automática em comentários" },
          { icon: <Send className="w-4 h-4 text-blue-400" />, text: "DM automático para quem comentar" },
          { icon: <Link2 className="w-4 h-4 text-orange-400" />, text: "Link de agendamento no Direct" },
          { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "Gatilhos por palavras-chave" },
          { icon: <Eye className="w-4 h-4 text-green-400" />, text: "Funciona em Posts, Reels e Stories" },
          { icon: <BarChart3 className="w-4 h-4 text-purple-400" />, text: "Relatório de interações" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
            {item.icon}
            <span className="text-sm text-slate-300">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Status de aprovação */}
      <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5 text-sm text-yellow-400">
        <Clock className="w-4 h-4" />
        <span>Aguardando aprovação da Meta · Previsão: 2-3 semanas</span>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Você será notificado assim que a funcionalidade for liberada para sua conta.
      </p>
    </div>
  );
}

// ── Painel real (liberado após aprovação Meta) ────────────────────────────────
interface MetaAccount {
  id: string;
  platform: "instagram" | "facebook";
  account_name: string;
  account_username: string;
  account_picture_url?: string;
  is_active: boolean;
  connected_at: string;
}

interface Automation {
  id: string;
  name: string;
  is_active: boolean;
  trigger_keywords: string[];
  trigger_all_comments: boolean;
  apply_to_posts: boolean;
  apply_to_reels: boolean;
  reply_comment_enabled: boolean;
  reply_comment_text: string;
  reply_comment_include_link: boolean;
  reply_comment_link: string;
  send_dm_enabled: boolean;
  dm_text: string;
  dm_include_booking_link: boolean;
  total_triggered: number;
  total_replies_sent: number;
  total_dms_sent: number;
}

function AutomationForm({ barbershopId, accountId, onClose }: { barbershopId: string; accountId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger_all_comments: false,
    trigger_keywords: "",
    apply_to_posts: true,
    apply_to_reels: true,
    reply_comment_enabled: true,
    reply_comment_text: "Olá! Obrigado pelo comentário 😊 Enviamos mais detalhes no seu Direct!",
    reply_comment_include_link: false,
    reply_comment_link: "",
    send_dm_enabled: true,
    dm_text: "Olá! Vi que você se interessou. Clique no link abaixo para agendar:",
    dm_include_booking_link: true,
  });

  const save = async () => {
    if (!form.name) { toast.error("Informe um nome para a automação"); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("meta_comment_automations").insert({
      barbershop_id: barbershopId,
      account_id: accountId,
      name: form.name,
      trigger_all_comments: form.trigger_all_comments,
      trigger_keywords: form.trigger_keywords.split(",").map(k => k.trim()).filter(Boolean),
      apply_to_posts: form.apply_to_posts,
      apply_to_reels: form.apply_to_reels,
      reply_comment_enabled: form.reply_comment_enabled,
      reply_comment_text: form.reply_comment_text,
      reply_comment_include_link: form.reply_comment_include_link,
      reply_comment_link: form.reply_comment_link,
      send_dm_enabled: form.send_dm_enabled,
      dm_text: form.dm_text,
      dm_include_booking_link: form.dm_include_booking_link,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Automação criada!");
    qc.invalidateQueries({ queryKey: ["meta-automations"] });
    onClose();
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label className="text-xs text-slate-400">Nome da automação *</Label>
        <Input placeholder="Ex: Resposta para Reels" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="mt-1 bg-slate-800 border-slate-600 text-white" />
      </div>

      {/* Gatilhos */}
      <div className="p-4 bg-white/5 rounded-xl space-y-3">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gatilhos</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-slate-300">Todos os comentários</Label>
          <Switch checked={form.trigger_all_comments} onCheckedChange={v => setForm(f => ({ ...f, trigger_all_comments: v }))} />
        </div>
        {!form.trigger_all_comments && (
          <div>
            <Label className="text-xs text-slate-400">Palavras-chave (separadas por vírgula)</Label>
            <Input placeholder="preço, agendar, quanto custa, horário" value={form.trigger_keywords}
              onChange={e => setForm(f => ({ ...f, trigger_keywords: e.target.value }))}
              className="mt-1 bg-slate-800 border-slate-600 text-white text-sm" />
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={form.apply_to_posts} onCheckedChange={v => setForm(f => ({ ...f, apply_to_posts: v }))} />
            <Label className="text-sm text-slate-300">Posts</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.apply_to_reels} onCheckedChange={v => setForm(f => ({ ...f, apply_to_reels: v }))} />
            <Label className="text-sm text-slate-300">Reels</Label>
          </div>
        </div>
      </div>

      {/* Resposta no comentário */}
      <div className="p-4 bg-white/5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-pink-400" /> Resposta no Comentário
          </p>
          <Switch checked={form.reply_comment_enabled} onCheckedChange={v => setForm(f => ({ ...f, reply_comment_enabled: v }))} />
        </div>
        {form.reply_comment_enabled && (
          <>
            <Textarea rows={3} value={form.reply_comment_text} onChange={e => setForm(f => ({ ...f, reply_comment_text: e.target.value }))}
              className="bg-slate-800 border-slate-600 text-white text-sm resize-none" />
            <div className="flex items-center gap-2">
              <Switch checked={form.reply_comment_include_link} onCheckedChange={v => setForm(f => ({ ...f, reply_comment_include_link: v }))} />
              <Label className="text-sm text-slate-300">Incluir link</Label>
            </div>
            {form.reply_comment_include_link && (
              <Input placeholder="https://..." value={form.reply_comment_link}
                onChange={e => setForm(f => ({ ...f, reply_comment_link: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white text-sm" />
            )}
          </>
        )}
      </div>

      {/* DM automático */}
      <div className="p-4 bg-white/5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-400" /> DM Automático
          </p>
          <Switch checked={form.send_dm_enabled} onCheckedChange={v => setForm(f => ({ ...f, send_dm_enabled: v }))} />
        </div>
        {form.send_dm_enabled && (
          <>
            <Textarea rows={3} value={form.dm_text} onChange={e => setForm(f => ({ ...f, dm_text: e.target.value }))}
              className="bg-slate-800 border-slate-600 text-white text-sm resize-none" />
            <div className="flex items-center gap-2">
              <Switch checked={form.dm_include_booking_link} onCheckedChange={v => setForm(f => ({ ...f, dm_include_booking_link: v }))} />
              <Label className="text-sm text-slate-300">Incluir link de agendamento automaticamente</Label>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 border-slate-600 text-slate-300" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold" onClick={save} disabled={saving}>
          {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : "Criar Automação"}
        </Button>
      </div>
    </div>
  );
}

function MetaSocialPanelActive() {
  const { barbershop } = useBarbershop();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ["meta-accounts", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data } = await (supabase as any).from("meta_social_accounts").select("*").eq("barbershop_id", barbershop.id).eq("is_active", true);
      return (data || []) as MetaAccount[];
    },
    enabled: !!barbershop?.id,
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["meta-automations", barbershop?.id],
    queryFn: async () => {
      if (!barbershop?.id) return [];
      const { data } = await (supabase as any).from("meta_comment_automations").select("*").eq("barbershop_id", barbershop.id).order("created_at", { ascending: false });
      return (data || []) as Automation[];
    },
    enabled: !!barbershop?.id,
  });

  const connectMeta = (platform: "instagram" | "facebook") => {
    const appId = import.meta.env.VITE_META_APP_ID || "SEU_APP_ID";
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/meta/callback`);
    const scope = platform === "instagram"
      ? "instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list"
      : "pages_show_list,pages_messaging,pages_read_engagement";
    window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${platform}`;
  };

  const toggleAutomation = async (id: string, current: boolean) => {
    await (supabase as any).from("meta_comment_automations").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["meta-automations"] });
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Excluir esta automação?")) return;
    await (supabase as any).from("meta_comment_automations").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["meta-automations"] });
    toast.success("Automação excluída");
  };

  return (
    <div className="space-y-6">
      {/* Contas conectadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Contas Conectadas</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => connectMeta("instagram")}
              className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-xl text-xs">
              <Instagram className="w-3.5 h-3.5 mr-1.5" /> Instagram
            </Button>
            <Button size="sm" onClick={() => connectMeta("facebook")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs">
              <Facebook className="w-3.5 h-3.5 mr-1.5" /> Facebook
            </Button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-slate-500">
            <Instagram className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhuma conta conectada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                {acc.platform === "instagram"
                  ? <Instagram className="w-5 h-5 text-pink-400" />
                  : <Facebook className="w-5 h-5 text-blue-400" />}
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{acc.account_name}</p>
                  <p className="text-xs text-slate-400">@{acc.account_username}</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" /> Conectado
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automações */}
      {accounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">Automações</h3>
            <Button size="sm" onClick={() => { setSelectedAccountId(accounts[0].id); setShowForm(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Automação
            </Button>
          </div>

          {showForm && selectedAccountId && (
            <Card className="glass-card border-orange-500/20 rounded-2xl mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-white">Nova Automação</CardTitle></CardHeader>
              <CardContent>
                <AutomationForm barbershopId={barbershop?.id || ""} accountId={selectedAccountId} onClose={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          {automations.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-slate-500">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma automação criada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map(auto => (
                <Card key={auto.id} className="glass-card border-white/10 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-white">{auto.name}</p>
                          <Badge className={auto.is_active ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" : "bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs"}>
                            {auto.is_active ? "Ativa" : "Pausada"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {auto.trigger_all_comments
                            ? <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Todos os comentários</span>
                            : auto.trigger_keywords.map(kw => (
                              <span key={kw} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{kw}</span>
                            ))}
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>🔔 {auto.total_triggered} ativações</span>
                          <span>💬 {auto.total_replies_sent} respostas</span>
                          <span>📩 {auto.total_dms_sent} DMs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={auto.is_active} onCheckedChange={() => toggleAutomation(auto.id, auto.is_active)} />
                        <button onClick={() => deleteAutomation(auto.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal com feature flag ─────────────────────────────────────
export function MetaSocialPanel() {
  const { enabled, loading } = useFeature("meta_social_integration");

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  // Feature flag desativada → mostra "Em Breve"
  if (!enabled) return <ComingSoonBanner />;

  // Feature flag ativada → mostra painel real
  return <MetaSocialPanelActive />;
}
