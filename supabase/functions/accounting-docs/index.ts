import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return atob(padded);
}

function getAuthUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

type Action = "download" | "upload";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY =
    Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: "Server configuration error" }, 500);
  }

  const authHeader = req.headers.get("authorization");
  const jwtUserId = getAuthUserIdFromJwt(authHeader);
  if (!jwtUserId || !authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as Action | undefined;
  const documentId = typeof body?.document_id === "string" ? body.document_id : null;
  const expiresIn = Number.isFinite(Number(body?.expires_in)) ? Number(body.expires_in) : 60 * 10;

  if (!action || (action !== "download" && action !== "upload")) {
    return json({ error: "Invalid action" }, 400);
  }

  if (!documentId) {
    return json({ error: "Missing document_id" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: undefined,
    },
  });

  const { data: doc, error: docErr } = await supabase
    .from("accounting_documents")
    .select("id, storage_bucket, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr) {
    return json({ error: docErr.message }, 400);
  }

  if (!doc) {
    return json({ error: "Document not found" }, 404);
  }

  const bucket = doc.storage_bucket;
  const path = doc.storage_path;

  if (action === "download") {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) return json({ error: error.message }, 400);
    return json({ signed_url: data.signedUrl, expires_in: expiresIn });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    // @ts-expect-error Supabase types in Deno may lag behind runtime
    .createSignedUploadUrl(path);

  if (error) return json({ error: error.message }, 400);

  return json({ signed_url: data.signedUrl, token: data.token });
});
