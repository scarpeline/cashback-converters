import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Bot, Calendar, CheckCircle } from "lucide-react";

const niches = [
  "Barbearias", "Salões", "Clínicas", "Pet Shops",
  "Academias", "Estúdios", "Consultórios", "Escolas",
];

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-white overflow-hidden px-4 py-16">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-orange-50/30" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/20 to-transparent" />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">
                Plataforma com IA Integrada
              </span>
            </div>

            {/* Headline - reduced sizes */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 text-slate-900">
              Sistema de Agenda
              <span className="text-orange-500"> Inteligente</span> para seu Negócio
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 mb-6 leading-relaxed">
              Agendamento online, WhatsApp automático, pagamentos integrados e fidelização de clientes. 
              <span className="text-blue-600 font-medium"> Tudo em um só lugar.</span>
            </p>

            {/* Niche tags - simplified */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              {niches.map((niche) => (
                <span key={niche} className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  {niche}
                </span>
              ))}
            </div>

            {/* CTAs - clean style */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-8">
              <Link to="/onboarding">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25">
                  Começar Grátis 7 Dias
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 h-auto text-base font-medium rounded-xl">
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            {/* Trust badges - icons only, no boxes */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Setup em 5 minutos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancele quando quiser
              </span>
            </div>
          </div>

          {/* Right content - Stats simplified */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, value: "500+", label: "Negócios ativos", color: "text-blue-500" },
                  { icon: TrendingUp, value: "60%", label: "Menos faltas", color: "text-green-500" },
                  { icon: Zap, value: "24h", label: "Agenda online", color: "text-orange-500" },
                  { icon: Sparkles, value: "7 dias", label: "Teste grátis", color: "text-purple-500" },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} className="text-center p-3">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature mini list */}
            <div className="mt-4 space-y-2">
              {[
                { icon: Bot, text: "IA no WhatsApp (texto e áudio)" },
                { icon: Calendar, text: "Agenda 24 horas automática" },
                { icon: Zap, text: "Pagamentos com split de comissão" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-500" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
