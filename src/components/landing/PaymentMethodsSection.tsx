import { Smartphone, CreditCard, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const paymentMethods = [
  { icon: Smartphone, label: "PIX", rate: "1,49%", detail: "total por transação" },
  { icon: CreditCard, label: "Cartão de Crédito", rate: "3,49%", detail: "total por transação" },
  { icon: CreditCard, label: "Cartão de Débito", rate: "2,49%", detail: "total por transação" },
];

const PaymentMethodsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 bg-primary/10 text-primary border border-primary/20">
            <Smartphone className="w-4 h-4" />
            Receba direto no app
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
            Receba pelo PIX, crédito e débito —{" "}
            <span className="text-gradient-orange">tudo dentro do app</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sem maquininha avulsa. Seu cliente paga pelo celular e o valor já cai dividido entre você, o profissional e o afiliado.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {paymentMethods.map((method, i) => (
            <motion.div
              key={method.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-7 rounded-2xl bg-card border border-border/60 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 text-center transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/20 transition-colors">
                <method.icon className="w-6 h-6 text-accent" />
              </div>
              <p className="text-base font-semibold text-card-foreground mb-2">{method.label}</p>
              <p className="font-display text-4xl font-bold text-accent mb-1">{method.rate}</p>
              <p className="text-sm text-muted-foreground">{method.detail}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-xl bg-muted/50 border border-border/60"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Pagamentos processados de forma segura via{" "}
              <span className="font-semibold text-foreground">ASAAS</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition-colors shrink-0"
          >
            Começar agora <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
