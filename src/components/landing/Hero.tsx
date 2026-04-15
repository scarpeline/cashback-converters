import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Calendar, MessageCircle, DollarSign, Users, BarChart3, Star } from "lucide-react";

const FEATURES_FLOATING = [
  { icon: <Calendar className="w-4 h-4 text-orange-500" />, label: "Agendamento Online" },
  { icon: <MessageCircle className="w-4 h-4 text-green-500" />, label: "WhatsApp Automático" },
  { icon: <DollarSign className="w-4 h-4 text-blue-500" />, label: "Cobrança PIX" },
  { icon: <Users className="w-4 h-4 text-purple-500" />, label: "Gestão de Equipe" },
  { icon: <BarChart3 className="w-4 h-4 text-indigo-500" />, label: "Relatórios & Gráficos" },
  { icon: <Star className="w-4 h-4 text-yellow-500" />, label: "Ranking de Clientes" },
];

const SECTORS = [
  "Barbearia", "Salão", "Clínica", "Pet Shop", "Ótica",
  "Academia", "Estúdio", "Consultório", "Escola", "Oficina",
];

const BENEFITS = [
  "Reduza em até 50% a falta de clientes",
  "Envio automático de WhatsApp com confirmação",
  "Aumente em até 20% o faturamento com agendamentos online",
];

export default function Hero() {
  const [sectorIdx, setSectorIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSectorIdx(i => (i + 1) % SECTORS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

      <div className="container mx-auto px-4 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── LEFT ── */}
          <div className="flex-1 max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              +500 negócios já usam o sistema
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-2">
              Torne a gestão da sua
            </h1>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-orange-500 transition-all duration-500">
                {SECTORS[sectorIdx]}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-6">
              mais simples !!
            </h1>

            {/* Sub */}
            <p className="text-slate-500 text-base mb-6 leading-relaxed">
              Estamos no mercado com milhares de clientes em todo o Brasil que confiam e indicam o sistema.
            </p>

            {/* Benefits */}
            <ul className="space-y-2 mb-8">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/onboarding">
                <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-base rounded-xl shadow-lg shadow-orange-500/25">
                  EXPERIMENTE GRÁTIS
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#pricing-professionals">
                <Button variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-6 text-base rounded-xl">
                  Ver Planos e Preços
                </Button>
              </a>
            </div>

            {/* Trust */}
            <p className="text-xs text-slate-400 mt-4">
              ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ 14 dias grátis &nbsp;·&nbsp; ✓ Cancele quando quiser
            </p>
          </div>

          {/* ── RIGHT ── */}
          <div className="flex-1 w-full max-w-md relative">
            {/* Trial badge */}
            <div className="absolute -top-4 -right-4 z-20 w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-xl shadow-orange-500/30 border-4 border-white">
              <span className="text-xs font-bold uppercase leading-none">GRÁTIS</span>
              <span className="text-3xl font-black leading-none">14</span>
              <span className="text-xs font-bold uppercase leading-none">DIAS</span>
            </div>

            {/* Main card */}
            <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl p-6 relative">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Painel de Controle</p>
                  <p className="text-xs text-slate-400">Hoje · 6 agendamentos</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">● Online</span>
                </div>
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {FEATURES_FLOATING.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-default">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {f.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-xl font-black text-orange-500">98%</p>
                  <p className="text-[10px] text-slate-400 font-medium">Satisfação</p>
                </div>
                <div className="text-center border-x border-slate-100">
                  <p className="text-xl font-black text-slate-900">-50%</p>
                  <p className="text-[10px] text-slate-400 font-medium">Faltas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-green-600">+20%</p>
                  <p className="text-[10px] text-slate-400 font-medium">Faturamento</p>
                </div>
              </div>
            </div>

            {/* Sector tags below card */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {SECTORS.slice(0, 6).map((s, i) => (
                <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium border transition-all ${
                  SECTORS[sectorIdx] === s
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-500 border-slate-200"
                }`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
