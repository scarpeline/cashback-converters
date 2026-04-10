import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const portfolioItems = [
  { gradient: "from-indigo-500 to-purple-500", emoji: "✂️", name: "Carlos Barbeiro", specialty: "Barbearia Premium", rating: "4.9", bookings: "847" },
  { gradient: "from-pink-500 to-rose-400", emoji: "💇", name: "Ana Paula", specialty: "Salão de Beleza", rating: "5.0", bookings: "1.203" },
  { gradient: "from-cyan-500 to-blue-500", emoji: "🏋️", name: "Ricardo Souza", specialty: "Personal Trainer", rating: "4.8", bookings: "512" },
  { gradient: "from-emerald-500 to-teal-500", emoji: "📸", name: "Fernanda Lima", specialty: "Fotógrafa", rating: "4.9", bookings: "389" },
  { gradient: "from-amber-500 to-orange-400", emoji: "💅", name: "Juliana Costa", specialty: "Nail Designer", rating: "5.0", bookings: "674" },
  { gradient: "from-violet-500 to-purple-500", emoji: "🧘", name: "Mariana Alves", specialty: "Instrutora de Yoga", rating: "4.9", bookings: "291" },
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible]);

  const pause = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  const resume = () => { intervalRef.current = setInterval(next, 3000); };

  return (
    <section className="py-24 px-4 bg-slate-50">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 text-sm font-semibold text-violet-600 mb-6">
            🎨 Portfólio
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Mostre seu trabalho.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">Atraia mais clientes.</span>
          </h2>
          <p className="text-slate-500 text-lg">
            Profissionais usam o AgendaPRO para exibir seu portfólio e atrair novos clientes.
          </p>
        </div>

        <div className="relative overflow-hidden" onMouseEnter={pause} onMouseLeave={resume}>
          <div
            className="flex transition-transform duration-500 ease-in-out gap-5"
            style={{ transform: `translateX(calc(-${current * (100 / visible)}% - ${current * (20 / visible)}px))` }}
          >
            {portfolioItems.map((item) => (
              <div
                key={item.name}
                className="flex-shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 bg-white group"
                style={{ width: `calc(${100 / visible}% - ${(visible - 1) * 20 / visible}px)` }}
              >
                <div className={`h-44 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <span className="text-5xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base">{item.emoji} {item.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">"{item.specialty}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">⭐ {item.rating} · {item.bookings} agendamentos</span>
                  </div>
                  <button className="mt-3 w-full text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl py-2.5 hover:bg-indigo-50 transition-colors">
                    Ver perfil →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-10">
          <button onClick={prev} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-300 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-indigo-500" : "w-2 bg-slate-200"}`} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-300 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PortfolioCarousel;
