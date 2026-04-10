import { useState } from "react";
import { Link } from "react-router-dom";
import { usePartnerCommissionConfig } from "@/hooks/usePartnerCommissionConfig";

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const IconUser = ({ color = "currentColor", size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// ─── Visual icon grid ─────────────────────────────────────────────────────────
function IconGrid({ count, color, max = 50 }: { count: number; color: string; max?: number }) {
  const shown = Math.min(count, max);
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {Array.from({ length: shown }).map((_, i) => (
        <IconUser key={i} color={color} size={18} />
      ))}
      {count > max && (
        <span className="text-xs font-bold" style={{ color }}>+{count - max}</span>
      )}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-bold text-orange-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-orange-500"
      />
    </div>
  );
}

// ─── Currency formatter ───────────────────────────────────────────────────────
function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── Main component ───────────────────────────────────────────────────────────
const PartnershipPage = () => {
  const config = usePartnerCommissionConfig();

  // Calculator state
  const [calcTab, setCalcTab] = useState<"afiliado" | "franqueado" | "diretor">("afiliado");

  // Afiliado
  const [afClientes, setAfClientes] = useState(10);

  // Franqueado
  const [frAfiliados, setFrAfiliados] = useState(5);
  const [frClientesPorAfiliado, setFrClientesPorAfiliado] = useState(5);

  // Diretor
  const [dirFranqueados, setDirFranqueados] = useState(3);
  const [dirAfiliadosPorFranqueado, setDirAfiliadosPorFranqueado] = useState(5);
  const [dirClientesPorAfiliado, setDirClientesPorAfiliado] = useState(5);

  // ── Calculations ──────────────────────────────────────────────────────────
  const afAdesao = afClientes * config.preco_assinatura * (config.afiliado_adesao_pct / 100);
  const afRecorrente =
    afClientes * config.preco_assinatura * (config.afiliado_recorrente_pct / 100) * config.afiliado_recorrente_meses;
  const afTotal = afAdesao + afRecorrente;

  const frTotalClientes = frAfiliados * frClientesPorAfiliado;
  const frAdesao = frTotalClientes * config.preco_assinatura * (config.franqueado_adesao_pct / 100);
  const frRecorrente =
    frTotalClientes * config.preco_assinatura * (config.franqueado_recorrente_pct / 100) * config.franqueado_recorrente_meses;
  const frTotal = frAdesao + frRecorrente;

  const dirTotalAfiliados = dirFranqueados * dirAfiliadosPorFranqueado;
  const dirTotalClientes = dirTotalAfiliados * dirClientesPorAfiliado;
  const dirGanhoAfiliados =
    dirTotalClientes * config.preco_assinatura * (config.diretor_afiliados_pct / 100) * config.diretor_recorrente_meses;
  const dirGanhoFranqueados =
    dirTotalClientes * config.preco_assinatura * (config.diretor_franqueados_pct / 100) * config.diretor_recorrente_meses;
  const dirTotal = dirGanhoAfiliados + dirGanhoFranqueados;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── SEÇÃO 1: HERO ─────────────────────────────────────────────────── */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-6">
          <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-orange-500/30">
            Mais de 500 parceiros ativos
          </span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">
            Ganhe dinheiro indicando o sistema que{" "}
            <span className="text-orange-400">todo profissional precisa</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto">
            Seja afiliado, franqueado ou diretor. Comissões recorrentes, rede crescente, renda passiva real.
          </p>
          <Link
            to="/login"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
          >
            Quero ser parceiro →
          </Link>
        </div>
      </section>

      {/* ── SEÇÃO 2: CARDS DE NÍVEL ───────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">
            Escolha seu nível de parceria
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Afiliado */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <p className="text-orange-400 font-black uppercase tracking-widest text-xs mb-1">Afiliado</p>
                <h3 className="text-xl font-bold">Comece Grátis</h3>
                <p className="text-3xl font-black text-white mt-2">R$ 0</p>
                <p className="text-slate-400 text-xs">gratuito</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 flex-1">
                <li>✅ {config.afiliado_adesao_pct}% na adesão</li>
                <li>✅ {config.afiliado_recorrente_pct}% recorrente por {config.afiliado_recorrente_meses} meses</li>
                <li>✅ Link de indicação personalizado</li>
                <li>✅ Dashboard básico</li>
              </ul>
              <Link
                to="/login"
                className="block text-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Começar Grátis
              </Link>
            </div>

            {/* Franqueado */}
            <div className="bg-slate-900 border-2 border-orange-500 rounded-2xl p-6 flex flex-col gap-4 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Mais Popular
              </span>
              <div>
                <p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-1">Franqueado</p>
                <h3 className="text-xl font-bold">Escale sua Rede</h3>
                <p className="text-3xl font-black text-white mt-2">
                  R$ {config.preco_franqueado.toLocaleString("pt-BR")}
                </p>
                <p className="text-slate-400 text-xs">investimento único</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 flex-1">
                <li>✅ {config.franqueado_adesao_pct}% sobre adesões da rede</li>
                <li>✅ {config.franqueado_recorrente_pct}% recorrente por {config.franqueado_recorrente_meses} meses</li>
                <li>✅ Gerencia afiliados</li>
                <li>✅ Dashboard avançado</li>
              </ul>
              <Link
                to="/login"
                className="block text-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Quero ser Franqueado
              </Link>
            </div>

            {/* Diretor */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <p className="text-purple-400 font-black uppercase tracking-widest text-xs mb-1">Diretor</p>
                <h3 className="text-xl font-bold">Topo da Hierarquia</h3>
                <p className="text-3xl font-black text-white mt-2">
                  R$ {config.preco_diretor.toLocaleString("pt-BR")}
                </p>
                <p className="text-slate-400 text-xs">investimento único</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 flex-1">
                <li>✅ {config.diretor_afiliados_pct}% sobre rede de afiliados</li>
                <li>✅ {config.diretor_franqueados_pct}% sobre rede de franqueados</li>
                <li>✅ Por {config.diretor_recorrente_meses} meses</li>
                <li>✅ Visão total da rede</li>
              </ul>
              <Link
                to="/login"
                className="block text-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Quero ser Diretor
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: CALCULADORA ─────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">
            Quanto você pode ganhar?
          </h2>
          <p className="text-slate-400 text-center mb-8">Arraste os sliders e veja o potencial em tempo real</p>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-8">
            {(["afiliado", "franqueado", "diretor"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCalcTab(tab)}
                className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${
                  calcTab === tab
                    ? "bg-orange-500 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 space-y-6">

            {/* Afiliado */}
            {calcTab === "afiliado" && (
              <>
                <Slider
                  label="Quantos clientes você vai indicar?"
                  value={afClientes}
                  min={1}
                  max={50}
                  onChange={setAfClientes}
                />
                <div className="py-2">
                  <IconGrid count={afClientes} color="#f97316" max={50} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Na adesão</p>
                    <p className="text-xl font-black text-orange-400">{brl(afAdesao)}</p>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Recorrente ({config.afiliado_recorrente_meses} meses)</p>
                    <p className="text-xl font-black text-orange-400">{brl(afRecorrente)}</p>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-4">
                    <p className="text-xs text-orange-300 mb-1">Total</p>
                    <p className="text-xl font-black text-orange-400">{brl(afTotal)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Franqueado */}
            {calcTab === "franqueado" && (
              <>
                <Slider
                  label="Afiliados na sua rede"
                  value={frAfiliados}
                  min={1}
                  max={20}
                  onChange={setFrAfiliados}
                />
                <Slider
                  label="Clientes por afiliado"
                  value={frClientesPorAfiliado}
                  min={1}
                  max={20}
                  onChange={setFrClientesPorAfiliado}
                />
                <div className="py-2 space-y-2">
                  <p className="text-xs text-slate-400 text-center">Afiliados (azul) · Clientes (laranja)</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {Array.from({ length: Math.min(frAfiliados, 20) }).map((_, i) => (
                      <IconUser key={`af-${i}`} color="#60a5fa" size={18} />
                    ))}
                  </div>
                  <IconGrid count={Math.min(frTotalClientes, 50)} color="#f97316" max={50} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Na adesão</p>
                    <p className="text-xl font-black text-blue-400">{brl(frAdesao)}</p>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Recorrente ({config.franqueado_recorrente_meses} meses)</p>
                    <p className="text-xl font-black text-blue-400">{brl(frRecorrente)}</p>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-4">
                    <p className="text-xs text-blue-300 mb-1">Total</p>
                    <p className="text-xl font-black text-blue-400">{brl(frTotal)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Diretor */}
            {calcTab === "diretor" && (
              <>
                <Slider
                  label="Franqueados na rede"
                  value={dirFranqueados}
                  min={1}
                  max={10}
                  onChange={setDirFranqueados}
                />
                <Slider
                  label="Afiliados por franqueado"
                  value={dirAfiliadosPorFranqueado}
                  min={1}
                  max={10}
                  onChange={setDirAfiliadosPorFranqueado}
                />
                <Slider
                  label="Clientes por afiliado"
                  value={dirClientesPorAfiliado}
                  min={1}
                  max={20}
                  onChange={setDirClientesPorAfiliado}
                />
                <div className="py-2 space-y-2">
                  <p className="text-xs text-slate-400 text-center">Diretor (roxo) · Franqueados (azul) · Afiliados (verde) · Clientes (laranja)</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <IconUser color="#a855f7" size={22} />
                    {Array.from({ length: Math.min(dirFranqueados, 10) }).map((_, i) => (
                      <IconUser key={`fr-${i}`} color="#60a5fa" size={18} />
                    ))}
                    {Array.from({ length: Math.min(dirTotalAfiliados, 20) }).map((_, i) => (
                      <IconUser key={`af-${i}`} color="#4ade80" size={16} />
                    ))}
                  </div>
                  <IconGrid count={Math.min(dirTotalClientes, 50)} color="#f97316" max={50} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Via afiliados</p>
                    <p className="text-xl font-black text-purple-400">{brl(dirGanhoAfiliados)}</p>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">Via franqueados</p>
                    <p className="text-xl font-black text-purple-400">{brl(dirGanhoFranqueados)}</p>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-4">
                    <p className="text-xs text-purple-300 mb-1">Total ({config.diretor_recorrente_meses} meses)</p>
                    <p className="text-xl font-black text-purple-400">{brl(dirTotal)}</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4: COMO FUNCIONA ────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Crie sua conta grátis", desc: "Cadastre-se em menos de 2 minutos e receba seu link de indicação personalizado." },
              { step: "2", title: "Compartilhe seu link", desc: "Envie para amigos, redes sociais ou clientes. Cada clique é rastreado automaticamente." },
              { step: "3", title: "Receba comissões automaticamente", desc: "Pagamentos processados toda semana direto na sua conta, sem burocracia." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-left">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-lg mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 5: DEPOIMENTOS ─────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">O que dizem nossos parceiros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos M.",
                role: "Afiliado",
                text: "Comecei indicando 3 barbearias do meu bairro. Em 2 meses já estava recebendo mais de R$ 800 por mês sem fazer nada extra.",
              },
              {
                name: "Fernanda L.",
                role: "Franqueada",
                text: "Montei uma rede de 12 afiliados em 4 meses. O dashboard me mostra tudo em tempo real. Melhor investimento que fiz.",
              },
              {
                name: "Ricardo T.",
                role: "Diretor",
                text: "Com 5 franqueados e mais de 60 afiliados na rede, minha renda passiva já supera meu salário anterior. Incrível.",
              },
            ].map(({ name, role, text }) => (
              <div key={name} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <p className="text-slate-300 text-sm mb-4">"{text}"</p>
                <div>
                  <p className="font-bold text-white">{name}</p>
                  <p className="text-orange-400 text-xs font-semibold">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 6: CTA FINAL ────────────────────────────────────────────── */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Pronto para começar?</h2>
          <p className="text-slate-400 text-lg">
            Crie sua conta grátis agora e comece a ganhar comissões ainda esta semana.
          </p>
          <Link
            to="/login"
            className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-black text-xl px-10 py-5 rounded-2xl transition-colors"
          >
            Criar conta grátis →
          </Link>
        </div>
      </section>

    </div>
  );
};

export default PartnershipPage;
