import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Loader2, DollarSign, Users, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getRedirectPath } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  pix: z.string().min(1, "Chave PIX obrigatória"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  antiFraudAccepted: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

const AffiliateSaasPage = () => {
  const navigate = useNavigate();
  const { user, signUp, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<"landing" | "signup" | "login">("landing");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [antiFraudAccepted, setAntiFraudAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    cpfCnpj: "",
    pix: "",
    password: "",
  });

  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      navigate(getRedirectPath(role));
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const validateForm = () => {
    setErrors({});
    try {
      signupSchema.parse({ ...formData, antiFraudAccepted });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        whatsapp: formData.whatsapp,
        role: 'afiliado_saas',
        cpf_cnpj: formData.cpfCnpj,
        pix_key: formData.pix,
      });

      if (error) {
        toast.error(error.message || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "60% na primeira mensalidade",
      description: "Ganhe comissão alta em cada novo cliente que você trazer"
    },
    {
      icon: TrendingUp,
      title: "20% recorrente",
      description: "Continue ganhando enquanto seu indicado usar a plataforma"
    },
    {
      icon: Users,
      title: "10% sobre taxa SaaS",
      description: "Ganhe sobre cada transação processada"
    },
    {
      icon: Shield,
      title: "Sub-afiliados",
      description: "Monte sua própria rede e ganhe 10% sobre seus indicados"
    },
  ];

  const simulationData = {
    businesses: 20,
    monthlyEarnings: "R$ 850,00",
    yearlyEarnings: "R$ 10.200,00",
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Landing Page
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 py-4 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="SalãoCashBack" className="w-10 h-10" />
              <span className="font-display font-bold text-xl text-gradient-gold">
                SalãoCashBack
              </span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setMode("login")}>
              Já sou afiliado
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ganhe dinheiro indicando{" "}
              <span className="text-gradient-gold">barbearias e salões</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Seja um afiliado do SalãoCashBack e ganhe comissões recorrentes 
              enquanto ajuda negócios a crescerem no automático.
            </p>
            <Button variant="gold" size="lg" onClick={() => setMode("signup")}>
              Quero ser afiliado agora
            </Button>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="font-display text-3xl font-bold text-center mb-12">
              Como você ganha
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-card border-border/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Simulation */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Simulação de Ganhos</CardTitle>
                <CardDescription>
                  Com apenas {simulationData.businesses} empresas ativas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground">Ganho Mensal</p>
                    <p className="text-2xl font-bold text-gradient-gold">{simulationData.monthlyEarnings}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground">Ganho Anual</p>
                    <p className="text-2xl font-bold text-gradient-gold">{simulationData.yearlyEarnings}</p>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Seus ganhos crescem conforme a plataforma cresce. Sem limite teórico.
                </p>
                <Button variant="gold" className="w-full" onClick={() => setMode("signup")}>
                  Começar agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Anti-Fraud Warning */}
        <section className="py-12 px-4 bg-destructive/5">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-start gap-4 p-6 rounded-lg border border-destructive/20 bg-background">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Aviso Importante</h3>
                <p className="text-sm text-muted-foreground">
                  É proibido utilizar o próprio link de afiliado para realizar cadastro próprio.
                  Essa prática caracteriza tentativa de burla e pode resultar em bloqueio da conta 
                  e perda total das comissões. O sistema possui auditoria automática e detecção 
                  de autoafiliação.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="font-display text-3xl font-bold mb-6">
              Pronto para começar a ganhar?
            </h2>
            <Button variant="gold" size="lg" onClick={() => setMode("signup")}>
              Criar minha conta de afiliado
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Signup/Login Form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button 
          onClick={() => setMode("landing")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="SalãoCashBack" className="w-12 h-12" />
          <span className="font-display font-bold text-2xl text-gradient-gold">
            Afiliado SaaS
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold mb-2">
          {mode === "signup" ? "Crie sua conta de afiliado" : "Acesse sua conta"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {mode === "signup" 
            ? "Preencha seus dados para começar a ganhar" 
            : "Entre para ver seus ganhos"}
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 rounded-lg bg-muted mb-8">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === "login" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              mode === "signup" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className={`mt-1 ${errors.whatsapp ? "border-destructive" : ""}`}
                />
                {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
              </div>

              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  className={`mt-1 ${errors.cpfCnpj ? "border-destructive" : ""}`}
                />
                {errors.cpfCnpj && <p className="text-xs text-destructive mt-1">{errors.cpfCnpj}</p>}
              </div>

              <div>
                <Label htmlFor="pix">Chave PIX (para receber comissões)</Label>
                <Input
                  id="pix"
                  type="text"
                  placeholder="CPF, e-mail ou chave aleatória"
                  value={formData.pix}
                  onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  className={`mt-1 ${errors.pix ? "border-destructive" : ""}`}
                />
                {errors.pix && <p className="text-xs text-destructive mt-1">{errors.pix}</p>}
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`mt-1 ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>

          {mode === "signup" && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="antiFraud"
                  checked={antiFraudAccepted}
                  onCheckedChange={(checked) => setAntiFraudAccepted(checked as boolean)}
                />
                <label htmlFor="antiFraud" className="text-sm leading-relaxed cursor-pointer">
                  Declaro que li e aceito que é proibido utilizar o próprio link de afiliado 
                  para cadastro próprio. Estou ciente de que essa prática pode resultar em 
                  bloqueio da conta e perda total das comissões.
                </label>
              </div>
              {errors.antiFraudAccepted && (
                <p className="text-xs text-destructive mt-2">{errors.antiFraudAccepted}</p>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            variant="gold" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mode === "signup" ? "Criar Conta de Afiliado" : "Entrar"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Sua conta ASAAS será criada automaticamente para receber comissões.
        </p>
      </div>
    </div>
  );
};

export default AffiliateSaasPage;
