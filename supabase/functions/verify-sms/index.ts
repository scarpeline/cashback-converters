import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELESIGN_CUSTOMER_ID = Deno.env.get("TELESIGN_CUSTOMER_ID");
    const TELESIGN_API_KEY = Deno.env.get("TELESIGN_API_KEY");

    if (!TELESIGN_CUSTOMER_ID || !TELESIGN_API_KEY) {
      console.error("[VERIFY_SMS] Missing TeleSign credentials");
      return new Response(
        JSON.stringify({ error: "TeleSign not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, phone_number, verify_code } = await req.json();

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "Missing phone_number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize to E.164
    let phone = phone_number.replace(/\D/g, "");
    if (!phone.startsWith("55")) phone = "55" + phone;
    phone = "+" + phone;

    const authHeader = "Basic " + btoa(`${TELESIGN_CUSTOMER_ID}:${TELESIGN_API_KEY}`);

    if (action === "send") {
      // Send SMS verification via TeleSign Verify API
      const telesignUrl = "https://rest-api.telesign.com/v1/verify/sms";

      const formData = new URLSearchParams();
      formData.append("phone_number", phone);
      formData.append("ucid", "BACS"); // Business and Commerce Services
      formData.append("template", "Seu código de verificação SalãoCashBack é $$CODE$$");

      const response = await fetch(telesignUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (!response.ok || (result.status && result.status.code !== 290)) {
        console.error("[VERIFY_SMS] TeleSign send error:", JSON.stringify(result));
        return new Response(
          JSON.stringify({ 
            error: "Failed to send verification SMS", 
            details: result.status?.description || result 
          }),
          { status: response.ok ? 400 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const referenceId = result.reference_id;
      console.log("[VERIFY_SMS] SMS sent, reference_id:", referenceId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          reference_id: referenceId,
          message: "Código de verificação enviado por SMS" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      // Verify the code using TeleSign
      if (!verify_code) {
        return new Response(
          JSON.stringify({ error: "Missing verify_code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { reference_id } = await req.json().catch(() => ({}));

      // Use TeleSign Verify Status API
      const telesignUrl = `https://rest-api.telesign.com/v1/verify/${reference_id || "0"}?verify_code=${verify_code}`;

      const response = await fetch(telesignUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      const result = await response.json();

      const isVerified = result.verify?.code_state === "VALID";

      if (isVerified) {
        // Update profile to mark phone as verified
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // Get user from auth header if present
        const userAuthHeader = req.headers.get("Authorization");
        if (userAuthHeader) {
          const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
          const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: userAuthHeader } },
          });
          const { data: claims } = await userClient.auth.getClaims(
            userAuthHeader.replace("Bearer ", "")
          );
          if (claims?.claims?.sub) {
            // Normalize the phone for storage
            await supabaseAdmin
              .from("profiles")
              .update({ whatsapp: phone })
              .eq("user_id", claims.claims.sub);
          }
        }

        console.log("[VERIFY_SMS] Phone verified:", phone);
        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, verified: false, message: "Código inválido ou expirado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[VERIFY_SMS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
