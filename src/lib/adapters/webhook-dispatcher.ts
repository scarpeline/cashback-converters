/**
 * Webhook Dispatcher - Client-side trigger
 * Chama a edge function que despacha webhooks
 */

import { supabase } from "@/integrations/supabase/client";
import type { StandardEvent, WebhookDispatcher, WebhookDispatchRequest } from "./types";

class WebhookDispatcherImpl implements WebhookDispatcher {
  async dispatch(request: WebhookDispatchRequest): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke("webhook-dispatcher", {
        body: {
          event: request.event,
          payload: request.payload,
        },
      });

      if (error) {
        console.error("[WEBHOOK_DISPATCHER] Failed:", error);
      } else {
        console.log(`[WEBHOOK_DISPATCHER] Event ${request.event} dispatched`, data);
      }
    } catch (err) {
      console.error("[WEBHOOK_DISPATCHER] Error:", err);
    }
  }
}

export const webhookDispatcher = new WebhookDispatcherImpl();
