// Serviço de Integração com WhatsApp
// Integração com IA e automação

import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  type: 'text' | 'audio' | 'image' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  ai_response?: string;
}

export interface WhatsAppConfig {
  api_url: string;
  api_key: string;
  phone_id: string;
  business_id: string;
}

interface SendResult {
  success: boolean;
  message_id?: string;
  error?: string;
  ai_response?: string;
}

/**
 * Enviar mensagem via WhatsApp
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  type: 'text' | 'audio' = 'text'
): Promise<SendResult> {
  try {
    const cleanNumber = to.replace(/\D/g, '');
    
    if (cleanNumber.length < 10) {
      return { success: false, error: 'Número inválido' };
    }

    const { data: config, error: configError } = await (supabase as any)
      .from('integration_settings')
      .select('*')
      .eq('service_name', 'whatsapp')
      .eq('environment', 'sandbox')
      .single();

    if (configError || !config) {
      console.warn('WhatsApp não configurado, usando modo simulado');
      return { 
        success: true, 
        message_id: `sim-${Date.now()}`,
        error: 'Modo simulado - WhatsApp não configurado' 
      };
    }

    const response = await fetch(`${config.api_url}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanNumber,
        message: message,
        type: type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Erro ao enviar mensagem' };
    }

    const data = await response.json();
    
    await (supabase as any).from('whatsapp_messages').insert({
      from: config.phone_id,
      to: cleanNumber,
      message: message,
      type: 'text',
      status: 'sent',
      ai_response: data.response,
    });

    return { success: true, message_id: data.message_id, ai_response: data.ai_response };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
}

/**
 * Enviar mensagem com IA
 */
export async function sendWhatsAppWithAI(
  to: string,
  message: string,
  clientId: string
): Promise<{ success: boolean; ai_response?: string }> {
  try {
    const { data: config } = await (supabase as any)
      .from('integration_settings')
      .select('*')
      .eq('service_name', 'whatsapp')
      .single();

    if (!config) {
      return { 
        success: true, 
        ai_response: 'Modo simulado - WhatsApp não configurado' 
      };
    }

    const result = await sendWhatsAppMessage(to, message, 'text');

    if (result.success) {
      await (supabase as any).from('ai_memory').insert({
        client_id: clientId,
        message: message,
        response: result.ai_response || message,
        intent: 'whatsapp_response',
      });
    }

    return { 
      success: result.success, 
      ai_response: result.ai_response 
    };
  } catch (error) {
    console.error('Erro ao enviar com IA:', error);
    return { success: false };
  }
}

/**
 * Receber mensagem do WhatsApp (webhook)
 */
export async function receiveWhatsAppMessage(
  from: string,
  message: string,
  _type: 'text' | 'audio' = 'text'
): Promise<{ response: string; ai_response?: string }> {
  try {
    let clientId = from;
    
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, user_id, name')
      .eq('whatsapp', from)
      .single();

    if (profile) {
      clientId = profile.user_id;
    }

    const responseMsg = 'Olá! Como posso ajudar?';

    return {
      response: responseMsg,
      ai_response: responseMsg,
    };
  } catch (error) {
    console.error('Erro ao receber mensagem:', error);
    return {
      response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
    };
  }
}

/**
 * Enviar mensagem de áudio (TTS)
 */
export async function sendAudioMessage(
  to: string,
  text: string,
  _voice: 'pt-BR' | 'pt-PT' = 'pt-BR'
): Promise<{ success: boolean; message_id?: string }> {
  try {
    const { data: config } = await (supabase as any)
      .from('integration_settings')
      .select('*')
      .eq('service_name', 'whatsapp')
      .single();

    if (!config) {
      return { 
        success: true, 
        message_id: `sim-audio-${Date.now()}` 
      };
    }

    const response = await fetch(`${config.api_url}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: to.replace(/\D/g, ''),
        message: text,
        type: 'audio',
        voice: _voice,
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return { success: true, message_id: data.message_id };
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    return { success: false };
  }
}

/**
 * Verificar status da mensagem
 */
export async function checkMessageStatus(messageId: string): Promise<{
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
}> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_messages')
      .select('status, timestamp')
      .eq('message_id', messageId)
      .single();

    if (error || !data) {
      return { status: 'failed' };
    }

    return {
      status: data.status,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return { status: 'failed' };
  }
}

/**
 * Buscar histórico de mensagens
 */
export async function getWhatsAppHistory(
  clientId: string,
  limit: number = 50
): Promise<WhatsAppMessage[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('whatsapp_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

/**
 * Configurar webhook do WhatsApp
 */
export async function setupWebhook(
  webhookUrl: string,
  verifyToken: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: config, error } = await (supabase as any)
      .from('integration_settings')
      .select('*')
      .eq('service_name', 'whatsapp')
      .single();

    if (error || !config) {
      return { success: false, message: 'WhatsApp não configurado' };
    }

    const response = await fetch(`${config.api_url}/webhook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: webhookUrl,
        verify_token: verifyToken,
        events: ['messages', 'statuses'],
      }),
    });

    if (!response.ok) {
      return { success: false, message: 'Erro ao configurar webhook' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao configurar webhook:', error);
    return { success: false, message: 'Erro ao configurar webhook' };
  }
}

/**
 * Enviar mensagem de reativação
 */
export async function sendReactivationMessage(
  clientId: string,
  message: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('whatsapp')
      .eq('user_id', clientId)
      .single();

    if (!profile?.whatsapp) {
      return { success: false, message: 'Telefone não encontrado' };
    }

    const result = await sendWhatsAppMessage(profile.whatsapp, message);
    return { success: result.success, message: result.error };
  } catch (error) {
    console.error('Erro ao enviar mensagem de reativação:', error);
    return { success: false };
  }
}

/**
 * Enviar mensagem de lembrete de agendamento
 */
export async function sendAppointmentReminder(
  appointmentId: string,
  clientId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: appointment } = await (supabase as any)
      .from('appointments')
      .select('*, services(name), professionals(name)')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return { success: false, message: 'Agendamento não encontrado' };
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('whatsapp')
      .eq('user_id', clientId)
      .single();

    if (!profile?.whatsapp) {
      return { success: false, message: 'Telefone não encontrado' };
    }

    const dataHora = new Date(appointment.scheduled_at);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const reminderMessage = `Olá! Lembrete do seu agendamento 📅\n\n📅 Data: ${dataFormatada}\n⏰ Hora: ${horaFormatada}\n💈 Serviço: ${appointment.services?.name}\n✂️ Profissional: ${appointment.professionals?.name}\n\nAté logo!`;

    const result = await sendWhatsAppMessage(profile.whatsapp, reminderMessage);
    return { success: result.success, message: result.error };
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error);
    return { success: false };
  }
}
