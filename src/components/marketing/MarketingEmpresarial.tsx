/**
 * MarketingEmpresarial - Componente de vídeo promocional configurável
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Play, 
  Settings, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  MessageCircle, 
  Save,
  Upload,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBarbershop } from "@/hooks/useBarbershop";

interface MarketingSettings {
  id?: string;
  video_headline: string;
  video_url: string;
  video_description: string;
  button_text: string;
  button_url: string;
  button_target: 'internal' | 'external' | 'whatsapp';
  allow_professionals_view: boolean;
  is_active: boolean;
}

const MarketingEmpresarial = ({ isOwner = true }: { isOwner?: boolean }) => {
  const { barbershop } = useBarbershop();
  const [settings, setSettings] = useState<MarketingSettings>({
    video_headline: 'Descubra como aumentar seus clientes com nosso sistema',
    video_url: '',
    video_description: 'Nosso sistema automatiza agendamentos, envia lembretes e ajuda você a fidelizar clientes. Transforme sua barbearia em um negócio de sucesso.',
    button_text: 'Começar Agora',
    button_url: '/login',
    button_target: 'internal',
    allow_professionals_view: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Carregar configurações
  useEffect(() => {
    if (!barbershop?.id) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('marketing_settings')
          .select('*')
          .eq('barbershop_id', barbershop.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error);
          return;
        }

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [barbershop?.id]);

  // Salvar configurações
  const handleSave = async () => {
    if (!barbershop?.id || !isOwner) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('marketing_settings')
        .upsert({
          barbershop_id: barbershop.id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Renderizar vídeo
  const renderVideo = () => {
    if (!settings.video_url) {
      return (
        <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum vídeo configurado</p>
          </div>
        </div>
      );
    }

    // Verificar se é YouTube
    const youtubeMatch = settings.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            title="Vídeo Promocional"
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }

    // Verificar se é Vimeo
    const vimeoMatch = settings.video_url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            title="Vídeo Promocional"
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }

    // Vídeo direto (MP4)
    if (settings.video_url.endsWith('.mp4')) {
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video
            src={settings.video_url}
            controls
            className="w-full h-full"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect fill='%23374151' width='640' height='360'/%3E%3Ctext fill='%23fff' font-family='Arial' font-size='24' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EClique para reproduzir%3C/text%3E%3C/svg%3E"
          >
            <source src={settings.video_url} type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
        </div>
      );
    }

    // URL inválida
    return (
      <div className="w-full aspect-video bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Video className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">URL de vídeo inválida</p>
          <p className="text-red-500 text-sm mt-2">Use YouTube, Vimeo ou MP4</p>
        </div>
      </div>
    );
  };

  // Renderizar botão de CTA
  const renderCTAButton = () => {
    if (!settings.is_active) return null;

    const getButtonIcon = () => {
      switch (settings.button_target) {
        case 'external':
          return <ExternalLink className="w-4 h-4" />;
        case 'whatsapp':
          return <MessageCircle className="w-4 h-4" />;
        default:
          return <Play className="w-4 h-4" />;
      }
    };

    const handleClick = () => {
      switch (settings.button_target) {
        case 'external':
          window.open(settings.button_url, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/${settings.button_url.replace(/[^\d]/g, '')}`, '_blank');
          break;
        default:
          window.location.href = settings.button_url;
      }
    };

    return (
      <Button 
        onClick={handleClick}
        size="lg"
        className="w-full sm:w-auto"
      >
        {getButtonIcon()}
        {settings.button_text}
      </Button>
    );
  };

  // Se não for dono, mostrar apenas o preview
  if (!isOwner) {
    if (!settings.is_active || !settings.allow_professionals_view) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Marketing Empresarial não disponível</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Marketing Empresarial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{settings.video_headline}</h3>
            {renderVideo()}
          </div>
          
          {settings.video_description && (
            <div>
              <p className="text-gray-700">{settings.video_description}</p>
            </div>
          )}
          
          {renderCTAButton()}
        </CardContent>
      </Card>
    );
  }

  // Painel do dono - modo edição
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6" />
            Marketing Empresarial
          </h2>
          <p className="text-gray-600">Configure vídeo promocional e materiais de marketing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? "Editar" : "Preview"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {previewMode ? (
        // Modo preview
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview do Marketing
            </CardTitle>
            <CardDescription>
              Assim os clientes (e profissionais, se permitido) verão seu marketing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={settings.is_active ? "default" : "secondary"}>
                {settings.is_active ? "Ativo" : "Inativo"}
              </Badge>
              {settings.allow_professionals_view && (
                <Badge variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Visível para Profissionais
                </Badge>
              )}
            </div>

            {settings.is_active && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{settings.video_headline}</h3>
                  {renderVideo()}
                </div>
                
                {settings.video_description && (
                  <div>
                    <p className="text-gray-700">{settings.video_description}</p>
                  </div>
                )}
                
                {renderCTAButton()}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        // Modo edição
        <div className="grid gap-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Marketing Ativo</Label>
                  <p className="text-sm text-gray-600">Se o marketing será exibido para os clientes</p>
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Visível para Profissionais</Label>
                  <p className="text-sm text-gray-600">Se os profissionais podem ver esta seção</p>
                </div>
                <Switch
                  checked={settings.allow_professionals_view}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_professionals_view: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Vídeo */}
          <Card>
            <CardHeader>
              <CardTitle>Vídeo Promocional</CardTitle>
              <CardDescription>
                Configure o vídeo que aparecerá no topo da seção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video_headline">Headline do Vídeo</Label>
                <Input
                  id="video_headline"
                  value={settings.video_headline}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_headline: e.target.value }))}
                  placeholder="Título chamativo para o vídeo"
                />
              </div>

              <div>
                <Label htmlFor="video_url">URL do Vídeo</Label>
                <Input
                  id="video_url"
                  value={settings.video_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/... ou URL direta do MP4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suporta YouTube, Vimeo ou vídeos MP4 diretos
                </p>
              </div>

              <div>
                <Label htmlFor="video_description">Descrição do Vídeo</Label>
                <Textarea
                  id="video_description"
                  value={settings.video_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_description: e.target.value }))}
                  placeholder="Texto explicativo que aparecerá abaixo do vídeo"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Botão */}
          <Card>
            <CardHeader>
              <CardTitle>Botão de Call-to-Action</CardTitle>
              <CardDescription>
                Configure o botão que aparecerá abaixo do vídeo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="button_text">Texto do Botão</Label>
                <Input
                  id="button_text"
                  value={settings.button_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Começar Agora"
                />
              </div>

              <div>
                <Label htmlFor="button_target">Tipo de Destino</Label>
                <Select
                  value={settings.button_target}
                  onValueChange={(value: 'internal' | 'external' | 'whatsapp') => 
                    setSettings(prev => ({ ...prev, button_target: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Página Interna
                      </div>
                    </SelectItem>
                    <SelectItem value="external">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Link Externo
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="button_url">
                  {settings.button_target === 'whatsapp' ? 'Número do WhatsApp' : 'URL de Destino'}
                </Label>
                <Input
                  id="button_url"
                  value={settings.button_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, button_url: e.target.value }))}
                  placeholder={
                    settings.button_target === 'whatsapp' 
                      ? "+55 11 99999-9999"
                      : settings.button_target === 'external'
                      ? "https://exemplo.com"
                      : "/login"
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.button_target === 'whatsapp' 
                    ? "Apenas números, com código do país"
                    : settings.button_target === 'external'
                    ? "URL completa com https://"
                    : "Caminho relativo da página interna"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingEmpresarial;
