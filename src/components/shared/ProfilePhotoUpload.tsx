import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload-image";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  userId: string;
  avatarUrl: string | null;
  onUpdate: (url: string | null) => void;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "w-12 h-12", md: "w-16 h-16", lg: "w-24 h-24" };

export function ProfilePhotoUpload({ userId, avatarUrl, onUpdate, size = "md" }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, "avatars", userId.slice(0, 8));
    setUploading(false);
    if (url) {
      const { error } = await (supabase as any).from("profiles").update({ avatar_url: url }).eq("user_id", userId);
      if (error) { toast.error("Erro ao salvar foto."); return; }
      onUpdate(url);
      toast.success("Foto atualizada!");
    } else {
      toast.error("Erro ao enviar imagem.");
    }
  };

  return (
    <div className="relative group">
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User className={`${size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-12 h-12"} text-primary`} />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-70"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
    </div>
  );
}
