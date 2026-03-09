import { Smartphone, CreditCard, Wifi, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const paymentMethods = [
  {
    icon: Smartphone,
    label: "PIX",
    rate: "1,49%",
    detail: "total por transação",
    color: "hsl(142 76% 46%)",
    bg: "hsl(142 76% 36% / 0.12)",
    border: "hsl(142 76% 36% / 0.25)",
  },
  {
    icon: CreditCard,
    label: "Cartão de Crédito",
    rate: "3,49%",
    detail: "total por transação",
    color: "hsl(217 85% 60%)",
    bg: "hsl(217 91% 50% / 0.12)",
    border: "hsl(217 91% 50% / 0.25)",
  },
  {
    icon: Wifi,
    label: "NFC / Débito",
    rate: "2,49%",
    detail: "total por transação",
    color: "hsl(42 100% 55%)",
    bg: "hsl(42 100% 50% / 0.12)",
    border: "hsl(42 100% 50% / 0.25)",
  },
];

const PaymentMethodsSection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="py-20 px-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 8%) 100%)",
      }}
    >
      {/* Glow decorativo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, hsl(42 100% 50% / 0.4), transparent)" }}
      />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "hsl(217 91% 50% / 0.05)" }}
      />

      <div className="container relative z-10 mx-auto max-w-5xl">
        {/* Copy principal */}
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5"
            style={{ background: "hsl(217 91% 50% / 0.12)", color: "hsl(217 85% 65%)", border: "1px solid hsl(217 91% 50% / 0.2)" }}
          >
            <Smartphone className="w-4 h-4" />
            Receba direto no app
          </span>

          <h2
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
            style={{ color: "hsl(0 0% 98%)" }}
          >
            Receba pelo PIX, cartão ou NFC —{" "}
            <span style={{ color: "hsl(42 100% 55%)" }}>tudo dentro do app</span>
          </h2>

          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(220 9% 60%)" }}>
            Sem maquininha avulsa. Sem aplicativo de banco separado. Seu cliente paga pelo celular e o valor já cai dividido entre você, o profissional e o afiliado — na hora.
          </p>

          <p
            className="mt-3 text-sm font-medium"
            style={{ color: "hsl(220 9% 50%)" }}
          >
            Taxa do app: <span style={{ color: "hsl(42 100% 55%)" }}>0,5%</span> por transação
          </p>
        </div>

        {/* Cards de taxas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {paymentMethods.map((method) => (
            <div
              key={method.label}
              className="relative p-7 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))",
                border: `1px solid ${method.border}`,
              }}
            >
              {/* Ícone com glow */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{ background: method.bg }}
              >
                <method.icon className="w-6 h-6" style={{ color: method.color }} />
              </div>

              <p className="text-sm font-medium mb-2" style={{ color: "hsl(220 9% 60%)" }}>
                {method.label}
              </p>

              <p
                className="font-display text-4xl font-bold mb-1"
                style={{ color: method.color }}
              >
                {method.rate}
              </p>

              <p className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>
                {method.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Rodapé de confiança */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-xl" style={{ background: "hsl(222 30% 11%)", border: "1px solid hsl(222 20% 18%)" }}>
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 shrink-0" style={{ color: "hsl(142 76% 46%)" }} />
            <p className="text-sm" style={{ color: "hsl(220 9% 60%)" }}>
              Pagamentos processados de forma segura via{" "}
              <span className="font-semibold" style={{ color: "hsl(0 0% 90%)" }}>ASAAS</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
            style={{ color: "hsl(42 100% 55%)" }}
          >
            Começar agora <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
