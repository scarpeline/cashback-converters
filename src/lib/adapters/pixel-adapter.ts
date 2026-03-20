/**
 * Pixel Adapter - Client-side + Server-side tracking
 * Super Admin define quais eventos disparam pixel
 */

import { supabase } from "@/integrations/supabase/client";
import type { PixelAdapter, PixelTrackRequest, PixelEvent } from "./types";

interface ActivePixel {
  pixel_type: string;
  pixel_id: string;
  events_json: unknown[];
}

class PixelAdapterImpl implements PixelAdapter {
  private pixels: ActivePixel[] = [];
  private loaded = false;

  private async loadPixels() {
    if (this.loaded) return;
    try {
      // Load platform-level pixels (public-facing, loaded without auth)
      const { data } = await (supabase as any)
        .from("pixel_configurations")
        .select("platform, pixel_id, events, is_active")
        .eq("is_active", true)
        .eq("is_global", true);

      if (data) {
        this.pixels = data.map((p) => ({
          pixel_type: p.platform,
          pixel_id: p.pixel_id,
          events_json: (p.events as unknown[]) || [],
        }));
      }
    } catch {
      // Silent fail - pixels are non-critical
    }
    this.loaded = true;
  }

  track(request: PixelTrackRequest): void {
    this.loadPixels().then(() => {
      for (const pixel of this.pixels) {
        const events = pixel.events_json as string[];
        if (events.length > 0 && !events.includes(request.event)) continue;

        switch (pixel.pixel_type) {
          case "meta":
            this.trackMeta(pixel.pixel_id, request);
            break;
          case "google":
          case "ga4":
            this.trackGA4(pixel.pixel_id, request);
            break;
          case "tiktok":
            this.trackTikTok(pixel.pixel_id, request);
            break;
        }
      }
    });
  }

  async trackServerSide(request: PixelTrackRequest): Promise<void> {
    try {
      await supabase.functions.invoke("pixel-track", {
        body: { event: request.event, data: request.data, user_id: request.user_id },
      });
    } catch {
      // Silent fail
    }
  }

  private trackMeta(pixelId: string, request: PixelTrackRequest) {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", request.event, request.data);
    }
  }

  private trackGA4(pixelId: string, request: PixelTrackRequest) {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", request.event, request.data);
    }
  }

  private trackTikTok(pixelId: string, request: PixelTrackRequest) {
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.track(request.event, request.data);
    }
  }
}

export const pixelAdapter = new PixelAdapterImpl();
