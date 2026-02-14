/**
 * SMS Adapter - Abstração do Twilio
 * Envio de SMS e OTP via edge function
 */

import { supabase } from "@/integrations/supabase/client";
import type { SmsAdapter, SmsRequest, OtpRequest } from "./types";

class TwilioSmsAdapter implements SmsAdapter {
  async sendSms(request: SmsRequest): Promise<boolean> {
    const { error } = await supabase.functions.invoke("send-sms", {
      body: { action: "sms", to: request.to, body: request.body },
    });
    return !error;
  }

  async sendOtp(request: OtpRequest): Promise<boolean> {
    const { error } = await supabase.functions.invoke("send-sms", {
      body: {
        action: "otp",
        to: request.to,
        code: request.code,
        template: request.template,
        expiration_minutes: request.expiration_minutes ?? 5,
      },
    });
    return !error;
  }
}

export const smsAdapter: SmsAdapter = new TwilioSmsAdapter();
