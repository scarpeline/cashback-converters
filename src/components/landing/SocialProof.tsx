import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    text: "Antes eu perdia 30% dos clientes por falta de confirmação. Agora o sistema manda lembrete automático e minha agenda está sempre cheia.",
    name: "Marcos Silva",
    role: "Barbeiro",
    city: "São Paulo",
    emoji: "✂️",
    highlight: "agenda sempre cheia",
  },
  {
    text: "Meus clientes adoram o cashback. Eles voltam mais rápido e ainda indicam amigos. Meu faturamento subiu 40% em 3 meses.",
    name: "Ana Paula",
    role: "Personal Trainer",
    city: "Rio de Janeiro",
    emoji: "🏋️",
    highlight: "faturamento subiu 40%",
  },
  {
    text: "Recebia pelo PIX manual e perdia o controle. Agora tudo cai automático, com relatório de cada profissional. Economizo 2h por dia.",
    name: "Roberto Mendes",
    role: "Dono de Salão",
    city: "Belo Horizonte",
    emoji: "💇",
    highlight: "Economizo 2h por dia",
  },
];

const SocialProof = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-700 mb-6">
            ⭐ Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Quem já usa{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">não volta atrás</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Resultados reais de profissionais que transformaram seus negócios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col group"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="relative flex-1">
                <Quote className="w-6 h-6 text-indigo-200 absolute -top-1 -left-1" />
                <p className="text-slate-600 text-sm leading-relaxed pl-4">
                  "{t.text}"
                </p>
              </div>

              <div className="mt-5 mb-5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                  ✓ {t.highlight}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center text-lg">
                  {t.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role} · {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            { value: "70%", label: "menos faltas" },
            { value: "3x", label: "mais retorno com cashback" },
            { value: "1 clique", label: "para receber via PIX" },
            { value: "24h", label: "agenda funcionando" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
