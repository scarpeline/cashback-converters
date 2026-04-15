import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Building2, Loader2, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useTranslation } from "react-i18next";

type Barbershop = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  sector: string | null;
  specialty: string | null;
  logo_url: string | null;
};

const SECTORS = [
  { id: "all", label: "Todos" },
  { id: "beleza_estetica", label: "Beleza & Estética" },
  { id: "saude_bem_estar", label: "Saúde & Bem-Estar" },
  { id: "educacao_mentorias", label: "Educação" },
  { id: "automotivo", label: "Automotivo" },
  { id: "pets", label: "Pets" },
  { id: "servicos_domiciliares", label: "Serviços Domiciliares" },
  { id: "juridico_financeiro", label: "Jurídico/Financeiro" },
  { id: "espacos_locacao", label: "Espaços & Locação" },
];

export default function BrowseCompaniesPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [companies, setCompanies] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, [selectedSector]);

  const fetchCompanies = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from("barbershops")
      .select("id, name, slug, address, sector, specialty, logo_url")
      .eq("is_active", true);

    if (selectedSector !== "all") {
      query = query.eq("sector", selectedSector);
    }

    const { data, error } = await query;
    if (!error) {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const filteredCompanies = companies.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      (c.specialty?.toLowerCase().includes(searchLower)) ||
      (c.address?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Explore Empresas e Serviços
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Encontre os melhores profissionais e estabelecimentos em sua região.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm mb-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  className="pl-10 h-12"
                  placeholder="Buscar por nome, especialidade ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {SECTORS.map((s) => (
                  <Button
                    key={s.id}
                    variant={selectedSector === s.id ? "gold" : "outline"}
                    className="whitespace-nowrap"
                    onClick={() => setSelectedSector(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando empresas...</p>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompanies.map((c) => (
                <Link key={c.id} to={`/v/${c.id}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border group-hover:border-primary/50">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {c.logo_url ? (
                        <img
                          src={c.logo_url}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                          <Building2 className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-background/80 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full border border-border uppercase">
                          {c.sector?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-sm text-primary font-medium mb-3">
                        {c.specialty?.replace("_", " ").toUpperCase() || "Serviços Gerais"}
                      </p>
                      {c.address && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0 text-primary" />
                          <span className="line-clamp-2">{c.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
              <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">Tente ajustar seus termos de busca ou filtros.</p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => { setSearchTerm(""); setSelectedSector("all"); }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
