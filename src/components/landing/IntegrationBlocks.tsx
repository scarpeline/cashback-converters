import {
  Rocket, Gift, Target, Zap, CreditCard, MessageSquare, BarChart3, Shield
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const integrations = [
  { icon: Rocket, title: "Crescimento no Piloto Automático", description: "Imagine acordar toda manhã com novos agendamentos feitos enquanto você dormia. Clientes indicando amigos sem você pedir.", accent: "Isso não é futuro. É o que nossos clientes vivem hoje." },
  { icon: Gift, title: "Cashback que Multiplica", description: "Cliente faz um corte de R$50 e ganha R$2,50 em cashback. Em 10 cortes ele tem R$25 acumulados. Ele PRECISA voltar.", accent: "Fidelização automática. Sem esforço." },
  { icon: Target, title: "Afiliados Internos = Marketing Grátis", description: "Cada cliente pode virar um 'vendedor'. Ele indica um amigo, o amigo agenda, e ele ganha comissão.", accent: "Boca a boca turbinado com recompensa real." },
  { icon: Zap, title: "Split Automático = Zero Dor de Cabeça", description: "Pagamento entrou? O sistema já divide: % pro profissional e % pro dono. Tudo cai no PIX automaticamente.", accent: "Sua contabilidade agradece." },
];

const apiBlocks = [
  { icon: CreditCard, title: "Pagamentos", description: "Gateway integrado para PIX, crédito e débito", placeholder: "API de Pagamentos (ASAAS)", status: "ready" },
  { icon: MessageSquare, title: "WhatsApp", description: "Automação de mensagens e confirmações", placeholder: "API WhatsApp Business", status: "ready" },
  { icon: BarChart3, title: "Analytics", description: "Pixels e tracking para Meta, Google e TikTok", placeholder: "Pixels & Conversões", status: "ready" },
  { icon: Shield, title: "Fiscal", description: "Emissão de notas fiscais e compliance", placeholder: "Integração Contábil", status: "coming" },
];

const IntegrationBlocks = () => {
  const { t } = useTranslation();
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-muted/30">
      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-14"
        >
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            "{t("marketing_highlight", "Enquanto outros sistemas só agendam, nós transformamos cada cliente em uma máquina de indicações")}"
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          {integrations.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-8 rounded-2xl bg-card border border-border/60 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                <item.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-card-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
              <p className="text-sm font-semibold text-accent">{item.accent}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-primary/10 text-primary border border-primary/20">
            Integrações
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            APIs e integrações{" "}
            <span className="text-primary">prontas</span>
          </h2>
          <p className="text-lg text-muted-foreground">Turbine seu negócio com tecnologia de ponta</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {apiBlocks.map((block, i) => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                block.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
              }`}>
                {block.status === 'ready' ? 'Ativo' : 'Em breve'}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <block.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2 text-card-foreground">{block.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{block.description}</p>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                <p className="text-xs text-muted-foreground font-medium">{block.placeholder}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationBlocks;
