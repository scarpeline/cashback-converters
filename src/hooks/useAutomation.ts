/**
 * Hook de Automação de Reativação
 * Gerencia configurações, templates e envios automáticos
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
// import { useSubscription } from '@/contexts/SubscriptionContext'; // Desativado temporariamente

export interface InactivitySettings {
  id: string;
  user_role: string;
  inactivity_days: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'whatsapp';
  user_role: string;
  subject?: string;
  content: string;
  variables: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInactivityTracking {
  id: string;
  user_id: string;
  user_role: string;
  last_login: string;
  inactivity_days: number;
  status: 'active' | 'warning' | 'inactive' | 'reactivated' | 'subscribed';
  last_notification_at?: string;
  notification_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationSendLog {
  id: string;
  user_id: string;
  template_id: string;
  channel: string;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AutomationPermissions {
  id: string;
  user_role: string;
  can_configure_inactivity: boolean;
  can_create_templates: boolean;
  can_view_logs: boolean;
  can_manage_automation: boolean;
  created_at: string;
  updated_at: string;
}

export function useAutomation() {
  const { user, hasRole } = useAuth();
  // const { isActive: hasSubscription } = useSubscription(); // Desativado temporariamente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurações de inatividade
  const [inactivitySettings, setInactivitySettings] = useState<InactivitySettings[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [tracking, setTracking] = useState<UserInactivityTracking[]>([]);
  const [sendLogs, setSendLogs] = useState<AutomationSendLog[]>([]);
  const [permissions, setPermissions] = useState<AutomationPermissions[]>([]);

  // Verificar permissões do usuário atual
  const checkPermission = useCallback((permission: keyof Omit<AutomationPermissions, 'id' | 'user_role' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;
    
    const userRole = hasRole('super_admin') ? 'super_admin' : hasRole('dono') ? 'dono' : null;
    if (!userRole) return false;

    const userPermissions = permissions.find(p => p.user_role === userRole);
    return userPermissions?.[permission] || false;
  }, [user, hasRole, permissions]);

  // Carregar configurações de inatividade
  const loadInactivitySettings = useCallback(async () => {
    if (!checkPermission('can_view_logs')) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('inactivity_settings')
        .select('*')
        .order('user_role');

      if (error) throw error;
      setInactivitySettings(data || []);
    } catch (err) {
      setError('Erro ao carregar configurações de inatividade');
      console.error('Erro ao carregar inactivity settings:', err);
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  // Atualizar configuração de inatividade
  const updateInactivitySettings = useCallback(async (settings: Partial<InactivitySettings>[]) => {
    if (!checkPermission('can_configure_inactivity')) {
      throw new Error('Sem permissão para configurar inatividade');
    }

    setLoading(true);
    setError(null);

    try {
      const updates = settings.map(setting => 
        supabase
          .from('inactivity_settings')
          .update({
            inactivity_days: setting.inactivity_days,
            is_enabled: setting.is_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_role', setting.user_role)
      );

      await Promise.all(updates);
      await loadInactivitySettings();
    } catch (err) {
      setError('Erro ao atualizar configurações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkPermission, loadInactivitySettings]);

  // Carregar templates
  const loadTemplates = useCallback(async () => {
    if (!checkPermission('can_view_logs')) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('automation_templates')
        .select('*')
        .order('user_role, channel');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setError('Erro ao carregar templates');
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  // Criar ou atualizar template
  const saveTemplate = useCallback(async (template: Partial<AutomationTemplate>) => {
    if (!checkPermission('can_create_templates')) {
      throw new Error('Sem permissão para criar templates');
    }

    setLoading(true);
    setError(null);

    try {
      if (template.id) {
        // Atualizar
        const { error } = await supabase
          .from('automation_templates')
          .update({
            name: template.name,
            channel: template.channel,
            user_role: template.user_role,
            subject: template.subject,
            content: template.content,
            variables: template.variables,
            is_active: template.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('automation_templates')
          .insert({
            name: template.name,
            channel: template.channel,
            user_role: template.user_role,
            subject: template.subject,
            content: template.content,
            variables: template.variables,
            is_active: template.is_active,
            created_by: user?.id
          });

        if (error) throw error;
      }

      await loadTemplates();
    } catch (err) {
      setError('Erro ao salvar template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkPermission, user?.id, loadTemplates]);

  // Carregar tracking de inatividade
  const loadTracking = useCallback(async () => {
    if (!checkPermission('can_view_logs')) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_inactivity_tracking')
        .select('*')
        .order('last_login DESC');

      if (error) throw error;
      setTracking(data || []);
    } catch (err) {
      setError('Erro ao carregar tracking');
      console.error('Erro ao carregar tracking:', err);
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  // Carregar logs de envio
  const loadSendLogs = useCallback(async (limit = 100) => {
    if (!checkPermission('can_view_logs')) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('automation_send_log')
        .select('*')
        .order('sent_at DESC')
        .limit(limit);

      if (error) throw error;
      setSendLogs(data || []);
    } catch (err) {
      setError('Erro ao carregar logs de envio');
      console.error('Erro ao carregar send logs:', err);
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  // Carregar permissões
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('automation_permissions')
        .select('*')
        .order('user_role');

      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      setError('Erro ao carregar permissões');
      console.error('Erro ao carregar permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Processar inatividade diária (função admin)
  const processDailyInactivity = useCallback(async () => {
    if (!checkPermission('can_manage_automation')) {
      throw new Error('Sem permissão para gerenciar automação');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('process_daily_inactivity');

      if (error) throw error;

      // Para cada usuário que precisa de notificação, enviar mensagem
      for (const user of data || []) {
        if (user.should_notify) {
          await sendNotification(user);
        }
      }

      await loadTracking();
      return data;
    } catch (err) {
      setError('Erro ao processar inatividade');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkPermission, loadTracking]);

  // Enviar notificação
  const sendNotification = useCallback(async (user: any) => {
    try {
      // Buscar template ativo para o perfil e canal
      const { data: templates } = await supabase
        .from('automation_templates')
        .select('*')
        .eq('user_role', user.user_role)
        .eq('is_active', true);

      if (!templates || templates.length === 0) {
        console.warn('Nenhum template encontrado para', user.user_role);
        return;
      }

      // Buscar dados do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, whatsapp, name')
        .eq('user_id', user.user_id)
        .single();

      if (!profile) {
        console.warn('Perfil não encontrado para', user.user_id);
        return;
      }

      // Enviar para cada canal configurado
      for (const template of templates) {
        const recipient = template.channel === 'email' ? profile.email : profile.whatsapp;
        
        if (!recipient) {
          console.warn(`Destinatário não encontrado para ${template.channel}`);
          continue;
        }

        // Personalizar mensagem
        const personalizedContent = personalizeMessage(template.content, {
          nome: profile.name,
          dias_inativo: user.inactivity_days,
          link_reativacao: `${window.location.origin}/login?reactivate=${user.user_id}`,
          email: profile.email,
          whatsapp: profile.whatsapp
        });

        // Registrar envio
        const logId = await supabase.rpc('log_automation_send', {
          p_user_id: user.user_id,
          p_template_id: template.id,
          p_channel: template.channel,
          p_recipient: recipient,
          p_status: 'sent',
          p_metadata: { content: personalizedContent }
        });

        // Aqui você implementaria o envio real (email, SMS, WhatsApp)
        console.log(`Enviando ${template.channel} para ${recipient}:`, personalizedContent);
      }
    } catch (err) {
      console.error('Erro ao enviar notificação:', err);
      throw err;
    }
  }, []);

  // Personalizar mensagem com variáveis
  const personalizeMessage = useCallback((content: string, variables: Record<string, string>) => {
    let personalized = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return personalized;
  }, []);

  // Atualizar tracking quando usuário faz login
  const updateUserTracking = useCallback(async () => {
    if (!user) return;

    try {
      const userRole = hasRole('super_admin') ? 'super_admin' : 
                      hasRole('dono') ? 'dono' :
                      hasRole('profissional') ? 'profissional' :
                      hasRole('cliente') ? 'cliente' :
                      hasRole('afiliado_barbearia') ? 'afiliado_barbearia' :
                      hasRole('afiliado_saas') ? 'afiliado_saas' :
                      hasRole('contador') ? 'contador' : 'cliente';

      // ✅ NOVO: Verificar status de assinatura e atualizar tracking
      let trackingStatus = 'reactivated';
      // Temporariamente desativado até resolver dependência circular
      // if (hasSubscription) {
      //   trackingStatus = 'subscribed'; // Se tem assinatura ativa
      // }

      await supabase.rpc('update_user_inactivity_tracking', {
        p_user_id: user.id,
        p_last_login: new Date().toISOString(),
        p_user_role: userRole
      });

      // ✅ NOVO: Se tem assinatura, garantir status subscribed
      // Temporariamente desativado até resolver dependência circular
      // if (hasSubscription) {
      //   await supabase
      //     .from('user_inactivity_tracking')
      //     .update({ status: 'subscribed' })
      //     .eq('user_id', user.id);
      // }

    } catch (err) {
      console.error('Erro ao atualizar tracking:', err);
    }
  }, [user, hasRole]); // Removido hasSubscription temporariamente

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadPermissions();
      loadInactivitySettings();
      loadTemplates();
      loadTracking();
      loadSendLogs();
      updateUserTracking();
    }
  }, [user, loadPermissions, loadInactivitySettings, loadTemplates, loadTracking, loadSendLogs, updateUserTracking]);

  return {
    // Dados
    inactivitySettings,
    templates,
    tracking,
    sendLogs,
    permissions,
    loading,
    error,

    // Métodos
    checkPermission,
    loadInactivitySettings,
    updateInactivitySettings,
    loadTemplates,
    saveTemplate,
    loadTracking,
    loadSendLogs,
    processDailyInactivity,
    sendNotification,
    personalizeMessage,
    updateUserTracking
  };
}
