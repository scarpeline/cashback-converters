import { Smartphone, CreditCard, Shield, ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const paymentMethods = [
  {
    icon: Smartphone,
    label: "PIX",
    rate: "1,49%",
    detail: "total por transação",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: CreditCard,
    label: "Cartão Crédito",
    rate: "3,49%",
    detail: "total por transação",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: CreditCard,
    label: "Cartão Débito",
    rate: "2,49%",
    detail: "total por transação",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

const PaymentMethodsSection = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-600 mb-6">
            Pagamentos
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Receba de todas as formas <span className="text-orange-500">automaticamente</span>
          </h2>
          <p className="text-slate-600">
            PIX, cartão, split de comissões e controle financeiro completo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {paymentMethods.map((method) => (
            <div key={method.label} className="group p-6 rounded-xl bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100">
              <div className={`w-12 h-12 rounded-xl ${method.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <method.icon className={`w-6 h-6 ${method.color}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {method.label}
              </h3>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {method.rate}
              </p>
              <p className="text-xs text-slate-500">
                {method.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-slate-600">
              Pagamentos processados de forma segura via <span className="font-semibold text-slate-900">ASAAS</span>
            </p>
          </div>
          <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
