import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WhatsappConversation {
  id: string;
  barbershop_id: string;
  client_whatsapp: string;
  current_step: string;
  conversation_state: Record<string, any>;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsappMessageTemplate {
  id: string;
  barbershop_id: string;
  template_name: string;
  template_content: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const db = supabase as any;

export const getConversation = async (
  barbershopId: string,
  clientWhatsapp: string
): Promise<WhatsappConversation | null> => {
  const { data, error } = await db
    .from("whatsapp_conversations")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("client_whatsapp", clientWhatsapp)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar conversa:", error);
  }
  return data || null;
};

export const createConversation = async (
  barbershopId: string,
  clientWhatsapp: string
): Promise<WhatsappConversation | null> => {
  const { data, error } = await db
    .from("whatsapp_conversations")
    .insert({
      barbershop_id: barbershopId,
      client_whatsapp: clientWhatsapp,
      current_step: "initial",
      conversation_state: {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar conversa:", error);
  }
  return data || null;
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<Omit<WhatsappConversation, "id" | "barbershop_id" | "client_whatsapp" | "created_at">>
): Promise<WhatsappConversation | null> => {
  const { data, error } = await db
    .from("whatsapp_conversations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar conversa:", error);
  }
  return data || null;
};

export const endConversation = async (
  conversationId: string
): Promise<boolean> => {
  const { error } = await db
    .from("whatsapp_conversations")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    console.error("Erro ao encerrar conversa:", error);
    return false;
  }
  return true;
};

export const getMessageTemplate = async (
  barbershopId: string,
  templateName: string
): Promise<WhatsappMessageTemplate | null> => {
  const { data, error } = await db
    .from("whatsapp_message_templates")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .eq("template_name", templateName)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar template de mensagem:", error);
  }
  return data || null;
};

export const getAllMessageTemplates = async (
  barbershopId: string
): Promise<WhatsappMessageTemplate[]> => {
  const { data, error } = await db
    .from("whatsapp_message_templates")
    .select("*")
    .eq("barbershop_id", barbershopId)
    .order("template_name");

  if (error) {
    console.error("Erro ao buscar todos os templates de mensagem:", error);
    toast.error("Erro ao carregar templates de mensagem.");
    return [];
  }
  return data || [];
};

export const updateMessageTemplate = async (
  templateId: string,
  updates: Partial<Omit<WhatsappMessageTemplate, "id" | "barbershop_id" | "created_at">>
): Promise<WhatsappMessageTemplate | null> => {
  const { data, error } = await db
    .from("whatsapp_message_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar template de mensagem:", error);
    toast.error("Erro ao atualizar template de mensagem.");
  }
  return data || null;
};

export const createMessageTemplate = async (
  barbershopId: string,
  template: Omit<WhatsappMessageTemplate, "id" | "created_at" | "updated_at">
): Promise<WhatsappMessageTemplate | null> => {
  const { data, error } = await db
    .from("whatsapp_message_templates")
    .insert({ ...template, barbershop_id: barbershopId })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar template de mensagem:", error);
    toast.error("Erro ao criar template de mensagem.");
  }
  return data || null;
};

export const deleteMessageTemplate = async (
  templateId: string
): Promise<boolean> => {
  const { error } = await db
    .from("whatsapp_message_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    console.error("Erro ao deletar template de mensagem:", error);
    toast.error("Erro ao deletar template de mensagem.");
    return false;
  }
  return true;
};

export const formatMessage = (templateContent: string, variables: Record<string, string>): string => {
  let formatted = templateContent;
  for (const key in variables) {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
  }
  return formatted;
};
