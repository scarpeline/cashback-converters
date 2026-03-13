/**
 * Módulo IA Assistant — Tipos
 * Agendamento automático via WhatsApp
 */

export type AIIntentType =
  | 'AGENDAR_SERVICO'
  | 'CANCELAR_AGENDAMENTO'
  | 'REMARCAR_AGENDAMENTO'
  | 'CONSULTAR_HORARIO'
  | 'CONSULTAR_PRECO'
  | 'FALAR_COM_ATENDENTE'
  | 'DESCONHECIDO';

export interface AIConversation {
  id: string;
  client_phone: string;
  barbershop_id: string;
  current_intent?: AIIntentType;
  conversation_state: AIConversationState;
  context: AIConversationContext;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export type AIConversationState =
  | 'awaiting_intent'
  | 'awaiting_service'
  | 'awaiting_professional'
  | 'awaiting_date'
  | 'awaiting_time'
  | 'awaiting_confirmation'
  | 'completed'
  | 'transferred_to_human'
  | 'cancelled';

export interface AIConversationContext {
  service_id?: string;
  service_name?: string;
  professional_id?: string;
  professional_name?: string;
  selected_date?: string;
  selected_time?: string;
  appointment_id?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'client' | 'assistant' | 'system';
  content: string;
  media_type?: 'text' | 'audio';
  created_at: string;
}

export interface AIInteraction {
  id: string;
  barbershop_id: string;
  client_phone: string;
  intent: AIIntentType;
  input_text: string;
  response_text: string;
  success: boolean;
  processing_time_ms: number;
  created_at: string;
}

export interface AvailableSlot {
  professional_id: string;
  professional_name: string;
  date: string;
  time: string;
  duration_minutes: number;
}
