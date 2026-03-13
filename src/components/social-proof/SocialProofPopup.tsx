import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, CheckCircle2 } from "lucide-react";

interface SocialProof {
  id: string;
  message: string;
  type: string;
  pages: string[];
}

interface SocialProofPopupProps {
  /** Current page identifier: "landing", "login", "painel-dono", etc. */
  currentPage: string;
  /** Interval between popups in ms (default 12s) */
  interval?: number;
}

/**
 * Social proof popup - shows recent activity notifications.
 * Fetches from social_proofs table, filtered by page.
 */
export function SocialProofPopup({ currentPage, interval = 12000 }: SocialProofPopupProps) {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from("social_proofs")
      .select("id, message, type, pages")
      .eq("is_active", true)
      .then(({ data }) => {
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
    // Show first after 3s
    const initial = setTimeout(showNext, 3000);
    const timer = setInterval(showNext, interval);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [proofs, interval, showNext]);

  if (!visible || proofs.length === 0 || dismissed) return null;

  const current = proofs[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{current.message}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">agora mesmo</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
