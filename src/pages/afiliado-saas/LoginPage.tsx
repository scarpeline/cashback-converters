import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, EyeOff, Loader2, TrendingUp, Users, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getDashboardForRole } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { formatWhatsAppBR, formatCpfCnpjBR } from "@/lib/input-masks";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  pix: z.string().min(5, "Chave PIX inválida"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const AfiliadoSaasLoginPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
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
    password: ""
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      navigate(getDashboardForRole(role), { replace: true });
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const validateForm = () => {
    setErrors({});
    
    try {
      if (mode === "login") {
        loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });
      } else {
        signupSchema.parse(formData);
        
        if (!antiFraudAccepted) {
          toast.error("Você deve aceitar as regras anti-fraude para continuar.");
          return false;
        }
      }
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
      if (mode === "login") {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          const msg = error.message || "Erro ao fazer login";
          if (msg.toLowerCase().includes("email not confirmed")) {
            toast.error("Confirme seu e-mail antes de entrar.");
          } else if (msg.toLowerCase().includes("invalid login credentials")) {
            toast.error("Credenciais inválidas. Verifique e-mail e senha.");
          } else {
            toast.error(msg);
          }
          setLoading(false);
          return;
        }
        
        toast.success("Login realizado com sucesso!");
        
        // Hard redirect - most reliable
        setTimeout(() => {
          window.location.href = "/afiliado-saas";
        }, 500);
        return; // Don't setLoading(false) - page will redirect
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          whatsapp: formData.whatsapp,
          role: 'afiliado_saas',
          cpf_cnpj: formData.cpfCnpj,
          pix_key: formData.pix,
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este e-mail já está cadastrado. Faça login.");
          } else {
            toast.error(error.message || "Erro ao criar conta");
          }
          setLoading(false);
          return;
        }

        toast.success("Conta criada! Verifique seu e-mail para confirmar e depois faça login.");
        setMode("login");
      }
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-card items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-lg">
          <img src={logo} alt="SalãoCashBack" className="w-20 h-20 mb-8" />
          
          <h2 className="font-display text-3xl font-bold mb-6">
            Ganhe dinheiro indicando{" "}
            <span className="text-gradient-gold">barbearias</span>
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Comissão Generosa</h3>
                <p className="text-muted-foreground text-sm">
                  Ganhe na primeira mensalidade e nas recorrentes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Rede de Sub-afiliados</h3>
                <p className="text-muted-foreground text-sm">
                  Indique outros afiliados e ganhe sobre eles também.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ganhos Escaláveis</h3>
                <p className="text-muted-foreground text-sm">
                  Quanto mais indicações ativas, maior seu ganho recorrente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>

          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={logo} alt="SalãoCashBack" className="w-12 h-12" />
            <span className="font-display font-bold text-xl text-gradient-gold">
              Afiliado SaaS
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-bold mb-2">
            {mode === "login" ? "Acesse seu painel" : "Torne-se um Afiliado"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === "login" 
              ? "Entre com sua conta de afiliado" 
              : "Crie sua conta e comece a ganhar"}
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-lg bg-muted mb-6">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {mode === "signup" && (
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
            )}

            {/* Email */}
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

            {/* WhatsApp (signup only) */}
            {mode === "signup" && (
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsAppBR(e.target.value) })}
                  className={`mt-1 ${errors.whatsapp ? "border-destructive" : ""}`}
                  autoComplete="tel"
                />
                {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
              </div>
            )}

            {/* CPF/CNPJ (signup only) */}
            {mode === "signup" && (
              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpjBR(e.target.value) })}
                  className={`mt-1 ${errors.cpfCnpj ? "border-destructive" : ""}`}
                  autoComplete="off"
                />
                {errors.cpfCnpj && <p className="text-xs text-destructive mt-1">{errors.cpfCnpj}</p>}
              </div>
            )}

            {/* PIX (signup only) */}
            {mode === "signup" && (
              <div>
                <Label htmlFor="pix">Chave PIX (para recebimento)</Label>
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
            )}

            {/* Password */}
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

            {/* Anti-fraud Agreement (signup only) */}
            {mode === "signup" && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Regras Anti-Fraude</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      É proibido utilizar o próprio link de afiliado para cadastro próprio.
                      Essa prática pode resultar em bloqueio da conta e perda total das comissões.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="antifraud"
                    checked={antiFraudAccepted}
                    onCheckedChange={(checked) => setAntiFraudAccepted(checked === true)}
                  />
                  <label htmlFor="antifraud" className="text-sm cursor-pointer">
                    Li e aceito as regras anti-fraude
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="gold" 
              className="w-full" 
              size="lg"
              disabled={loading || (mode === "signup" && !antiFraudAccepted)}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "login" ? "Entrar" : "Criar Conta de Afiliado"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Não é afiliado? <span className="underline">Acesse a área geral</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AfiliadoSaasLoginPage;
