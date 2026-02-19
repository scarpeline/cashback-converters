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

  const testUsers = [
    {
      email: "cliente.teste@salao.app",
      password: "Teste@123",
      name: "Cliente Teste",
      whatsapp: "11999990001",
      role: "cliente",
    },
    {
      email: "dono.teste@salao.app",
      password: "Teste@123",
      name: "Dono Teste",
      whatsapp: "11999990002",
      role: "dono",
    },
    {
      email: "escarpelineparticular@gmail.com",
      password: "Admin@2026",
      name: "Super Admin",
      whatsapp: "11999990003",
      role: "super_admin",
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
        // Update password and confirm email
        await admin.auth.admin.updateUserById(userId, {
          password: u.password,
          email_confirm: true,
        });
        results.push({ email: u.email, status: "updated", userId });
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
        results.push({ email: u.email, status: "created", userId });
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

      // For dono, ensure a barbershop exists
      if (u.role === "dono") {
        const { data: existingShop } = await admin
          .from("barbershops")
          .select("id")
          .eq("owner_user_id", userId)
          .maybeSingle();

        if (!existingShop) {
          await admin.from("barbershops").insert({
            owner_user_id: userId,
            name: "Barbearia Teste",
            phone: u.whatsapp,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ email: u.email, status: "exception", error: msg });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
