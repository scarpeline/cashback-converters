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
    <section className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-200 text-sm font-medium text-yellow-700 mb-5">
            ⭐ Depoimentos
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Quem já usa{" "}
            <span className="text-orange-500">não volta atrás</span>
          </h2>
          <p className="text-slate-500 text-base">
            Resultados reais de profissionais que transformaram seus negócios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative flex-1">
                <Quote className="w-6 h-6 text-orange-200 absolute -top-1 -left-1" />
                <p className="text-slate-600 text-sm leading-relaxed pl-4">
                  "{t.text}"
                </p>
              </div>

              {/* Highlight badge */}
              <div className="mt-4 mb-4">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                  ✓ {t.highlight}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-lg">
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
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
          {[
            { value: "70%", label: "menos faltas" },
            { value: "3x", label: "mais retorno com cashback" },
            { value: "1 clique", label: "para receber via PIX" },
            { value: "24h", label: "agenda funcionando" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="text-2xl font-bold text-orange-500 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
