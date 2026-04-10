import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/upload-image";
import { toast } from "sonner";
import { Camera, Video, Trash2, Plus, Loader2, Image, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  url: string;
  media_type: "image" | "video";
  caption: string | null;
  sort_order: number;
}

interface Props {
  barbershopId: string;
  serviceId?: string;
  label?: string;
}

export function ServiceMediaPanel({ barbershopId, serviceId, label = "Fotos & Vídeos" }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const query = (supabase as any)
      .from("service_media")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("sort_order");
    if (serviceId) query.eq("service_id", serviceId);
    const { data } = await query;
    setMedia(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [barbershopId, serviceId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) { toast.error(`${file.name}: formato não suportado`); continue; }
      if (isVideo && file.size > 100 * 1024 * 1024) { toast.error("Vídeo máximo 100MB"); continue; }
      if (isImage && file.size > 10 * 1024 * 1024) { toast.error("Imagem máximo 10MB"); continue; }

      const folder = isVideo ? "media/videos" : "media/images";
      const url = await uploadImage(file, folder, barbershopId.slice(0, 8));
      if (!url) { toast.error(`Erro ao enviar ${file.name}`); continue; }

      const { error } = await (supabase as any).from("service_media").insert({
        barbershop_id: barbershopId,
        service_id: serviceId || null,
        url,
        media_type: isVideo ? "video" : "image",
        sort_order: media.length,
      });
      if (error) toast.error("Erro ao salvar mídia");
    }

    toast.success("Mídia enviada!");
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("service_media").delete().eq("id", id);
    setMedia(m => m.filter(x => x.id !== id));
    toast.success("Removido");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-orange-400 hover:bg-orange-500/10 font-bold gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </Button>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/*,video/*"
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group"
        >
          <div className="flex gap-3">
            <Image className="w-6 h-6 text-slate-600 group-hover:text-orange-400 transition-colors" />
            <Video className="w-6 h-6 text-slate-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Clique para adicionar fotos ou vídeos
          </p>
          <p className="text-[10px] text-slate-700">JPG, PNG, MP4 · Imagens até 10MB · Vídeos até 100MB</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {media.map(item => (
            <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
              {item.media_type === "image" ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <Play className="w-8 h-8 text-orange-400" />
                  <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-50" muted />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-red-500/80 rounded-xl hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              {item.media_type === "video" && (
                <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-0.5">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest">Vídeo</p>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group"
          >
            <Plus className="w-6 h-6 text-slate-600 group-hover:text-orange-400 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
