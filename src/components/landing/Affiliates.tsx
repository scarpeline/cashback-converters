import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Percent, Users } from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "60% na Primeira",
    description: "Ganhe 60% da primeira mensalidade de cada barbearia que você indicar."
  },
  {
    icon: DollarSign,
    title: "20% Recorrente",
    description: "Continue ganhando 20% de todas as mensalidades futuras. Para sempre."
  },
  {
    icon: Users,
    title: "10% de Sub-afiliados",
    description: "Indique outros afiliados e ganhe 10% da receita gerada por eles também."
  }
];

const Affiliates = () => {
  return (
    <section id="affiliates" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container relative z-10 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Programa de Afiliados
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ganhe dinheiro{" "}
              <span className="text-gradient-gold">indicando barbearias</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Você conhece donos de barbearias? Indique o SalãoCashBack e ganhe comissões recorrentes.
              Sem limite de ganhos. Saque a partir de 3 barbearias ativas.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/afiliado-saas/login">
              <Button variant="gold" size="lg">
                Quero Ser Afiliado
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent blur-2xl" />

            <div className="relative p-8 rounded-3xl bg-gradient-card border border-border/50">
              <div className="text-center mb-8">
                <span className="text-sm text-muted-foreground">Exemplo de Ganhos</span>
                <h3 className="font-display text-2xl font-bold mt-1">
                  10 Barbearias Indicadas
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Primeira mensalidade (60%)</span>
                    <span className="font-display font-bold text-gold">R$ 179,40</span>
                  </div>
                  <div className="text-xs text-muted-foreground">10 × R$ 29,90 × 60%</div>
                </div>

                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Recorrente mensal (20%)</span>
                    <span className="font-display font-bold text-gold">R$ 59,80</span>
                  </div>
                  <div className="text-xs text-muted-foreground">10 × R$ 29,90 × 20%</div>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total no 1º mês</span>
                    <span className="font-display text-2xl font-bold text-gradient-gold">R$ 239,20</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-success">Ganho anual estimado</span>
                    <span className="font-display text-2xl font-bold text-success">R$ 896,80</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">R$ 179,40 + (R$ 59,80 × 12)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Affiliates;
