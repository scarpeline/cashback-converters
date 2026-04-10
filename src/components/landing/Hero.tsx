import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Calendar, ChevronDown } from "lucide-react";

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
    <section className="relative min-h-[90vh] flex items-center bg-white overflow-hidden px-4 py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white to-slate-50/40" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl" />

      <div className="container relative z-10 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm font-medium text-orange-600">
                +500 profissionais já usam
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 text-slate-900">
              Sua agenda cheia.{" "}
              <span className="text-orange-500">Seu dinheiro na conta.</span>{" "}
              Seus clientes voltando.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed">
              O sistema que trabalha por você enquanto você atende. Agendamento online, WhatsApp automático, pagamentos PIX e cashback que fideliza.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-8">
              <Link to="/onboarding">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg shadow-orange-500/30">
                  Começar Grátis — 7 dias sem cartão
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 px-6 py-3 h-auto text-base font-medium">
                  Ver como funciona ↓
                </Button>
              </a>
            </div>

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

          {/* Right — Phone mockup */}
          <div className="flex-1 w-full max-w-sm">
            <div className="relative mx-auto w-72">
              {/* Phone frame */}
              <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-900/40">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-slate-900 px-6 pt-3 pb-2 flex items-center justify-between">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="w-20 h-5 bg-slate-800 rounded-full" />
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-slate-600" />
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-orange-500 px-4 py-3">
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
                  <div className="px-3 py-3 space-y-2 bg-slate-50">
                    {appointments.map((apt) => (
                      <div key={apt.time} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-bold text-slate-900">{apt.time}</span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "confirmado"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {apt.status === "confirmado" ? "✓ Confirmado" : "⏳ Pendente"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{apt.name}</p>
                        <p className="text-[11px] text-slate-500">{apt.service}</p>
                      </div>
                    ))}

                    <div className="text-center py-2">
                      <span className="text-[11px] text-orange-500 font-medium">+ 4 agendamentos hoje</span>
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div className="bg-white border-t border-slate-100 px-4 py-2 flex justify-around">
                    {["📅", "💰", "👥", "📊"].map((icon, i) => (
                      <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${i === 0 ? "bg-orange-50" : ""}`}>
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-8 top-16 bg-white rounded-xl px-3 py-2 shadow-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-green-500">●</span> PIX recebido R$120
              </div>
              <div className="absolute -right-6 bottom-20 bg-white rounded-xl px-3 py-2 shadow-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                🎁 Cashback enviado!
              </div>
            </div>
          </div>
        </div>

        {/* Sector badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 mb-4 uppercase tracking-wider font-medium">Usado por profissionais de</p>
          <div className="flex flex-wrap justify-center gap-3">
            {sectors.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-600 transition-colors">
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
