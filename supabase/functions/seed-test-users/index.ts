import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🔒 VERIFICAÇÃO DE AUTENTICAÇÃO - Apenas Super Admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Autenticação obrigatória" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 🔒 VALIDAR SE O USUÁRIO É SUPER ADMIN
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verificar se é super admin
  const { data: userRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!userRole) {
    return new Response(JSON.stringify({ error: "Apenas super admins podem criar usuários de teste" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 🔒 VERIFICAR SE ESTÁ EM AMBIENTE DE DESENVOLVIMENTO
  const environment = Deno.env.get("SUPABASE_ENVIRONMENT") || "development";
  if (environment === "production") {
    return new Response(JSON.stringify({ error: "Criação de usuários de teste não permitida em produção" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 🔒 GERAR SENHAS ALEATÓRIAS SEGURAS em vez de usar senhas fixas
  const generateSecurePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const testUsers = [
    {
      email: "cliente.teste@salao.app",
      password: generateSecurePassword(),
      name: "Cliente Teste",
      whatsapp: "11999990001",
      role: "cliente",
    },
    {
      email: "dono.teste@salao.app",
      password: generateSecurePassword(),
      name: "Dono Teste",
      whatsapp: "11999990002",
      role: "dono",
    },
    {
      email: "profissional.teste@salao.app",
      password: generateSecurePassword(),
      name: "Profissional Teste",
      whatsapp: "11999990004",
      role: "profissional",
    },
    {
      email: "afiliado.teste@salao.app",
      password: generateSecurePassword(),
      name: "Afiliado SaaS Teste",
      whatsapp: "11999990005",
      role: "afiliado_saas",
    },
    {
      email: "contador.teste@salao.app",
      password: generateSecurePassword(),
      name: "Contador Teste",
      whatsapp: "11999990006",
      role: "contador",
    },
  ];

  const results: Record<string, unknown>[] = [];

  for (const u of testUsers) {
    try {
      // Check if user already exists by email
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (eu) => eu.email === u.email
      );

      let userId: string;

      if (existing) {
        userId = existing.id;
        // 🔒 Gerar nova senha segura
        const newPassword = generateSecurePassword();
        await admin.auth.admin.updateUserById(userId, {
          password: newPassword,
          email_confirm: true,
        });
        results.push({ 
          email: u.email, 
          status: "updated", 
          userId,
          password: newPassword // 🔒 Mostrar senha apenas para o admin autenticado
        });
      } else {
        // Create user
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name, whatsapp: u.whatsapp },
        });

        if (error) {
          results.push({ email: u.email, status: "error", error: error.message });
          continue;
        }
        userId = data.user.id;
        results.push({ 
          email: u.email, 
          status: "created", 
          userId,
          password: u.password // 🔒 Mostrar senha apenas para o admin autenticado
        });
      }

      // Ensure profile exists
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile) {
        await admin.from("profiles").insert({
          user_id: userId,
          name: u.name,
          email: u.email,
          whatsapp: u.whatsapp,
        });
      }

      // Ensure role exists
      const { data: existingRole } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", u.role)
        .maybeSingle();

      if (!existingRole) {
        await admin.from("user_roles").insert({
          user_id: userId,
          role: u.role,
        });
      }

      // Para dono, ensure a barbershop exists
      if (u.role === "dono") {
        const { data: existingShop } = await admin
          .from("barbershops")
          .select("id")
          .eq("owner_user_id", userId)
          .maybeSingle();

        if (!existingShop) {
          const { data: newShop } = await admin.from("barbershops").insert({
            owner_user_id: userId,
            name: "Barbearia Teste",
            phone: u.whatsapp,
          }).select("id").single();

          // Create a test service for the barbershop
          if (newShop) {
            await admin.from("services").insert({
              barbershop_id: newShop.id,
              name: "Corte Masculino",
              price: 45.00,
              duration_minutes: 30,
              description: "Corte masculino completo",
            });
            await admin.from("services").insert({
              barbershop_id: newShop.id,
              name: "Barba",
              price: 25.00,
              duration_minutes: 20,
              description: "Barba com navalha",
            });
          }
        }
      }

      // Para profissional, link to the test barbershop
      if (u.role === "profissional") {
        const { data: testShop } = await admin
          .from("barbershops")
          .select("id")
          .eq("name", "Barbearia Teste")
          .maybeSingle();

        if (testShop) {
          const { data: existingPro } = await admin
            .from("professionals")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingPro) {
            await admin.from("professionals").insert({
              user_id: userId,
              barbershop_id: testShop.id,
              name: u.name,
              email: u.email,
              whatsapp: u.whatsapp,
            });
          }
        }
      }

      // Para afiliado_saas, create affiliate record
      if (u.role === "afiliado_saas") {
        const { data: existingAff } = await admin
          .from("affiliates")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingAff) {
          await admin.from("affiliates").insert({
            user_id: userId,
            type: "afiliado_saas",
            referral_code: "TESTE" + Math.random().toString(36).substring(2, 6).toUpperCase(),
          });
        }
      }

      // Para contador, create accountant record
      if (u.role === "contador") {
        const { data: existingAcc } = await admin
          .from("accountants")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingAcc) {
          await admin.from("accountants").insert({
            user_id: userId,
            name: u.name,
            email: u.email,
            whatsapp: u.whatsapp,
          });
        }
      }

      // 🔅 LOG DE AUDITORIA
      await admin.from("security_audit_logs").insert({
        action: "create_test_user",
        target_user_id: userId,
        performed_by: user.id,
        metadata: {
          email: u.email,
          role: u.role,
          environment,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        }
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ email: u.email, status: "exception", error: msg });
      
      // 🔅 LOG DE ERRO DE SEGURANÇA
      await admin.from("security_audit_logs").insert({
        action: "test_user_creation_error",
        performed_by: user.id,
        metadata: {
          email: u.email,
          error: msg,
          environment,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    results,
    warning: "Senhas geradas aleatoriamente. Guarde-as em local seguro."
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
