import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, CheckCircle2 } from "lucide-react";

interface SocialProof {
  id: string;
  message: string;
  type: string;
  pages: string[];
  image_url?: string | null;
}

interface SocialProofPopupProps {
  currentPage: string;
  interval?: number;
}

/** Renders message with **bold** markdown support */
function RichMessage({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

export function SocialProofPopup({ currentPage, interval = 12000 }: SocialProofPopupProps) {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("social_proofs")
      .select("id, message, type, pages, image_url")
      .eq("is_active", true)
      .then(({ data }: any) => {
        if (!data) return;
        const filtered = data.filter((p: any) => {
          const pages = Array.isArray(p.pages) ? p.pages : [];
          return pages.includes(currentPage) || pages.includes("all");
        });
        setProofs(filtered as SocialProof[]);
      });
  }, [currentPage]);

  const showNext = useCallback(() => {
    if (proofs.length === 0 || dismissed) return;
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
    setCurrentIndex((prev) => (prev + 1) % proofs.length);
  }, [proofs, dismissed]);

  useEffect(() => {
    if (proofs.length === 0) return;
    const initial = setTimeout(showNext, 3000);
    const timer = setInterval(showNext, interval);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [proofs, interval, showNext]);

  if (!visible || proofs.length === 0 || dismissed) return null;

  const current = proofs[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-72 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-xl shadow-md p-3 flex items-start gap-3">
        {/* Avatar / imagem */}
        {current.image_url ? (
          <img
            src={current.image_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-100"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 leading-snug">
            <RichMessage text={current.message} />
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">agora mesmo</p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-300 hover:text-slate-500 flex-shrink-0 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
