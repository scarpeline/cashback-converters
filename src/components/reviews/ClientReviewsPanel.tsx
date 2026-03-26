import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Star, MessageCircle } from "lucide-react";

interface ClientReviewsPanelProps {
  barbershopId: string;
  canCreate?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_public: boolean;
}

export function ClientReviewsPanel({ barbershopId, canCreate = false }: ClientReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [barbershopId]);

  const loadReviews = async () => {
    try {
      const { data } = await (supabase as any)
        .from("client_reviews")
        .select("id, rating, comment, created_at, is_public")
        .eq("barbershop_id", barbershopId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      setReviews(data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para avaliar");

      const { error } = await (supabase as any)
        .from("client_reviews")
        .insert({
          barbershop_id: barbershopId,
          client_user_id: user.id,
          rating: newRating,
          comment: newComment || null,
        });

      if (error) throw error;
      toast({ title: "Avaliação enviada!", description: "Obrigado pelo seu feedback." });
      setNewComment("");
      setNewRating(5);
      loadReviews();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Avaliações</span>
            <Badge variant="secondary">⭐ {avgRating} ({reviews.length})</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canCreate && (
            <div className="mb-6 p-4 border rounded-lg space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewRating(star)} className="p-1">
                    <Star className={`w-6 h-6 ${star <= newRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Conte sua experiência..." rows={2} />
              <Button onClick={submitReview} disabled={submitting} size="sm">
                {submitting ? "Enviando..." : "Enviar Avaliação"}
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground text-center py-4">Carregando...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma avaliação ainda</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
