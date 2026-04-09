import { Smartphone, CreditCard, Wifi, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const paymentMethods = [
  {
    icon: Smartphone,
    label: "PIX",
    rate: "1,49%",
    detail: "total por transação",
    iconColor: "hsl(160 84% 55%)",
    bg: "linear-gradient(145deg, hsl(160 84% 39% / 0.15), hsl(160 84% 39% / 0.05))",
    border: "hsl(160 84% 39% / 0.25)",
  },
  {
    icon: CreditCard,
    label: "Cartão de Crédito",
    rate: "3,49%",
    detail: "total por transação",
    iconColor: "hsl(262 83% 68%)",
    bg: "linear-gradient(145deg, hsl(262 83% 58% / 0.15), hsl(262 83% 58% / 0.05))",
    border: "hsl(262 83% 58% / 0.25)",
  },
  {
    icon: CreditCard,
    label: "Cartão de Débito",
    rate: "2,49%",
    detail: "total por transação",
    iconColor: "hsl(192 91% 55%)",
    bg: "linear-gradient(145deg, hsl(192 91% 42% / 0.15), hsl(192 91% 42% / 0.05))",
    border: "hsl(192 91% 42% / 0.25)",
  },
];

const PaymentMethodsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(230 35% 6%) 0%, hsl(230 35% 8%) 100%)" }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(262 83% 58% / 0.3), transparent)" }} />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ background: "hsl(192 91% 42% / 0.05)" }} />

      <div className="container relative z-10 mx-auto max-w-5xl">
        <div className="text-center mb-14 px-2 sm:px-0">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-5" style={{ background: "hsl(192 91% 42% / 0.1)", color: "hsl(192 91% 60%)", border: "1px solid hsl(192 91% 42% / 0.2)" }}>
            <Smartphone className="w-4 h-4" />
            <span>Receba direto no app</span>
          </span>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black mb-5 leading-tight" style={{ color: "hsl(0 0% 98%)" }}>
            Receba pelo PIX, crédito e débito
            <br className="sm:hidden" />
            <span className="block sm:inline"> — </span>
            <span className="text-gradient-gold">tudo dentro do app</span>
          </h2>

          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "hsl(220 15% 60%)" }}>
            Sem maquininha avulsa. Sem aplicativo de banco separado. Seu cliente paga pelo celular e o valor já cai dividido entre você, o profissional e o afiliado — na hora.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10 px-2 sm:px-0">
          {paymentMethods.map((method) => (
            <div key={method.label} className="relative p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03]" style={{ background: method.bg, border: `1px solid ${method.border}` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                <method.icon className="w-6 h-6" style={{ color: method.iconColor }} />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: "hsl(0 0% 90%)" }}>{method.label}</p>
              <p className="font-display text-4xl sm:text-5xl font-black mb-1" style={{ color: "hsl(0 0% 98%)" }}>{method.rate}</p>
              <p className="text-sm" style={{ color: "hsl(220 15% 55%)" }}>{method.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl" style={{ background: "hsl(262 83% 58% / 0.08)", border: "1px solid hsl(262 83% 58% / 0.15)" }}>
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0" style={{ color: "hsl(262 83% 68%)" }} />
            <p className="text-sm sm:text-base" style={{ color: "hsl(220 15% 70%)" }}>
              Pagamentos processados de forma segura via <span className="font-semibold" style={{ color: "hsl(0 0% 90%)" }}>ASAAS</span>
            </p>
          </div>
          <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-sm font-bold shrink-0 transition-opacity hover:opacity-80" style={{ color: "hsl(192 91% 55%)" }}>
            Começar agora <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
