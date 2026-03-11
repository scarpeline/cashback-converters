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
    icon: CreditCard,
    label: "Cartão de Débito",
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
        <div className="text-center mb-14 px-2 sm:px-0">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base sm:text-sm font-semibold mb-5 sm:mb-5"
            style={{ background: "hsl(217 91% 50% / 0.12)", color: "hsl(217 85% 65%)", border: "1px solid hsl(217 91% 50% / 0.2)" }}
          >
            <Smartphone className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="text-base sm:text-sm">Receba direto no app</span>
          </span>

          <h2
            className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 sm:mb-4 leading-tight sm:leading-tight"
            style={{ color: "hsl(0 0% 98%)" }}
          >
            <span className="text-2xl sm:text-3xl lg:text-5xl">Receba pelo PIX, crédito e débito</span>
            <br className="sm:hidden" />
            <span className="text-2xl sm:text-3xl lg:text-5xl block sm:inline"> —{" "}</span>
            <span style={{ color: "hsl(42 100% 55%)" }} className="text-2xl sm:text-3xl lg:text-5xl">tudo dentro do app</span>
          </h2>

          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "hsl(220 9% 60%)" }}>
            <span className="text-base sm:text-base">Sem maquininha avulsa. Sem aplicativo de banco separado. Seu cliente paga pelo celular e o valor já cai dividido entre você, o profissional e o afiliado — na hora.</span>
          </p>

          <p
            className="mt-3 text-base sm:text-sm font-medium"
            style={{ color: "hsl(220 9% 50%)" }}
          >
            <span className="text-base sm:text-sm">Taxa do app: <span style={{ color: "hsl(42 100% 55%)" }}>0,5%</span> por transação</span>
          </p>
        </div>

        {/* Cards de taxas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-10 px-2 sm:px-0">
          {paymentMethods.map((method) => (
            <div
              key={method.label}
              className="relative p-4 sm:p-7 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(145deg, hsl(222 30% 12%), hsl(222 30% 9%))",
                border: `1px solid ${method.border}`,
              }}
            >
              {/* Ícone com glow */}
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-4 sm:mb-5"
                style={{ background: method.bg }}
              >
                <method.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: method.color }} />
              </div>

              <p className="text-base sm:text-sm font-medium mb-2" style={{ color: "hsl(220 9% 60%)" }}>
                <span className="text-base sm:text-sm">{method.label}</span>
              </p>

              <p
                className="font-display text-2xl sm:text-4xl font-bold mb-1"
                style={{ color: method.color }}
              >
                <span className="text-2xl sm:text-4xl">{method.rate}</span>
              </p>

              <p className="text-sm sm:text-xs" style={{ color: "hsl(220 9% 50%)" }}>
                <span className="text-sm sm:text-xs">{method.detail}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Rodapé de confiança */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 rounded-xl" style={{ background: "hsl(222 30% 11%)", border: "1px solid hsl(222 20% 18%)" }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Lock className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" style={{ color: "hsl(142 76% 46%)" }} />
            <p className="text-sm sm:text-sm" style={{ color: "hsl(220 9% 60%)" }}>
              <span className="text-sm sm:text-sm">Pagamentos processados de forma segura via{" "}</span>
              <span className="font-semibold text-sm sm:text-sm" style={{ color: "hsl(0 0% 90%)" }}>ASAAS</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm sm:text-sm font-semibold shrink-0 transition-opacity hover:opacity-80"
            style={{ color: "hsl(42 100% 55%)" }}
          >
            <span className="text-sm sm:text-sm">Começar agora</span> <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
