import { useNavigate } from "react-router-dom";
import { useBarbershop } from "./hooks";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDynamicLabel } from "@/lib/dynamicLabels";
import {
  TrendingUp,
  Calendar,
  Users,
  Wallet,
  Share2,
  ArrowUpRight,
  Zap,
  Star,
  MessageCircle,
  Settings,
  Gift,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { barbershop } = useBarbershop();
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    todayAppointments: 0,
    activeClients: 0,
  });

  useEffect(() => {
    if (!barbershop?.id) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    Promise.all([
      (supabase as any)
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .in("status", ["scheduled", "confirmed", "completed"]),
      (supabase as any)
        .from("appointments")
        .select("services(price)")
        .eq("barbershop_id", barbershop.id)
        .eq("status", "completed")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString()),
      (supabase as any)
        .from("appointments")
        .select("client_name", { count: "exact", head: true })
        .eq("barbershop_id", barbershop.id),
    ]).then(([todayApts, completedApts, allClients]) => {
      const revenue = (completedApts.data || []).reduce(
        (s: number, a: any) => s + Number(a.services?.price || 0),
        0
      );
      setMetrics({
        todayAppointments: todayApts.count || 0,
        todayRevenue: revenue,
        activeClients: allClients.count || 0,
      });
    });
  }, [barbershop?.id]);

  const bookingLink = useMemo(
    () =>
      barbershop?.slug
        ? `${window.location.origin}/agendar/${barbershop.slug}`
        : "",
    [barbershop?.slug]
  );

  const clientsLabel = useDynamicLabel("clients");
  const appointmentsLabel = useDynamicLabel("appointments");

  const handleShare = useCallback(() => {
    if (!bookingLink) {
      toast.error("Configure o slug da barbearia primeiro.");
      return;
    }
    if (navigator.share) {
      navigator.share({ title: barbershop?.name, text: "Agende seu horário!", url: bookingLink });
    } else {
      navigator.clipboard?.writeText(bookingLink);
      toast.success("Link copiado!");
    }
  }, [bookingLink, barbershop?.name]);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">

      {/* Cabeçalho */}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">{saudacao}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {barbershop?.name || "Minha Empresa"}
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">Visão geral do dia de hoje</p>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar link
        </button>
        <button
          onClick={() => navigate("/painel-dono/operacoes")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Acessar Agenda
        </button>
      </div>

      {/* Link de agendamento visível */}
      {bookingLink && (
        <div className="rounded-2xl border-2 border-orange-100 bg-orange-50 p-4">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Seu link de agendamento
          </p>
          <div className="flex items-center gap-2">
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm font-mono text-orange-700 bg-white border border-orange-200 rounded-xl px-3 py-2 truncate hover:text-orange-900 transition-colors"
            >
              {bookingLink}
            </a>
            <button
              onClick={handleShare}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Copiar
            </button>
          </div>
          <p className="text-xs text-orange-500 mt-2">
            Envie este link para seus clientes agendarem online, sem precisar ligar.
          </p>
        </div>
      )}

      <hr className="border-slate-200" />

      {/* Métricas */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">Hoje</p>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Faturamento</p>
            <p className="text-xl font-bold text-slate-900">R$ {metrics.todayRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">{appointmentsLabel}</p>
            <p className="text-xl font-bold text-slate-900">{metrics.todayAppointments}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">{clientsLabel}</p>
            <p className="text-xl font-bold text-slate-900">{metrics.activeClients}</p>
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Navegação rápida */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">Acessar</p>
        <div className="space-y-1">
          <NavRow
            icon={<Zap className="w-4 h-4" />}
            label="Operações"
            desc="Agenda, recorrências e fila de espera"
            onClick={() => navigate("/painel-dono/operacoes")}
          />
          <NavRow
            icon={<Users className="w-4 h-4" />}
            label="Gestão"
            desc="Profissionais, clientes e ranking"
            onClick={() => navigate("/painel-dono/gestao")}
          />
          <NavRow
            icon={<Wallet className="w-4 h-4" />}
            label="Financeiro"
            desc="Repasses, taxas e fluxo de caixa"
            onClick={() => navigate("/painel-dono/financeiro")}
          />
          <NavRow
            icon={<TrendingUp className="w-4 h-4" />}
            label="Crescimento"
            desc="CRM, cashback e retenção"
            onClick={() => navigate("/painel-dono/crescimento")}
          />
          <NavRow
            icon={<MessageCircle className="w-4 h-4" />}
            label="Comunicação"
            desc="WhatsApp e campanhas"
            onClick={() => navigate("/painel-dono/comunicacao")}
          />
          <NavRow
            icon={<Settings className="w-4 h-4" />}
            label="Ajustes"
            desc="Configurações do sistema"
            onClick={() => navigate("/painel-dono/configuracoes")}
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Dica / Cashback */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Cashback ativo</p>
          <p className="text-sm text-slate-500 mt-0.5">
            A retenção de clientes aumentou 22% este mês com recompensas.
          </p>
        </div>
        <button
          onClick={() => navigate("/painel-dono/crescimento")}
          className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          Configurar <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};

const NavRow = ({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-slate-100 transition-colors group text-left"
  >
    <span className="text-slate-500 group-hover:text-orange-500 transition-colors flex-shrink-0">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs font-medium text-slate-600 truncate">{desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 flex-shrink-0 transition-colors" />
  </button>
);
