/**
 * Image upload utility - Supabase Storage
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "uploads";

export async function uploadImage(
  file: File,
  folder: string,
  prefix?: string
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const name = `${folder}/${prefix || ""}${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(name, file, { upsert: true });
  if (error) return null;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
