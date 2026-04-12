/**
 * BookingPage – Agendamento público sem login
 * Rota: /agendar/:slug
 * 
 * Suporta parâmetros de integração via URL:
 * ?token=<api_token>&service=<service_id>&prof=<professional_id>&ref=<external_ref>&source=<app_name>
 */

import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, Calendar, Scissors, User, Clock, CheckCircle2,
  ChevronRight, MapPin, Phone, ArrowLeft, Zap, ExternalLink,
} from "lucide-react";
import logo from "@/assets/logo.png";

type Barbershop = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  slug: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  description: string | null;
};

type Professional = {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
};

type Step = "service" | "professional" | "datetime" | "info" | "confirm";

function generateSlots(date: string, bookedSlots: string[]): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const slot = `${date}T${hh}:${mm}:00`;
      if (!bookedSlots.includes(slot)) slots.push(slot);
    }
  }
  return slots;
}

function formatTime(iso: string) {
  return iso.substring(11, 16);
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getNext14Days() {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  // Parâmetros de integração vindos do app externo
  const integrationToken = searchParams.get("token");
  const preServiceId     = searchParams.get("service");
  const preProfId        = searchParams.get("prof");
  const externalRef      = searchParams.get("ref");
  const sourceName       = searchParams.get("source") || "direct";
  const returnUrl        = searchParams.get("return_url"); // URL para voltar ao app externo

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [sourceApp, setSourceApp] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    (async () => {
      const { data: shop } = await (supabase as any)
        .from("barbershops")
        .select("id, name, address, phone, description, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (!shop) { setNotFound(true); setLoading(false); return; }
      setBarbershop(shop as Barbershop);

      const [svcRes, profRes] = await Promise.all([
        (supabase as any).from("services").select("id, name, price, duration_minutes, description").eq("barbershop_id", shop.id).eq("is_active", true).order("name"),
        (supabase as any).from("professionals").select("id, name, specialty, avatar_url").eq("barbershop_id", shop.id).eq("is_active", true).order("name"),
      ]);

      const svcs: Service[] = svcRes.data || [];
      const profs: Professional[] = profRes.data || [];
      setServices(svcs);
      setProfessionals(profs);

      // Validar token de integração e pré-selecionar dados
      if (integrationToken) {
        try {
          const res = await fetch(`${window.location.origin}/functions/v1/integration-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "validate", token: integrationToken }),
          });
          const result = await res.json();
          if (result.valid) {
            setTokenValid(true);
            setSourceApp(sourceName);
          }
        } catch { /* token inválido, continua sem integração */ }
      }

      // Pré-selecionar serviço se veio na URL
      if (preServiceId) {
        const svc = svcs.find(s => s.id === preServiceId);
        if (svc) { setSelectedService(svc); setStep("professional"); }
      }

      // Pré-selecionar profissional se veio na URL
      if (preProfId) {
        const prof = profs.find(p => p.id === preProfId);
        if (prof) {
          setSelectedProfessional(prof);
          if (preServiceId) setStep("datetime");
        }
      }

      setLoading(false);
    })();
  }, [slug, integrationToken, preServiceId, preProfId, sourceName]);

  useEffect(() => {
    if (!selectedProfessional || !selectedDate || !barbershop) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    (async () => {
      const { data: booked } = await (supabase as any)
        .from("appointments")
        .select("scheduled_at")
        .eq("professional_id", selectedProfessional.id)
        .gte("scheduled_at", `${selectedDate}T00:00:00`)
        .lte("scheduled_at", `${selectedDate}T23:59:59`)
        .neq("status", "cancelled");

      const bookedSlots = (booked || []).map((a: any) => {
        const raw: string = a.scheduled_at;
        return raw.substring(0, 19);
      });
      setAvailableSlots(generateSlots(selectedDate, bookedSlots));
      setLoadingSlots(false);
    })();
  }, [selectedProfessional, selectedDate, barbershop]);

  const handleSubmit = async () => {
    if (!barbershop || !selectedService || !selectedProfessional || !selectedSlot || !clientName || !clientWhatsapp) return;
    setSubmitting(true);

    // Busca token_id se houver integração
    let tokenId: string | null = null;
    if (integrationToken) {
      const { data: tk } = await (supabase as any)
        .from("integration_tokens")
        .select("id")
        .eq("token", integrationToken)
        .maybeSingle();
      tokenId = tk?.id || null;
    }

    const { data: apt, error } = await (supabase as any).from("appointments").insert({
      barbershop_id: barbershop.id,
      service_id: selectedService.id,
      professional_id: selectedProfessional.id,
      scheduled_at: selectedSlot,
      client_name: clientName,
      client_whatsapp: clientWhatsapp.replace(/\D/g, ""),
      status: "scheduled",
      source: sourceName,
      source_token_id: tokenId,
      source_metadata: externalRef ? { external_ref: externalRef, source_app: sourceName } : null,
    }).select("id").single();

    setSubmitting(false);
    if (error) { alert("Erro ao agendar. Tente novamente."); return; }
    setAppointmentId(apt?.id || null);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound || !barbershop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 gap-4 px-4">
        <img src={logo} alt="Logo" className="w-16 h-16" />
        <h1 className="text-2xl font-bold text-gray-800">Barbearia não encontrada</h1>
        <Link to="/"><Button variant="outline">Voltar ao início</Button></Link>
      </div>
    );
  }

  if (done) {
    // Monta URL de retorno com dados do agendamento
    const returnWithData = returnUrl
      ? `${returnUrl}?appointment_id=${appointmentId}&status=confirmed&ref=${externalRef || ""}&service=${selectedService?.name || ""}`
      : null;

    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-4 gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Agendamento Confirmado!</h2>

          {/* Badge de origem */}
          {sourceApp && sourceApp !== "direct" && (
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
              <Zap className="w-3 h-3" />
              Agendado via {sourceApp}
            </div>
          )}

          <div className="text-left bg-orange-50 rounded-2xl p-4 space-y-2 text-sm">
            <p><span className="font-semibold text-gray-600">Barbearia:</span> {barbershop?.name}</p>
            <p><span className="font-semibold text-gray-600">Serviço:</span> {selectedService?.name}</p>
            <p><span className="font-semibold text-gray-600">Profissional:</span> {selectedProfessional?.name}</p>
            <p><span className="font-semibold text-gray-600">Data:</span> {formatDate(selectedDate)}</p>
            <p><span className="font-semibold text-gray-600">Horário:</span> {selectedSlot ? formatTime(selectedSlot) : ""}</p>
            <p><span className="font-semibold text-gray-600">Nome:</span> {clientName}</p>
            {appointmentId && <p className="text-xs text-gray-400">ID: {appointmentId}</p>}
          </div>
          <p className="text-xs text-gray-500">Guarde essas informações. Em caso de dúvidas, entre em contato com a barbearia.</p>

          {/* Botão voltar ao app externo */}
          {returnWithData && (
            <a href={returnWithData}>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl mb-2">
                <ExternalLink className="w-4 h-4 mr-2" /> Voltar para {sourceApp || "o app"}
              </Button>
            </a>
          )}

          {barbershop?.phone && (
            <a href={`https://wa.me/55${barbershop.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl">
                <Phone className="w-4 h-4 mr-2" /> Falar no WhatsApp
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "service", label: "Serviço", icon: <Scissors className="w-4 h-4" /> },
    { id: "professional", label: "Profissional", icon: <User className="w-4 h-4" /> },
    { id: "datetime", label: "Data/Hora", icon: <Clock className="w-4 h-4" /> },
    { id: "info", label: "Seus Dados", icon: <User className="w-4 h-4" /> },
    { id: "confirm", label: "Confirmar", icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Banner de integração */}
      {tokenValid && sourceApp && (
        <div className="bg-blue-500 text-white text-xs text-center py-2 px-4 flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Agendamento integrado via <strong>{sourceApp}</strong>
          {returnUrl && (
            <a href={returnUrl} className="underline ml-1 opacity-80 hover:opacity-100">← Voltar</a>
          )}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 text-base leading-tight truncate">{barbershop.name}</h1>
            {barbershop.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />{barbershop.address}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <span className="text-xs font-semibold text-orange-500 bg-orange-100 px-3 py-1 rounded-full">Agendar</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < stepIndex ? "bg-orange-500 text-white" : i === stepIndex ? "bg-orange-500 text-white ring-2 ring-orange-200" : "bg-gray-200 text-gray-400"}`}>
                  {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? "bg-orange-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((s, i) => (
              <span key={s.id} className={`text-[10px] font-semibold ${i === stepIndex ? "text-orange-500" : "text-gray-400"}`} style={{ width: `${100 / steps.length}%`, textAlign: "center" }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* STEP: Serviço */}
        {step === "service" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-800">Escolha o serviço</h2>
            {services.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum serviço disponível no momento.</p>
            ) : (
              services.map(svc => (
                <Card key={svc.id}
                  className={`cursor-pointer transition-all border-2 ${selectedService?.id === svc.id ? "border-orange-500 bg-orange-50" : "border-transparent hover:border-orange-200"}`}
                  onClick={() => setSelectedService(svc)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedService?.id === svc.id ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-500"}`}>
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{svc.name}</p>
                        {svc.description && <p className="text-xs text-gray-500">{svc.description}</p>}
                        {svc.duration_minutes && <p className="text-xs text-gray-400">{svc.duration_minutes} min</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-orange-500">R$ {Number(svc.price).toFixed(2)}</p>
                      {selectedService?.id === svc.id && <CheckCircle2 className="w-4 h-4 text-orange-500 ml-auto mt-1" />}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold"
              disabled={!selectedService}
              onClick={() => setStep("professional")}>
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: Profissional */}
        {step === "professional" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <button onClick={() => setStep("service")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800">Escolha o profissional</h2>
            {professionals.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum profissional disponível.</p>
            ) : (
              professionals.map(prof => (
                <Card key={prof.id}
                  className={`cursor-pointer transition-all border-2 ${selectedProfessional?.id === prof.id ? "border-orange-500 bg-orange-50" : "border-transparent hover:border-orange-200"}`}
                  onClick={() => setSelectedProfessional(prof)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${selectedProfessional?.id === prof.id ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-500"}`}>
                      {prof.avatar_url
                        ? <img src={prof.avatar_url} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                        : prof.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{prof.name}</p>
                      {prof.specialty && <p className="text-xs text-gray-500">{prof.specialty}</p>}
                    </div>
                    {selectedProfessional?.id === prof.id && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                  </CardContent>
                </Card>
              ))
            )}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold"
              disabled={!selectedProfessional}
              onClick={() => setStep("datetime")}>
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: Data/Hora */}
        {step === "datetime" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <button onClick={() => setStep("professional")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800">Escolha a data</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getNext14Days().map(day => {
                const [y, m, d] = day.split("-");
                const date = new Date(Number(y), Number(m) - 1, Number(d));
                const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
                return (
                  <button key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl border-2 transition-all min-w-[56px] ${selectedDate === day ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"}`}>
                    <span className="text-[10px] font-semibold uppercase">{weekday}</span>
                    <span className="text-lg font-bold leading-tight">{d}</span>
                    <span className="text-[10px]">{m}/{y.slice(2)}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="text-xl font-bold text-gray-800">Escolha o horário</h2>
            {loadingSlots ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
            ) : availableSlots.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum horário disponível neste dia.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedSlot === slot ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-orange-300"}`}>
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold"
              disabled={!selectedSlot}
              onClick={() => setStep("info")}>
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: Dados do cliente */}
        {step === "info" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <button onClick={() => setStep("datetime")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800">Seus dados</h2>
            <p className="text-sm text-gray-500">Não precisa criar conta. Só precisamos do seu nome e WhatsApp.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Nome completo *</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl h-12 px-4 text-gray-800 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-0000"
                  value={clientWhatsapp}
                  onChange={e => setClientWhatsapp(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl h-12 px-4 text-gray-800 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-semibold"
              disabled={!clientName.trim() || !clientWhatsapp.trim()}
              onClick={() => setStep("confirm")}>
              Revisar agendamento <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP: Confirmação */}
        {step === "confirm" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <button onClick={() => setStep("info")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-gray-800">Confirmar agendamento</h2>
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-orange-200">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{barbershop.name}</p>
                    {barbershop.address && <p className="text-xs text-gray-500">{barbershop.address}</p>}
                  </div>
                </div>
                {[
                  { label: "Serviço", value: `${selectedService?.name} — R$ ${Number(selectedService?.price || 0).toFixed(2)}` },
                  { label: "Profissional", value: selectedProfessional?.name },
                  { label: "Data", value: formatDate(selectedDate) },
                  { label: "Horário", value: selectedSlot ? formatTime(selectedSlot) : "" },
                  { label: "Nome", value: clientName },
                  { label: "WhatsApp", value: clientWhatsapp },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">{row.label}</span>
                    <span className="font-semibold text-gray-800 text-right ml-2">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 font-bold text-base"
              disabled={submitting}
              onClick={handleSubmit}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Agendando...</> : "Confirmar Agendamento"}
            </Button>
            <p className="text-xs text-center text-gray-400">
              Ao confirmar, você concorda com os termos de uso da barbearia.
            </p>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by <a href="/" className="text-orange-500 hover:underline">Salão Cashback</a>
      </footer>
    </div>
  );
}
