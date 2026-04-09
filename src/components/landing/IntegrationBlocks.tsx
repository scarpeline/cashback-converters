import {
  Rocket, Gift, Target, Zap, CreditCard, MessageSquare, BarChart3, Shield, CheckCircle
} from "lucide-react";

const highlights = [
  { icon: Rocket, title: "Crescimento Automático", description: "Novos agendamentos feitos enquanto você dorme. Clientes indicando amigos automaticamente.", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Gift, title: "Cashback que Fideliza", description: "Cliente acumula crédito e precisa voltar para usar. Fidelização sem esforço.", color: "text-pink-500", bg: "bg-pink-50" },
  { icon: Target, title: "Marketing de Indicação", description: "Cada cliente vira vendedor. Indicou, ganhou comissão. Sem gastar com anúncios.", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: Zap, title: "Split Automático", description: "Pagamento entra e divide sozinho. Comissões no PIX de cada um. Zero planilha.", color: "text-green-500", bg: "bg-green-50" },
];

const integrations = [
  { icon: CreditCard, title: "Pagamentos", description: "PIX, crédito e débito via ASAAS", status: "Ativo", color: "text-green-500", bg: "bg-green-50" },
  { icon: MessageSquare, title: "WhatsApp", description: "Automação de mensagens e lembretes", status: "Ativo", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: BarChart3, title: "Analytics", description: "Pixels e tracking para anúncios", status: "Ativo", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: Shield, title: "Fiscal", description: "Emissão de notas fiscais", status: "Em breve", color: "text-slate-500", bg: "bg-slate-100" },
];

const IntegrationBlocks = () => {
  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="container mx-auto">
        {/* Highlights */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-sm font-medium text-orange-600 mb-6">
            Diferenciais
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Transformamos clientes em <span className="text-orange-500">máquina de indicações</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {highlights.map((item) => (
            <div key={item.title} className="group p-5 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-sm font-medium text-blue-600 mb-6">
            Integrações
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            APIs e integrações <span className="text-orange-500">prontas</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((item) => (
            <div key={item.title} className="group p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'Ativo' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationBlocks;
