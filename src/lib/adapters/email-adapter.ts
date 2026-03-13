/**
 * Email Adapter - Abstração do Resend via Edge Function
 * Suporta envio síncrono e assíncrono (via fila)
 */

import { supabase } from "@/integrations/supabase/client";

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailAdapter {
  send(request: EmailRequest): Promise<boolean>;
  sendAsync(request: EmailRequest): Promise<boolean>;
}

class ResendEmailAdapter implements EmailAdapter {
  async send(request: EmailRequest): Promise<boolean> {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { ...request, mode: "sync" },
    });
    return !error;
  }

  async sendAsync(request: EmailRequest): Promise<boolean> {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { ...request, mode: "queue" },
    });
    return !error;
  }
}

export const emailAdapter: EmailAdapter = new ResendEmailAdapter();
