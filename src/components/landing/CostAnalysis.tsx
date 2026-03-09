import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Server, CreditCard, MessageSquare, Mail, Shield, Globe,
  TrendingUp, TrendingDown, Calculator, AlertTriangle, CheckCircle2,
  DollarSign, Users, Building2
} from "lucide-react";

/* ── Preços de mercado dos provedores ── */
const PROVIDER_COSTS = {
  lovableCloud: {
    name: "Lovable Cloud (Hospedagem + Backend)",
    plans: [
      { name: "Free", price: 0, note: "Dev/teste" },
      { name: "Starter", price: 20, note: "~USD/mês" },
      { name: "Launch", price: 50, note: "~USD/mês" },
    ],
    estimatedBRL: 100, // ~USD 20 × 5.0
  },
  supabase: {
    name: "Supabase (Banco de Dados)",
    tiers: [
      { name: "Free", price: 0, limits: "500 MB, 50k MAU" },
      { name: "Pro", price: 25, limits: "8 GB, 100k MAU" },
    ],
    estimatedBRL: 130, // USD 25 × 5.0 + margin
  },
  asaas: {
    name: "ASAAS (Gateway de Pagamento)",
    monthlyFee: 0, // Sem mensalidade
    perTransaction: {
      pix: { percent: 0.99, fixed: 0 },
      card: { percent: 2.99, fixed: 0.49 },
      nfc: { percent: 1.99, fixed: 0 },
    },
    note: "Cobrado por transação, sem mensalidade fixa",
  },
  twilio: {
    name: "Twilio (SMS + WhatsApp)",
    smsPrice: 0.08, // USD por SMS no Brasil
    whatsappPrice: 0.005, // USD por msg WhatsApp utility
    monthlyNumber: 1.0, // USD/mês número
    estimatedBRL_per_sms: 0.42,
    estimatedBRL_per_whatsapp: 0.03,
  },
  telesign: {
    name: "TeleSign (Verificação SMS)",
    perVerification: 0.05, // USD
    estimatedBRL: 0.26,
  },
  resend: {
    name: "Resend (E-mail Transacional)",
    free: 3000, // emails/mês grátis
    proPlan: 20, // USD/mês = 50k emails
    perEmail: 0, // grátis até 3k
    estimatedBRL: 0, // grátis no início
  },
  domain: {
    name: "Domínio .com.br",
    annual: 40,
    monthly: 3.33,
  },
};

const CostAnalysis = () => {
  // Simulação de escala
  const [numClients, setNumClients] = useState(10); // barbearias ativas
  const [avgTransactions, setAvgTransactions] = useState(200); // tx/mês por barbearia
  const [avgTicket, setAvgTicket] = useState(50); // ticket médio R$
  const [smsPerClient, setSmsPerClient] = useState(30); // SMS/mês por barbearia
  const [emailsPerMonth, setEmailsPerMonth] = useState(500);

  // Cálculos
  const totalTransactions = numClients * avgTransactions;
  const totalGMV = totalTransactions * avgTicket;

  // Custo ASAAS (taxa do gateway - não é custo seu, é do cliente)
  // Seu custo real é zero com ASAAS - eles cobram do recebedor

  // Receita SaaS
  const avgPlanPrice = 29.9; // média mensal
  const saasRevenue = numClients * avgPlanPrice;

  // Receita taxa app (0.5% por transação)
  const appFeeRevenue = totalGMV * 0.005;

  // Custo Twilio
  const totalSms = numClients * smsPerClient;
  const twilioCost = totalSms * PROVIDER_COSTS.twilio.estimatedBRL_per_sms 
    + PROVIDER_COSTS.twilio.monthlyNumber * 5;

  // Custo TeleSign (verificações - estimativa 20% dos clientes novos)
  const verifications = Math.ceil(numClients * 0.2 * 5);
  const telesignCost = verifications * PROVIDER_COSTS.telesign.estimatedBRL;

  // Custo Email
  const emailCost = emailsPerMonth > 3000 
    ? PROVIDER_COSTS.resend.proPlan * 5 
    : 0;

  // Hosting
  const hostingCost = numClients <= 5 
    ? 0 
    : numClients <= 30 
      ? PROVIDER_COSTS.lovableCloud.estimatedBRL 
      : PROVIDER_COSTS.lovableCloud.estimatedBRL * 2;

  // Supabase
  const dbCost = numClients <= 10 
    ? 0 
    : PROVIDER_COSTS.supabase.estimatedBRL;

  // Domínio
  const domainCost = PROVIDER_COSTS.domain.monthly;

  // Comissão afiliados (estimativa 30% dos clientes via afiliado)
  const affiliateClients = Math.ceil(numClients * 0.3);
  // 60% primeiro mês + 20% recorrente (média: ~25% ao longo do tempo)
  const affiliateCost = affiliateClients * avgPlanPrice * 0.25;

  // Total custos
  const totalFixedCosts = hostingCost + dbCost + domainCost + emailCost;
  const totalVariableCosts = twilioCost + telesignCost + affiliateCost;
  const totalCosts = totalFixedCosts + totalVariableCosts;

  // Total receita
  const totalRevenue = saasRevenue + appFeeRevenue;

  // Lucro
  const profit = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const costItems = [
    {
      icon: Server,
      category: "Infraestrutura",
      items: [
        { 
          name: "Lovable Cloud (Hosting + Backend)", 
          cost: hostingCost,
          note: numClients <= 5 ? "Grátis (tier free)" : "Plano pago necessário",
          color: hostingCost === 0 ? "hsl(142 76% 36%)" : "hsl(42 100% 55%)",
        },
        { 
          name: "Banco de Dados (Supabase)", 
          cost: dbCost,
          note: numClients <= 10 ? "Grátis (tier free)" : "Pro plan ~USD 25/mês",
          color: dbCost === 0 ? "hsl(142 76% 36%)" : "hsl(42 100% 55%)",
        },
        { 
          name: "Domínio .com.br", 
          cost: domainCost,
          note: "~R$ 40/ano",
          color: "hsl(220 9% 55%)",
        },
      ],
    },
    {
      icon: MessageSquare,
      category: "Comunicação",
      items: [
        { 
          name: `Twilio SMS (${totalSms} msgs/mês)`, 
          cost: twilioCost,
          note: `~R$ ${PROVIDER_COSTS.twilio.estimatedBRL_per_sms.toFixed(2)}/SMS`,
          color: twilioCost > 50 ? "hsl(0 84% 60%)" : "hsl(42 100% 55%)",
        },
        { 
          name: `TeleSign Verificação (${verifications} verificações)`, 
          cost: telesignCost,
          note: "~R$ 0,26/verificação",
          color: "hsl(220 9% 55%)",
        },
        { 
          name: `Resend E-mail (${emailsPerMonth} emails/mês)`, 
          cost: emailCost,
          note: emailCost === 0 ? "Grátis até 3.000/mês" : "Pro plan USD 20/mês",
          color: emailCost === 0 ? "hsl(142 76% 36%)" : "hsl(42 100% 55%)",
        },
      ],
    },
    {
      icon: CreditCard,
      category: "Gateway de Pagamento (ASAAS)",
      items: [
        { 
          name: "Mensalidade ASAAS", 
          cost: 0,
          note: "Sem custo fixo mensal para você",
          color: "hsl(142 76% 36%)",
        },
        { 
          name: "Taxas por transação", 
          cost: 0,
          note: "Cobrada do cliente final, não de você",
          color: "hsl(142 76% 36%)",
        },
      ],
    },
    {
      icon: Users,
      category: "Programa de Afiliados",
      items: [
        { 
          name: `Comissões (~${affiliateClients} clientes via afiliado)`, 
          cost: affiliateCost,
          note: "60% 1º mês + 20% recorrente (média ~25%)",
          color: affiliateCost > 100 ? "hsl(0 84% 60%)" : "hsl(42 100% 55%)",
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" 
          style={{ background: "hsl(42 100% 50% / 0.1)", color: "hsl(42 100% 55%)" }}>
          <Calculator className="w-4 h-4" />
          <span className="text-sm font-medium">Análise de Custos do Sistema</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2" style={{ color: "hsl(0 0% 98%)" }}>
          Custos Operacionais vs. Receita
        </h2>
        <p className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>
          Ajuste os parâmetros para simular diferentes cenários de escala
        </p>
      </div>

      {/* Sliders de Simulação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Barbearias ativas", value: numClients, set: setNumClients, min: 1, max: 200, step: 1, suffix: "" },
          { label: "Transações/mês por barbearia", value: avgTransactions, set: setAvgTransactions, min: 10, max: 1000, step: 10, suffix: "" },
          { label: "Ticket médio (R$)", value: avgTicket, set: setAvgTicket, min: 20, max: 200, step: 5, suffix: "" },
          { label: "SMS/mês por barbearia", value: smsPerClient, set: setSmsPerClient, min: 0, max: 100, step: 5, suffix: "" },
          { label: "E-mails/mês total", value: emailsPerMonth, set: setEmailsPerMonth, min: 0, max: 10000, step: 100, suffix: "" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: "hsl(220 9% 60%)" }}>{s.label}</span>
              <span className="text-sm font-bold text-gradient-gold">{s.value}{s.suffix}</span>
            </div>
            <Slider
              value={[s.value]}
              onValueChange={([v]) => s.set(v)}
              min={s.min}
              max={s.max}
              step={s.step}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Resumo Rápido - Cards de Destaque */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Receita Mensal", 
            value: formatBRL(totalRevenue), 
            icon: TrendingUp, 
            color: "hsl(142 76% 36%)",
            bg: "hsl(142 76% 36% / 0.1)",
          },
          { 
            label: "Custos Mensais", 
            value: formatBRL(totalCosts), 
            icon: TrendingDown, 
            color: "hsl(0 84% 60%)",
            bg: "hsl(0 84% 60% / 0.1)",
          },
          { 
            label: "Lucro Líquido", 
            value: formatBRL(profit), 
            icon: DollarSign, 
            color: profit >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)",
            bg: profit >= 0 ? "hsl(142 76% 36% / 0.1)" : "hsl(0 84% 60% / 0.1)",
          },
          { 
            label: "Margem", 
            value: `${marginPercent.toFixed(1)}%`, 
            icon: marginPercent >= 50 ? CheckCircle2 : AlertTriangle, 
            color: marginPercent >= 50 ? "hsl(142 76% 36%)" : marginPercent >= 20 ? "hsl(42 100% 55%)" : "hsl(0 84% 60%)",
            bg: marginPercent >= 50 ? "hsl(142 76% 36% / 0.1)" : marginPercent >= 20 ? "hsl(42 100% 50% / 0.1)" : "hsl(0 84% 60% / 0.1)",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl p-4 text-center" 
            style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: card.bg }}>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-xs mb-1" style={{ color: "hsl(220 9% 55%)" }}>{card.label}</p>
            <p className="text-lg font-bold font-display" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Detalhamento de Receitas */}
      <div className="rounded-2xl p-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(0 0% 95%)" }}>
          <TrendingUp className="w-5 h-5" style={{ color: "hsl(142 76% 36%)" }} />
          Fontes de Receita
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" style={{ color: "hsl(42 100% 55%)" }} />
              <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>Assinaturas SaaS</span>
            </div>
            <p className="text-2xl font-bold text-gradient-gold">{formatBRL(saasRevenue)}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(220 9% 50%)" }}>
              {numClients} barbearias × R$ {avgPlanPrice.toFixed(2).replace('.', ',')} (média)
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4" style={{ color: "hsl(217 85% 60%)" }} />
              <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 95%)" }}>Taxa App (0,5%)</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "hsl(217 85% 60%)" }}>{formatBRL(appFeeRevenue)}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(220 9% 50%)" }}>
              0,5% sobre GMV de {formatBRL(totalGMV)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalhamento de Custos */}
      <div className="rounded-2xl p-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(0 0% 95%)" }}>
          <TrendingDown className="w-5 h-5" style={{ color: "hsl(0 84% 60%)" }} />
          Detalhamento de Custos Mensais
        </h3>
        <div className="space-y-6">
          {costItems.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-3">
                <group.icon className="w-4 h-4" style={{ color: "hsl(42 100% 55%)" }} />
                <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>{group.category}</span>
              </div>
              <div className="space-y-2 pl-6">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg p-3"
                    style={{ background: "hsl(222 47% 6% / 0.5)", border: "1px solid hsl(222 20% 20%)" }}>
                    <div>
                      <p className="text-sm" style={{ color: "hsl(0 0% 90%)" }}>{item.name}</p>
                      <p className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{item.note}</p>
                    </div>
                    <span className="text-sm font-bold font-display" style={{ color: item.color }}>
                      {item.cost === 0 ? "GRÁTIS" : formatBRL(item.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: "2px solid hsl(222 20% 20%)" }}>
          <span className="text-base font-bold" style={{ color: "hsl(0 0% 95%)" }}>CUSTO TOTAL MENSAL</span>
          <span className="text-xl font-bold font-display" style={{ color: "hsl(0 84% 60%)" }}>
            {formatBRL(totalCosts)}
          </span>
        </div>
      </div>

      {/* Tabela de Preços que você cobra vs custo */}
      <div className="rounded-2xl p-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(0 0% 95%)" }}>
          <Shield className="w-5 h-5" style={{ color: "hsl(42 100% 55%)" }} />
          Seus Preços Atuais vs. Mercado
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(222 20% 20%)" }}>
                <th className="text-left py-2 px-3" style={{ color: "hsl(220 9% 55%)" }}>Item</th>
                <th className="text-right py-2 px-3" style={{ color: "hsl(220 9% 55%)" }}>Seu Preço</th>
                <th className="text-right py-2 px-3" style={{ color: "hsl(220 9% 55%)" }}>Referência Mercado</th>
                <th className="text-right py-2 px-3" style={{ color: "hsl(220 9% 55%)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: "Plano Mensal", yours: "R$ 29,90", market: "R$ 49-199", status: "barato", color: "hsl(42 100% 55%)" },
                { item: "Plano Mensal (1º mês)", yours: "R$ 19,90", market: "R$ 29-49", status: "barato", color: "hsl(42 100% 55%)" },
                { item: "Plano Trimestral", yours: "R$ 79,90", market: "R$ 120-450", status: "barato", color: "hsl(42 100% 55%)" },
                { item: "Plano Anual", yours: "R$ 199,90", market: "R$ 500-1.500", status: "muito barato", color: "hsl(0 84% 60%)" },
                { item: "Taxa PIX", yours: "1,49%", market: "0,99-1,99%", status: "ok", color: "hsl(142 76% 36%)" },
                { item: "Taxa Cartão", yours: "3,49%", market: "2,99-4,99%", status: "ok", color: "hsl(142 76% 36%)" },
                { item: "Taxa NFC", yours: "2,49%", market: "1,99-3,49%", status: "ok", color: "hsl(142 76% 36%)" },
                { item: "Taxa App", yours: "0,5%", market: "1-3%", status: "barato", color: "hsl(42 100% 55%)" },
                { item: "WhatsApp (15 msgs)", yours: "R$ 4,00", market: "R$ 5-15", status: "ok", color: "hsl(142 76% 36%)" },
                { item: "SMS (15 msgs)", yours: "R$ 6,00", market: "R$ 8-20", status: "ok", color: "hsl(142 76% 36%)" },
                { item: "Comissão Afiliado 1º mês", yours: "60%", market: "20-50%", status: "alto", color: "hsl(0 84% 60%)" },
                { item: "Comissão Afiliado recorrente", yours: "20%", market: "5-20%", status: "no limite", color: "hsl(42 100% 55%)" },
              ].map((row) => (
                <tr key={row.item} style={{ borderBottom: "1px solid hsl(222 20% 22%)" }}>
                  <td className="py-2.5 px-3" style={{ color: "hsl(0 0% 90%)" }}>{row.item}</td>
                  <td className="text-right py-2.5 px-3 font-semibold" style={{ color: "hsl(0 0% 95%)" }}>{row.yours}</td>
                  <td className="text-right py-2.5 px-3" style={{ color: "hsl(220 9% 55%)" }}>{row.market}</td>
                  <td className="text-right py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" 
                      style={{ background: `${row.color}20`, color: row.color }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas e Recomendações */}
      <div className="rounded-2xl p-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(42 100% 50% / 0.3)" }}>
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "hsl(42 100% 55%)" }}>
          <AlertTriangle className="w-5 h-5" />
          Pontos de Atenção
        </h3>
        <div className="space-y-3">
          {[
            {
              level: "⚠️",
              text: "Plano Anual R$ 199,90 está MUITO abaixo do mercado. Com todas as features inclusas, considere R$ 299-399.",
            },
            {
              level: "⚠️",
              text: "Comissão de afiliado 60% no 1º mês é agressiva. Seu lucro no 1º mês de cada cliente indicado é apenas R$ 11,96.",
            },
            {
              level: "🔴",
              text: "SMS via Twilio é o maior custo variável (~R$ 0,42/msg). Com escala, considere migrar para provedor nacional (Zenvia, Infobip).",
            },
            {
              level: "✅",
              text: "ASAAS não tem custo fixo para você - as taxas são cobradas do cliente final. Bom modelo.",
            },
            {
              level: "✅",
              text: "Taxa app de 0,5% é conservadora mas garante receita recorrente que escala com o volume dos clientes.",
            },
            {
              level: "💡",
              text: "Com 50+ barbearias ativas, sua margem ultrapassa 70%. O modelo escala muito bem após os custos fixos.",
            },
          ].map((alert, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3"
              style={{ background: "hsl(222 47% 6% / 0.5)" }}>
              <span className="text-base flex-shrink-0">{alert.level}</span>
              <p className="text-sm" style={{ color: "hsl(220 9% 70%)" }}>{alert.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cenários */}
      <div className="rounded-2xl p-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
        <h3 className="font-display text-lg font-bold mb-4" style={{ color: "hsl(0 0% 95%)" }}>
          📊 Cenários de Escala
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(222 20% 20%)" }}>
                {["Cenário", "Barbearias", "Receita", "Custos", "Lucro", "Margem"].map((h) => (
                  <th key={h} className="text-right py-2 px-3 first:text-left" style={{ color: "hsl(220 9% 55%)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Início", clients: 5, revenue: 5*29.9 + 5*200*50*0.005, costs: 5 + 3.33 + 5*30*0.42 },
                { name: "Tração", clients: 20, revenue: 20*29.9 + 20*200*50*0.005, costs: 100 + 3.33 + 20*30*0.42 + 20*0.3*29.9*0.25 },
                { name: "Crescimento", clients: 50, revenue: 50*29.9 + 50*200*50*0.005, costs: 100 + 130 + 3.33 + 50*30*0.42 + 50*0.3*29.9*0.25 },
                { name: "Escala", clients: 100, revenue: 100*29.9 + 100*200*50*0.005, costs: 200 + 130 + 3.33 + 100*30*0.42 + 100*0.3*29.9*0.25 },
                { name: "Domínio", clients: 200, revenue: 200*29.9 + 200*300*50*0.005, costs: 200 + 130 + 3.33 + 200*20*0.42 + 200*0.3*29.9*0.25 },
              ].map((s) => {
                const m = s.revenue > 0 ? ((s.revenue - s.costs) / s.revenue * 100) : 0;
                return (
                  <tr key={s.name} style={{ borderBottom: "1px solid hsl(222 20% 22%)" }}>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: "hsl(0 0% 95%)" }}>{s.name}</td>
                    <td className="text-right py-2.5 px-3" style={{ color: "hsl(220 9% 70%)" }}>{s.clients}</td>
                    <td className="text-right py-2.5 px-3 font-semibold" style={{ color: "hsl(142 76% 36%)" }}>{formatBRL(s.revenue)}</td>
                    <td className="text-right py-2.5 px-3" style={{ color: "hsl(0 84% 60%)" }}>{formatBRL(s.costs)}</td>
                    <td className="text-right py-2.5 px-3 font-bold" style={{ color: s.revenue - s.costs >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)" }}>
                      {formatBRL(s.revenue - s.costs)}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          background: m >= 50 ? "hsl(142 76% 36% / 0.2)" : m >= 20 ? "hsl(42 100% 50% / 0.2)" : "hsl(0 84% 60% / 0.2)",
                          color: m >= 50 ? "hsl(142 76% 36%)" : m >= 20 ? "hsl(42 100% 55%)" : "hsl(0 84% 60%)",
                        }}>
                        {m.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostAnalysis;
