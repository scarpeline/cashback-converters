import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Percent, Users } from "lucide-react";

const benefits = [
  { icon: Percent, title: "60% na Primeira", description: "Ganhe 60% da primeira mensalidade de cada barbearia que você indicar." },
  { icon: DollarSign, title: "20% Recorrente", description: "Continue ganhando 20% de todas as mensalidades futuras. Para sempre." },
  { icon: Users, title: "10% de Sub-afiliados", description: "Indique outros afiliados e ganhe 10% da receita gerada por eles também." },
];

const Affiliates = () => {
  return (
    <section id="affiliates" className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 10%) 100%)" }}>
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, hsl(217 91% 50% / 0.3), transparent)" }} />

      <div className="container relative z-10 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{ background: "hsl(217 91% 50% / 0.1)", color: "hsl(217 85% 60%)" }}>
              Programa de Afiliados
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
              Ganhe dinheiro{" "}<span className="text-gradient-gold">indicando barbearias</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: "hsl(220 9% 60%)" }}>
              Você conhece donos de barbearias? Indique o SalãoCashBack e ganhe comissões recorrentes. Sem limite de ganhos.
            </p>

            <div className="space-y-6 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(42 100% 50% / 0.1)" }}>
                    <benefit.icon className="w-6 h-6" style={{ color: "hsl(42 100% 55%)" }} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold mb-1" style={{ color: "hsl(0 0% 95%)" }}>{benefit.title}</h4>
                    <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/afiliado-saas/login">
              <Button variant="gold" size="lg">Quero Ser Afiliado<ArrowRight className="w-5 h-5" /></Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-2xl" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.08), transparent)" }} />
            <div className="relative p-8 rounded-3xl" style={{ background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))", border: "1px solid hsl(222 20% 18%)" }}>
              <div className="text-center mb-8">
                <span className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>Exemplo de Ganhos</span>
                <h3 className="font-display text-2xl font-bold mt-1" style={{ color: "hsl(0 0% 95%)" }}>10 Barbearias Indicadas</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: "hsl(220 9% 55%)" }}>Primeira mensalidade (60%)</span>
                    <span className="font-display font-bold text-gradient-gold">R$ 179,40</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: "hsl(220 9% 55%)" }}>Recorrente mensal (20%)</span>
                    <span className="font-display font-bold text-gradient-gold">R$ 59,80</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "hsl(42 100% 50% / 0.08)", border: "1px solid hsl(42 100% 50% / 0.2)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: "hsl(0 0% 95%)" }}>Total no 1º mês</span>
                    <span className="font-display text-2xl font-bold text-gradient-gold">R$ 239,20</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "hsl(142 76% 36% / 0.1)", border: "1px solid hsl(142 76% 36% / 0.25)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: "hsl(142 76% 46%)" }}>Ganho anual estimado</span>
                    <span className="font-display text-2xl font-bold" style={{ color: "hsl(142 76% 46%)" }}>R$ 896,80</span>
                  </div>
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
