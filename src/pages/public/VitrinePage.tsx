/**
 * VitrinePage – Vitrine pública da barbearia
 * Rota: /v/:barbershopId
 * Exibe produtos e ações entre amigos com botão "Agendar Agora"
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, Gift, Calendar, Star, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

type Barbershop = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
};

type Product = {
  id: string;
  name: string;
  sell_price: number;
  quantity: number;
};

type Raffle = {
  id: string;
  name: string;
  description: string | null;
  ticket_price: number;
  credit_award: number;
  status: string;
};

export default function VitrinePage() {
  const { barbershopId } = useParams<{ barbershopId: string }>();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!barbershopId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      const { data: shop } = await supabase
        .from("barbershops")
        .select("id, name, address, phone, description")
        .eq("id", barbershopId)
        .maybeSingle();

      if (!shop) { setNotFound(true); setLoading(false); return; }
      setBarbershop(shop as Barbershop);

      const [prodsRes, rafflesRes] = await Promise.all([
        supabase.from("stock_items").select("id, name, sell_price, quantity").eq("barbershop_id", barbershopId).eq("is_active", true).order("name"),
        supabase.from("raffles").select("id, name, description, ticket_price, credit_award, status").eq("barbershop_id", barbershopId).eq("status", "open").order("created_at", { ascending: false }),
      ]);

      setProducts((prodsRes.data || []) as Product[]);
      setRaffles((rafflesRes.data || []) as Raffle[]);
      setLoading(false);
    })();
  }, [barbershopId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !barbershop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={logo} alt="Logo" className="w-16 h-16" />
        <h1 className="text-2xl font-bold">Barbearia não encontrada</h1>
        <Link to="/"><Button variant="outline">Voltar ao início</Button></Link>
      </div>
    );
  }

  const bookingUrl = `/app`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">{barbershop.name}</h1>
              {barbershop.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{barbershop.address}
                </p>
              )}
            </div>
          </div>
          <a href={bookingUrl}>
            <Button variant="gold" className="shrink-0 gap-2">
              <Calendar className="w-4 h-4" />
              Agendar Agora
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Hero CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 text-center space-y-3">
          {barbershop.description && (
            <p className="text-muted-foreground">{barbershop.description}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={bookingUrl}>
              <Button variant="gold" size="lg" className="gap-2 w-full sm:w-auto">
                <Calendar className="w-5 h-5" />
                Agendar Agora
              </Button>
            </a>
            {barbershop.phone && (
              <a href={`https://wa.me/55${barbershop.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  <Phone className="w-5 h-5" />
                  Chamar no WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Produtos */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Produtos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(p => (
                <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm leading-tight">{p.name}</p>
                    <p className="text-primary font-bold mt-1">R$ {Number(p.sell_price).toFixed(2)}</p>
                    {p.quantity > 0 && (
                      <p className="text-xs text-muted-foreground">Em estoque: {p.quantity}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Ação entre Amigos */}
        {raffles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Ação entre Amigos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {raffles.map(r => (
                <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-muted overflow-hidden">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold">{r.name}</h3>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Bilhete</p>
                        <p className="font-bold text-primary">R$ {Number(r.ticket_price).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Prêmio</p>
                        <p className="font-bold flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />R$ {Number(r.credit_award).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA final */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-muted-foreground mb-4">Pronto para um novo visual?</p>
          <a href={bookingUrl}>
            <Button variant="gold" size="lg" className="gap-2">
              <Calendar className="w-5 h-5" />
              Agendar Agora
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            Powered by <a href="/" className="text-primary hover:underline">Salão Cashback</a>
          </p>
        </div>
      </main>
    </div>
  );
}
