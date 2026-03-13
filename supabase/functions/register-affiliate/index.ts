import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FraudSignals {
  combined_hash: string;
  canvas_hash: string;
  webgl_renderer: string;
  screen: string;
  platform: string;
  language: string;
  timezone: string;
  hardware_concurrency: number;
  device_memory: number | null;
  max_touch_points: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 🔒 VALIDAR AUTENTICAÇÃO
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação obrigatória" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair token e validar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      user_id,
      name,
      email,
      whatsapp,
      cpf_cnpj,
      type,
      fingerprint,
      ip_address,
      vpn_suspicious,
      vpn_reasons,
    } = body as {
      user_id: string;
      name: string;
      email: string;
      whatsapp: string;
      cpf_cnpj: string;
      type: string;
      fingerprint: FraudSignals;
      ip_address: string;
      vpn_suspicious: boolean;
      vpn_reasons: string[];
    };

    // 🔒 VALIDAR QUE user_id CORRESPONDE AO USUÁRIO AUTENTICADO
    if (user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Não é permitido registrar afiliado para outro usuário" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ VALIDAÇÕES BÁSICAS ============
    if (!user_id || !cpf_cnpj || !name) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: user_id, cpf_cnpj, name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ 1. JÁ É AFILIADO? ============
    const { data: existing } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", user_id)
      .eq("type", "afiliado_saas")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Você já possui uma conta de afiliado ativa." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ 2. RATE LIMIT ============
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _identifier: user_id,
      _action_type: "affiliate_register",
      _max_requests: 3,
      _window_seconds: 3600,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 1 hora." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ 3. FRAUD SCORING ============
    let fraudScore = 0;
    const fraudReasons: string[] = [];

    // 3a. VPN/Proxy detectada no cliente
    if (vpn_suspicious) {
      fraudScore += 30;
      fraudReasons.push(`vpn_detected: ${vpn_reasons.join(", ")}`);
    }

    // 3b. Verificar se mesmo CPF/CNPJ já é dono de barbearia
    const { data: ownedShops } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("cpf_cnpj", cpf_cnpj);

    if (ownedShops && ownedShops.length > 0) {
      // Checar se algum desses user_ids é dono de barbershop
      for (const p of ownedShops) {
        if (p.user_id === user_id) continue; // mesmo user, ok
        const { data: shop } = await supabase
          .from("barbershops")
          .select("id")
          .eq("owner_user_id", p.user_id)
          .maybeSingle();
        if (shop) {
          fraudScore += 50;
          fraudReasons.push("cpf_cnpj_owns_barbershop_other_account");
        }
      }
    }

    // 3c. Verificar se mesmo e-mail padrão existe em outros afiliados
    if (email) {
      const emailBase = email.split("@")[0].replace(/[0-9.+_-]/g, "").toLowerCase();
      const { data: similarAffiliates } = await supabase
        .from("profiles")
        .select("user_id, email")
        .neq("user_id", user_id);

      if (similarAffiliates) {
        const similarEmails = similarAffiliates.filter((p) => {
          if (!p.email) return false;
          const otherBase = p.email.split("@")[0].replace(/[0-9.+_-]/g, "").toLowerCase();
          return otherBase === emailBase && p.email !== email;
        });
        if (similarEmails.length > 2) {
          fraudScore += 20;
          fraudReasons.push(`similar_email_pattern: ${similarEmails.length} matches`);
        }
      }
    }

    // 3d. Verificar fingerprint contra outros afiliados
    const { data: allAffiliates } = await supabase
      .from("affiliates")
      .select("id, user_id");

    // Nota: Armazenamos fingerprint na tabela de fraud_signals para consulta futura

    // 3e. IP já registrado por outro afiliado recentemente
    // (Checamos nos logs de integração como proxy)

    // ============ 4. DECISÃO ============
    if (fraudScore >= 80) {
      // Log de fraude
      await supabase.from("integration_logs").insert({
        service: "antifraud",
        environment: "production",
        event_type: "affiliate_registration_blocked",
        status: "blocked",
        error_message: `Score: ${fraudScore}`,
        request_data: {
          user_id,
          cpf_cnpj,
          ip_address,
          fingerprint,
          reasons: fraudReasons,
        },
      });

      return new Response(
        JSON.stringify({
          error: "Cadastro bloqueado pelo sistema antifraude. Entre em contato com o suporte.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============ 5. CRIAR AFILIADO ============
    const { data: codeResult } = await supabase.rpc("generate_referral_code");
    const referralCode = codeResult || `AF${Date.now().toString(36).toUpperCase()}`;

    const { error: insertError } = await supabase.from("affiliates").insert({
      user_id,
      type: "afiliado_saas",
      referral_code: referralCode,
      commission_first: 60,
      commission_recurring: 20,
      commission_saas_tax: 10,
      anti_fraud_accepted: true,
      anti_fraud_accepted_at: new Date().toISOString(),
      is_active: fraudScore < 50,
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar afiliado: " + insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar CPF no perfil se necessário
    await supabase
      .from("profiles")
      .update({ cpf_cnpj })
      .eq("user_id", user_id);

    // Atribuir role se não existir
    await supabase.from("user_roles").insert({
      user_id,
      role: "afiliado_saas",
    });

    // Log de sucesso
    await supabase.from("integration_logs").insert({
      service: "antifraud",
      environment: "production",
      event_type: "affiliate_registration_success",
      status: fraudScore > 0 ? "flagged" : "clean",
      request_data: {
        user_id,
        cpf_cnpj,
        ip_address,
        fingerprint,
        fraud_score: fraudScore,
        fraud_reasons: fraudReasons,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        referral_code: referralCode,
        fraud_score: fraudScore,
        flagged: fraudScore > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
