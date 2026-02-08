/**
 * Hook para gerenciar configurações de integração
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Environment, ServiceName } from "@/lib/integrations/api-config";

interface IntegrationSetting {
  id: string;
  service_name: string;
  environment: string;
  api_key_hash: string | null;
  webhook_secret_hash: string | null;
  base_url: string | null;
  from_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AppEnvironment {
  current_env: Environment;
  updated_at: string;
}

export function useIntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSetting[]>([]);
  const [appEnvironment, setAppEnvironment] = useState<AppEnvironment | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar configurações
  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Carregar ambiente
      const { data: envData, error: envError } = await supabase
        .from('app_environment')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (envError) throw envError;
      
      if (envData) {
        setAppEnvironment({
          current_env: envData.current_env as Environment,
          updated_at: envData.updated_at,
        });
      }

      // Carregar settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('integration_settings')
        .select('*')
        .order('service_name');

      if (settingsError) throw settingsError;
      setSettings(settingsData as IntegrationSetting[] || []);
    } catch (error) {
      console.error('Failed to load integration settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de integração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Alternar ambiente global
  const switchEnvironment = async (env: Environment) => {
    try {
      const { error } = await supabase
        .from('app_environment')
        .update({ current_env: env, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setAppEnvironment((prev) => prev ? { ...prev, current_env: env } : null);
      
      toast({
        title: "Ambiente alterado",
        description: `Ambiente alterado para ${env === 'sandbox' ? 'Teste (Sandbox)' : 'Produção'}`,
      });

      return true;
    } catch (error) {
      console.error('Failed to switch environment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o ambiente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Salvar ou atualizar configuração
  const saveSettings = async (
    service: ServiceName,
    environment: Environment,
    config: {
      apiKey?: string;
      webhookSecret?: string;
      baseUrl?: string;
      fromEmail?: string;
      isActive: boolean;
    }
  ) => {
    const sha256Hex = async (value: string) => {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };

    try {
      // Verificar se já existe
      const existing = settings.find(
        (s) => s.service_name === service && s.environment === environment
      );

      // IMPORTANTE: não persistimos chaves em texto puro no frontend.
      const payload = {
        service_name: service,
        environment,
        api_key_hash: config.apiKey ? await sha256Hex(config.apiKey) : null,
        webhook_secret_hash: config.webhookSecret ? await sha256Hex(config.webhookSecret) : null,
        base_url: config.baseUrl || null,
        from_email: config.fromEmail || null,
        is_active: config.isActive,
      };

      if (existing) {
        const { error } = await supabase
          .from('integration_settings')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integration_settings')
          .insert(payload);

        if (error) throw error;
      }

      await fetchSettings();

      toast({
        title: "Configuração salva",
        description: `${service.toUpperCase()} (${environment}) foi atualizado com sucesso.`,
      });

      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle ativo/inativo
  const toggleServiceActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
      );

      return true;
    } catch (error) {
      console.error('Failed to toggle service:', error);
      return false;
    }
  };

  return {
    settings,
    appEnvironment,
    loading,
    switchEnvironment,
    saveSettings,
    toggleServiceActive,
    refresh: fetchSettings,
  };
}
