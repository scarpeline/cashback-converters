import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Calendar } from "lucide-react";

const sectors = [
  { icon: "✂️", label: "Barbearia" },
  { icon: "💇", label: "Salão" },
  { icon: "🏋️", label: "Personal" },
  { icon: "📸", label: "Fotógrafo" },
  { icon: "💅", label: "Manicure" },
  { icon: "🐾", label: "Pet Shop" },
  { icon: "🧘", label: "Estúdio" },
  { icon: "🩺", label: "Clínica" },
];

const appointments = [
  { time: "09:00", name: "Carlos Mendes", service: "Corte + Barba", status: "confirmado" },
  { time: "10:30", name: "Rafael Lima", service: "Degradê", status: "confirmado" },
  { time: "11:15", name: "Bruno Costa", service: "Barba", status: "pendente" },
];

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 overflow-hidden px-4 py-16">
      {/* Background effects */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]" />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-cyan-300">
                +500 profissionais já usam
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] mb-6 text-white tracking-tight">
              Sua agenda cheia.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Seu dinheiro na conta.</span>{" "}
              Seus clientes voltando.
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
              O sistema que trabalha por você enquanto você atende. Agendamento online, WhatsApp automático, pagamentos PIX e cashback que fideliza.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10">
              <Link to="/onboarding">
                <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white px-10 py-4 h-auto text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                  Começar Grátis — 7 dias sem cartão
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" className="text-slate-400 hover:text-white px-6 py-4 h-auto text-lg font-medium">
                  Ver como funciona ↓
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Setup em 5 minutos
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Cancele quando quiser
              </span>
            </div>
          </div>

          {/* Right — Phone mockup */}
          <div className="flex-1 w-full max-w-sm">
            <div className="relative mx-auto w-72">
              <div className="bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl shadow-indigo-500/20 border border-white/10">
                <div className="bg-slate-950 rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="w-20 h-5 bg-slate-800 rounded-full" />
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-slate-700" />
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs">Hoje, segunda-feira</p>
                        <p className="text-white font-bold text-sm">Minha Agenda</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="px-3 py-3 space-y-2 bg-slate-900">
                    {appointments.map((apt) => (
                      <div key={apt.time} className="bg-slate-800/80 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span className="text-xs font-bold text-white">{apt.time}</span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "confirmado"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {apt.status === "confirmado" ? "✓ Confirmado" : "⏳ Pendente"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white">{apt.name}</p>
                        <p className="text-[11px] text-slate-400">{apt.service}</p>
                      </div>
                    ))}

                    <div className="text-center py-2">
                      <span className="text-[11px] text-cyan-400 font-medium">+ 4 agendamentos hoje</span>
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="bg-slate-900 border-t border-white/5 px-4 py-2 flex justify-around">
                    {["📅", "💰", "👥", "📊"].map((icon, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${i === 0 ? "bg-indigo-500/20" : ""}`}>
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-8 top-16 bg-slate-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="text-emerald-400">●</span> PIX recebido R$120
              </div>
              <div className="absolute -right-6 bottom-20 bg-slate-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
                🎁 Cashback enviado!
              </div>
            </div>
          </div>
        </div>

        {/* Sector badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 mb-4 uppercase tracking-wider font-medium">Usado por profissionais de</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors backdrop-blur-sm">
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
