import { useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LayoutDashboard,
  Calendar, 
  Users, 
  Scissors,
  DollarSign,
  Package,
  Gift,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
  MessageCircle,
  Image,
  Plus,
  CheckCircle,
  Clock,
  ChevronRight,
  Phone
} from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

const DonoDashboard = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const basePath = "/painel-dono";
  
  const navigation = [
    { name: "Dashboard", href: basePath, icon: LayoutDashboard },
    { name: "Agendamentos", href: `${basePath}/agendamentos`, icon: Calendar },
    { name: "Profissionais", href: `${basePath}/profissionais`, icon: Users },
    { name: "Serviços", href: `${basePath}/servicos`, icon: Scissors },
    { name: "Financeiro", href: `${basePath}/financeiro`, icon: DollarSign },
    { name: "Estoque", href: `${basePath}/estoque`, icon: Package },
    { name: "Cashback", href: `${basePath}/cashback`, icon: Gift },
    { name: "Pixels & Marketing", href: `${basePath}/pixels`, icon: Image },
    { name: "Suporte", href: `${basePath}/suporte`, icon: MessageCircle },
    { name: "Configurações", href: `${basePath}/configuracoes`, icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === basePath) return location.pathname === basePath || location.pathname === `${basePath}/`;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to={basePath} className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-display font-bold text-lg text-gradient-gold">
                Painel Dono
              </span>
            </Link>
            <button 
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-border">
            <p className="font-medium truncate">{profile?.name || "Dono"}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive(item.href) 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button 
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => toast.info("Nenhuma notificação.")}>
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="agendamentos" element={<AgendamentosPage />} />
            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="servicos" element={<ServicosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="cashback" element={<CashbackPage />} />
            <Route path="pixels" element={<PixelsPage />} />
            <Route path="suporte" element={<SuportePage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Alert: Barbearia configurada */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Barbearia Teste configurada</p>
            <p className="text-xs text-muted-foreground">2 serviços disponíveis • 1 profissional vinculado</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Faturamento Hoje</CardDescription>
            <CardTitle className="text-2xl text-gradient-gold">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 0% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Agendamentos Hoje</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">0 confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Clientes Ativos</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Cashback Distribuído</CardDescription>
            <CardTitle className="text-2xl">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/painel-dono/profissionais")}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Gerenciar Profissionais</CardTitle>
            <CardDescription>Adicionar ou editar profissionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-primary gap-1">Ver profissionais <ChevronRight className="w-4 h-4" /></div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/painel-dono/servicos")}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Gerenciar Serviços</CardTitle>
            <CardDescription>Criar e editar serviços</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-primary gap-1">Ver serviços <ChevronRight className="w-4 h-4" /></div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/painel-dono/agendamentos")}>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Ver Agendamentos</CardTitle>
            <CardDescription>Gerenciar agenda do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-primary gap-1">Ver agenda <ChevronRight className="w-4 h-4" /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link de Agendamento</CardTitle>
          <CardDescription>Compartilhe com seus clientes</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <code className="flex-1 p-3 bg-muted rounded-lg text-sm truncate">
            salao.app/b/barbearia-teste
          </code>
          <Button variant="outline" onClick={() => {
            navigator.clipboard?.writeText("salao.app/b/barbearia-teste");
            toast.success("Link copiado!");
          }}>Copiar</Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AgendamentosPage = () => {
  const [tab, setTab] = useState("hoje");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Agendamentos</h1>
        <Button variant="gold" onClick={() => toast.info("Novo agendamento manual em breve!")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <div className="flex gap-2">
        {[
          { id: "hoje", label: "Hoje" },
          { id: "semana", label: "Esta Semana" },
          { id: "todos", label: "Todos" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum agendamento para {tab === "hoje" ? "hoje" : "este período"}.</p>
          <p className="text-sm text-muted-foreground mt-2">Os agendamentos dos clientes aparecerão aqui em tempo real.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const ProfissionaisPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", commission: "60" });

  const handleAdd = () => {
    if (!form.name || !form.email) {
      toast.error("Preencha nome e email.");
      return;
    }
    toast.success(`Profissional "${form.name}" cadastrado! (Simulação)`);
    setShowForm(false);
    setForm({ name: "", email: "", whatsapp: "", commission: "60" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profissionais</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Novo Profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={form.commission}
                  onChange={(e) => setForm({ ...form, commission: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdd}>Salvar Profissional</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profissional de teste */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Profissional Teste</p>
            <p className="text-sm text-muted-foreground">profissional.teste@salao.app</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">Ativo • 60%</span>
            <Button variant="outline" size="sm" onClick={() => toast.info("Edição de profissional em breve!")}>Editar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ServicosPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "30", description: "" });
  
  const mockServices = [
    { name: "Corte Masculino", price: 45, duration: 30 },
    { name: "Barba", price: 25, duration: 20 },
  ];

  const handleAdd = () => {
    if (!form.name || !form.price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    toast.success(`Serviço "${form.name}" criado! (Simulação)`);
    setShowForm(false);
    setForm({ name: "", price: "", duration: "30", description: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Serviços</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Serviço
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Serviço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Ex: Corte Masculino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input type="number" placeholder="45.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" placeholder="30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input placeholder="Descrição do serviço" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdd}>Salvar Serviço</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {mockServices.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="font-medium text-primary">R$ {s.price},00</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" /> {s.duration} min
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info("Edição em breve!")}>Editar</Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => toast.success(`"${s.name}" desativado! (Simulação)`)}>Desativar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const FinanceiroPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Financeiro</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardDescription>Saldo Disponível</CardDescription>
          <CardTitle className="text-3xl text-gradient-gold">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="gold" size="sm" className="w-full" onClick={() => toast.info("Saque via PIX em breve!")}>
            Sacar via PIX
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>A Receber</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Pagamentos pendentes de confirmação</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Faturamento do Mês</CardDescription>
          <CardTitle className="text-2xl">R$ 0,00</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Após taxas e comissões</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent className="text-center py-8">
        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
      </CardContent>
    </Card>
  </div>
);

const EstoquePage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", quantity: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Estoque</h1>
        <Button variant="gold" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Novo Produto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input placeholder="Ex: Pomada Modeladora" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" placeholder="25.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="gold" onClick={() => { toast.success(`"${form.name}" adicionado! (Simulação)`); setShowForm(false); }}>Salvar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum produto no estoque.</p>
          <p className="text-sm text-muted-foreground mt-2">Adicione produtos que você vende na barbearia.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const CashbackPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Configurar Cashback</h1>
    <Card>
      <CardHeader>
        <CardTitle>Regras de Cashback</CardTitle>
        <CardDescription>Defina quanto seus clientes ganham de volta em cada serviço</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Cashback por serviço</p>
            <p className="text-3xl font-bold text-gradient-gold">5%</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Total distribuído</p>
            <p className="text-3xl font-bold">R$ 0,00</p>
          </div>
        </div>
        <Button variant="gold" className="w-full" onClick={() => toast.info("Configuração de cashback em breve!")}>
          Editar Regras
        </Button>
      </CardContent>
    </Card>
  </div>
);

const PixelsPage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Pixels & Marketing</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { name: "Meta Pixel", desc: "Facebook e Instagram", icon: "📘" },
        { name: "Google Ads", desc: "Google Tag Manager", icon: "🔍" },
        { name: "TikTok Pixel", desc: "TikTok Ads", icon: "🎵" },
      ].map((p) => (
        <Card key={p.name}>
          <CardHeader>
            <div className="text-2xl mb-1">{p.icon}</div>
            <CardTitle className="text-lg">{p.name}</CardTitle>
            <CardDescription>{p.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => toast.info(`Configurar ${p.name}: em breve!`)}>
              Configurar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const SuportePage = () => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold">Suporte</h1>
    <Card>
      <CardHeader>
        <CardTitle>Falar com Suporte</CardTitle>
        <CardDescription>Nossa equipe está disponível de seg-sex, 9h às 18h</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="gold" className="w-full" onClick={() => toast.info("Chat de suporte em breve!")}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Iniciar Conversa
        </Button>
        <Button variant="outline" className="w-full" onClick={() => window.open("https://wa.me/5511999990000", "_blank")}>
          <Phone className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </CardContent>
    </Card>
  </div>
);

const ConfiguracoesPage = () => {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Barbearia</CardTitle>
            <CardDescription>Nome, endereço, telefone e logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Nome da barbearia</p>
              <p className="font-medium">Barbearia Teste</p>
            </div>
            <Button variant="outline" onClick={() => toast.info("Edição de dados em breve!")}>Editar</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Horário de Funcionamento</CardTitle>
            <CardDescription>Configure os dias e horários de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => toast.info("Configuração de horários em breve!")}>Configurar</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-lg mb-3">
              <p className="text-xs text-muted-foreground">Plano</p>
              <p className="font-bold text-gradient-gold">Trial Gratuito</p>
            </div>
            <Button variant="gold" onClick={() => toast.info("Upgrade de plano em breve!")}>Fazer Upgrade</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonoDashboard;
