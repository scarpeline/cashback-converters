import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const portfolioItems = [
  {
    gradient: "from-orange-400 to-pink-500",
    emoji: "✂️",
    name: "Carlos Barbeiro",
    specialty: "Barbearia Premium",
    rating: "4.9",
    bookings: "847",
  },
  {
    gradient: "from-purple-400 to-pink-400",
    emoji: "💇",
    name: "Ana Paula",
    specialty: "Salão de Beleza",
    rating: "5.0",
    bookings: "1.203",
  },
  {
    gradient: "from-blue-400 to-cyan-400",
    emoji: "🏋️",
    name: "Ricardo Souza",
    specialty: "Personal Trainer",
    rating: "4.8",
    bookings: "512",
  },
  {
    gradient: "from-green-400 to-teal-400",
    emoji: "📸",
    name: "Fernanda Lima",
    specialty: "Fotógrafa",
    rating: "4.9",
    bookings: "389",
  },
  {
    gradient: "from-yellow-400 to-orange-400",
    emoji: "💅",
    name: "Juliana Costa",
    specialty: "Nail Designer",
    rating: "5.0",
    bookings: "674",
  },
  {
    gradient: "from-rose-400 to-red-400",
    emoji: "🧘",
    name: "Mariana Alves",
    specialty: "Instrutora de Yoga",
    rating: "4.9",
    bookings: "291",
  },
];

const PortfolioCarousel = () => {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = portfolioItems.length;

  const visibleCount = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 640) return 2;
    }
    return 1;
  };

  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const update = () => setVisible(visibleCount());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = total - visible;

  const next = () => setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
  const prev = () => setCurrent((c) => (c <= 0 ? maxIndex : c - 1));

  useEffect(() => {
    intervalRef.current = setInterval(next, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const resume = () => {
    intervalRef.current = setInterval(next, 3000);
  };

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200 text-sm font-medium text-purple-600 mb-5">
            Portfólio
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Mostre seu trabalho.{" "}
            <span className="text-orange-500">Atraia mais clientes.</span>
          </h2>
          <p className="text-slate-500 text-base">
            Profissionais usam o Salão Cashback para exibir seu portfólio e atrair novos clientes pelo link de agendamento.
          </p>
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out gap-5"
            style={{ transform: `translateX(calc(-${current * (100 / visible)}% - ${current * (20 / visible)}px))` }}
          >
            {portfolioItems.map((item) => (
              <div
                key={item.name}
                className="flex-shrink-0 rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
                style={{ width: `calc(${100 / visible}% - ${(visible - 1) * 20 / visible}px)` }}
              >
                {/* Image placeholder */}
                <div className={`h-44 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <span className="text-5xl">{item.emoji}</span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-base">{item.emoji} {item.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">"{item.specialty}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      ⭐ {item.rating} · {item.bookings} agendamentos
                    </span>
                  </div>
                  <button className="mt-3 w-full text-sm font-semibold text-orange-500 border border-orange-200 rounded-lg py-2 hover:bg-orange-50 transition-colors">
                    Ver perfil →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-orange-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-6 bg-orange-500" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-orange-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PortfolioCarousel;
