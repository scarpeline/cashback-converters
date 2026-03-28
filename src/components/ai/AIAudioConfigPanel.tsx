import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bot, Mic, MessageSquare, Volume2, Settings2, Zap } from "lucide-react";

interface AIAudioConfigPanelProps {
  barbershopId: string;
}

interface AIConfig {
  response_type: string;
  personality: string;
  voice_id: string | null;
  language: string;
  auto_booking: boolean;
  auto_register_client: boolean;
  auto_reactivation: boolean;
  auto_billing: boolean;
  greeting_message: string;
}

const defaultConfig: AIConfig = {
  response_type: "text",
  personality: "friendly",
  voice_id: null,
  language: "pt-BR",
  auto_booking: true,
  auto_register_client: true,
  auto_reactivation: true,
  auto_billing: false,
  greeting_message: "Olá! Sou o assistente virtual. Como posso ajudar?",
};

export function AIAudioConfigPanel({ barbershopId }: AIAudioConfigPanelProps) {
  const [config, setConfig] = useState<AIConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("ai_config")
          .select("*")
          .eq("barbershop_id", barbershopId)
          .maybeSingle();

        if (data) {
          setConfig({
            response_type: data.response_type,
            personality: data.personality,
            voice_id: data.voice_id,
            language: data.language,
            auto_booking: data.auto_booking,
            auto_register_client: data.auto_register_client,
            auto_reactivation: data.auto_reactivation,
            auto_billing: data.auto_billing,
            greeting_message: data.greeting_message,
          });
        }
      } catch (err) {
        console.error("Error loading AI config:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [barbershopId]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("ai_config")
        .upsert({
          barbershop_id: barbershopId,
          ...config,
          updated_at: new Date().toISOString(),
        }, { onConflict: "barbershop_id" });

      if (error) throw error;
      toast({ title: "Configurações salvas!", description: "A IA foi atualizada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Assistente Inteligente
          </h2>
          <p className="text-muted-foreground">Configure a IA de atendimento automático do seu negócio</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      <Tabs defaultValue="response">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="response"><MessageSquare className="w-4 h-4 mr-1" />Resposta</TabsTrigger>
          <TabsTrigger value="automation"><Zap className="w-4 h-4 mr-1" />Automações</TabsTrigger>
          <TabsTrigger value="voice"><Volume2 className="w-4 h-4 mr-1" />Voz</TabsTrigger>
        </TabsList>

        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Resposta</CardTitle>
              <CardDescription>Como a IA deve responder aos clientes no WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Formato de resposta</Label>
                <Select value={config.response_type} onValueChange={(v) => setConfig(p => ({ ...p, response_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">📝 Apenas Texto</SelectItem>
                    <SelectItem value="audio">🎤 Apenas Áudio</SelectItem>
                    <SelectItem value="auto">🤖 Automático (detecta se cliente enviou áudio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Personalidade da IA</Label>
                <Select value={config.personality} onValueChange={(v) => setConfig(p => ({ ...p, personality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">👔 Formal e Profissional</SelectItem>
                    <SelectItem value="friendly">😊 Amigável e Caloroso</SelectItem>
                    <SelectItem value="premium">✨ Premium e Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea
                  value={config.greeting_message}
                  onChange={(e) => setConfig(p => ({ ...p, greeting_message: e.target.value }))}
                  placeholder="Mensagem inicial quando o cliente entra em contato"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funções Automáticas</CardTitle>
              <CardDescription>O que a IA pode fazer automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "auto_booking" as const, label: "Agendamento Automático", desc: "IA pode marcar horários diretamente", icon: "📅" },
                { key: "auto_register_client" as const, label: "Cadastro de Clientes", desc: "Registrar novos clientes durante conversa", icon: "👤" },
                { key: "auto_reactivation" as const, label: "Reativação de Inativos", desc: "Enviar mensagens para clientes que não voltaram", icon: "🔄" },
                { key: "auto_billing" as const, label: "Envio de Cobranças", desc: "Gerar e enviar links de pagamento", icon: "💰" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={config[item.key]}
                    onCheckedChange={(v) => setConfig(p => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Configuração de Voz
              </CardTitle>
              <CardDescription>Personalize a voz da IA para respostas em áudio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voz (OpenAI TTS)</Label>
                <Select value={config.voice_id || "nova"} onValueChange={(v) => setConfig(p => ({ ...p, voice_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy (Neutro)</SelectItem>
                    <SelectItem value="echo">Echo (Masculino)</SelectItem>
                    <SelectItem value="fable">Fable (Narrativo)</SelectItem>
                    <SelectItem value="onyx">Onyx (Masculino Grave)</SelectItem>
                    <SelectItem value="nova">Nova (Feminino)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Feminino Suave)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={config.language} onValueChange={(v) => setConfig(p => ({ ...p, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">IA de Áudio</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando um cliente envia um áudio no WhatsApp, a IA converte para texto (Speech-to-Text), 
                  processa a intenção e responde conforme o formato configurado acima.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
