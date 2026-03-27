import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { useNiche } from "@/hooks/useNiche";
import { motion } from "framer-motion";

const CTA = () => {
  const { nicheLabelPlural } = useNiche();

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.04),transparent_70%)]" />

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-8">
            <Rocket className="w-8 h-8 text-accent" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Pronto para{" "}
            <span className="text-gradient-orange">dominar</span> o mercado?
          </h2>

          <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
            Junte-se a 500+ {nicheLabelPlural} que já faturam mais usando nosso sistema.
            Comece hoje e tenha uma agenda cheia em 7 dias.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/login">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-xl transition-all hover:scale-105"
              >
                Começar 7 Dias Grátis
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/seja-um-franqueado">
              <Button
                variant="outline"
                size="lg"
                className="border-accent/30 text-accent hover:bg-accent/10"
              >
                Quero Ser Franqueado
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50">
            {[
              { value: "500+", label: `${nicheLabelPlural.charAt(0).toUpperCase() + nicheLabelPlural.slice(1)} Ativas` },
              { value: "R$2M+", label: "Faturados pelos Clientes" },
              { value: "24/7", label: "Suporte Prioritário" },
              { value: "7 dias", label: "Teste Grátis" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-bold text-accent">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-accent">
              ⚡ Resultados comprovados • Sem risco • Cancelamento a qualquer momento
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
