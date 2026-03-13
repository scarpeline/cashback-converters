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

function safeFileExt(filename: string | null): string {
  if (!filename) return "bin";
  const parts = filename.split(".");
  const raw = parts.length > 1 ? parts[parts.length - 1] : "bin";
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "bin";
}

function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .slice(0, 80);
}

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
  const action = body?.action as (Action | "init_upload") | undefined;
  const documentId = typeof body?.document_id === "string" ? body.document_id : null;
  const expiresIn = Number.isFinite(Number(body?.expires_in)) ? Number(body.expires_in) : 60 * 10;

  if (!action || (action !== "download" && action !== "upload" && action !== "init_upload")) {
    return json({ error: "Invalid action" }, 400);
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

  if (action === "init_upload") {
    const title = typeof body?.title === "string" ? body.title.trim() : null;
    const docType = typeof body?.doc_type === "string" ? body.doc_type.trim() : "other";
    const isCompanyDocument = !!body?.is_company_document;
    const barbershopId = typeof body?.barbershop_id === "string" ? body.barbershop_id : null;
    const fiscalServiceRequestId =
      typeof body?.fiscal_service_request_id === "string" ? body.fiscal_service_request_id : null;
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type : null;
    const fileSizeBytes = Number.isFinite(Number(body?.file_size_bytes)) ? Number(body.file_size_bytes) : null;
    const filename = typeof body?.filename === "string" ? body.filename : null;

    if (!title) {
      return json({ error: "Missing title" }, 400);
    }

    if (isCompanyDocument && !barbershopId) {
      return json({ error: "Missing barbershop_id for company document" }, 400);
    }

    if (!isCompanyDocument && barbershopId) {
      return json({ error: "barbershop_id not allowed for personal document" }, 400);
    }

    const ext = safeFileExt(filename);
    const slug = safeSlug(title) || "document";
    const rand = crypto.randomUUID();
    const prefix = isCompanyDocument ? `barbershop/${barbershopId}` : `user/${jwtUserId}`;
    const storagePath = `${prefix}/${Date.now()}_${slug}_${rand}.${ext}`;

    const { data: inserted, error: insertErr } = await supabase
      .from("accounting_documents")
      .insert({
        barbershop_id: isCompanyDocument ? barbershopId : null,
        owner_user_id: jwtUserId,
        title,
        doc_type: docType,
        storage_bucket: "accounting-docs",
        storage_path: storagePath,
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        is_company_document: isCompanyDocument,
        uploaded_by_user_id: jwtUserId,
        fiscal_service_request_id: fiscalServiceRequestId,
      })
      .select("id, storage_bucket, storage_path")
      .maybeSingle();

    if (insertErr) {
      return json({ error: insertErr.message }, 400);
    }

    if (!inserted) {
      return json({ error: "Failed to create document" }, 500);
    }

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(inserted.storage_bucket)
      .createSignedUploadUrl(inserted.storage_path);

    if (uploadErr) {
      return json({ error: uploadErr.message }, 400);
    }

    return json({
      document_id: inserted.id,
      bucket: inserted.storage_bucket,
      path: inserted.storage_path,
      signed_url: uploadData.signedUrl,
      token: uploadData.token,
    });
  }

  if (!documentId) {
    return json({ error: "Missing document_id" }, 400);
  }

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
      .createSignedUploadUrl(path);

  if (error) return json({ error: error.message }, 400);

  return json({ signed_url: data.signedUrl, token: data.token });
});
