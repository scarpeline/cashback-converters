import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2, User, Scissors, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole, getDashboardForRole } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import logo from "@/assets/logo.png";
import { z } from "zod";

type UserType = "cliente" | "dono";
type LoginType = "cliente" | "profissional" | "dono";

const loginSchema = z.object({
  identifier: z.string().min(5, "Campo obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  cpfCnpj: z.string().optional(),
  pix: z.string().optional(),
});

const PublicLoginPage = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithWhatsApp, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [userType, setUserType] = useState<UserType>("cliente");
  const [loginType, setLoginType] = useState<LoginType>("cliente");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    password: "",
    cpfCnpj: "",
    pix: ""
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      navigate(getDashboardForRole(role), { replace: true });
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const isBusinessUser = userType === "dono";

  const validateForm = () => {
    setErrors({});
    
    try {
      if (mode === "login") {
        loginSchema.parse({
          identifier: loginType === "cliente" ? formData.whatsapp : formData.email,
          password: formData.password,
        });
      } else {
        const dataToValidate: Record<string, string> = {
          name: formData.name,
          whatsapp: formData.whatsapp,
          password: formData.password,
        };
        
        if (isBusinessUser) {
          dataToValidate.email = formData.email;
        }
        
        signupSchema.parse(dataToValidate);
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
        let result;
        
        if (loginType === "cliente") {
          // Cliente logs in with WhatsApp
          result = await signInWithWhatsApp(formData.whatsapp, formData.password);
        } else {
          // Profissional and Dono log in with email
          result = await signIn(formData.email, formData.password);
        }
        
        if (result.error) {
          const msg = result.error.message || "Erro ao fazer login";
          if (msg.toLowerCase().includes("email not confirmed")) {
            toast.error("Confirme seu e-mail antes de entrar.");
          } else if (msg.toLowerCase().includes("invalid login credentials")) {
            toast.error("Credenciais inválidas. Verifique seus dados.");
          } else {
            toast.error(msg);
          }
          setLoading(false);
          return;
        }
        
        toast.success("Login realizado com sucesso!");
      } else {
        // Signup - email is required for business users
        const email = isBusinessUser 
          ? formData.email 
          : `${formData.whatsapp.replace(/\D/g, '')}@salao.app`;
        
        const { error } = await signUp(email, formData.password, {
          name: formData.name,
          whatsapp: formData.whatsapp,
          role: userType as AppRole,
          cpf_cnpj: isBusinessUser ? formData.cpfCnpj : undefined,
          pix_key: isBusinessUser ? formData.pix : undefined,
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
        setLoginType(userType === "dono" ? "dono" : "cliente");
        return;
      }
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const userTypes: { value: UserType; label: string; description: string; icon: React.ElementType }[] = [
    { value: "cliente", label: "Sou Cliente", description: "Agendar serviços e ganhar cashback", icon: User },
    { value: "dono", label: "Sou Dono de Barbearia", description: "Gerenciar meu negócio", icon: Store },
  ];

  const loginTypes: { value: LoginType; label: string; icon: React.ElementType }[] = [
    { value: "cliente", label: "Sou Cliente", icon: User },
    { value: "profissional", label: "Sou Profissional", icon: Scissors },
    { value: "dono", label: "Sou Dono de Barbearia", icon: Store },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="SalãoCashBack" className="w-12 h-12" />
            <span className="font-display font-bold text-2xl text-gradient-gold">
              SalãoCashBack
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-bold mb-2">
            {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === "login" 
              ? "Entre para acessar sua conta" 
              : "Preencha os dados para começar"}
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

          {/* Login Type Selection (only for login) */}
          {mode === "login" && (
            <div className="mb-6">
              <Label className="mb-3 block">Como você quer entrar?</Label>
              <div className="grid grid-cols-3 gap-2">
                {loginTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setLoginType(type.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      loginType === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <type.icon className={`w-5 h-5 mx-auto mb-1 ${loginType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium block ${loginType === type.value ? "text-primary" : "text-muted-foreground"}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Type Selection (only for signup) */}
          {mode === "signup" && (
            <div className="mb-6">
              <Label className="mb-3 block">Tipo de Conta</Label>
              <div className="grid grid-cols-1 gap-3">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className={`p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      userType === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`font-medium block ${userType === type.value ? "text-primary" : ""}`}>
                        {type.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{type.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Profissionais são cadastrados pelo dono. Afiliados têm página própria.
              </p>
            </div>
          )}

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

            {/* WhatsApp - show for signup or login as cliente */}
            {(mode === "signup" || loginType === "cliente") && (
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsAppBR(e.target.value) })}
                  className={`mt-1 ${errors.whatsapp || errors.identifier ? "border-destructive" : ""}`}
                />
                {(errors.whatsapp || errors.identifier) && (
                  <p className="text-xs text-destructive mt-1">{errors.whatsapp || errors.identifier}</p>
                )}
              </div>
            )}

            {/* Email - show for signup business users or login as profissional/dono */}
            {((mode === "signup" && isBusinessUser) || (mode === "login" && loginType !== "cliente")) && (
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 ${errors.email || errors.identifier ? "border-destructive" : ""}`}
                />
                {(errors.email || errors.identifier) && (
                  <p className="text-xs text-destructive mt-1">{errors.email || errors.identifier}</p>
                )}
              </div>
            )}

            {/* CPF/CNPJ (business users signup only) */}
            {mode === "signup" && isBusinessUser && (
              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpjBR(e.target.value) })}
                  className="mt-1"
                />
              </div>
            )}

            {/* PIX (business users signup only) */}
            {mode === "signup" && isBusinessUser && (
              <div>
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  type="text"
                  placeholder="CPF, e-mail ou chave aleatória"
                  value={formData.pix}
                  onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  className="mt-1"
                />
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

            {/* Forgot Password (login only) */}
            {mode === "login" && (
              <div className="text-right">
                <button type="button" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="gold" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          {/* Info for business users */}
          {mode === "signup" && isBusinessUser && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Sua conta ASAAS será criada automaticamente para receber pagamentos.
            </p>
          )}

          {/* Test Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-foreground mb-2">🧪 Credenciais de Teste:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">👤 Cliente:</span> WhatsApp: 11999990001 | Senha: Teste@123</p>
              <p><span className="font-medium text-foreground">🏪 Dono:</span> Email: dono.teste@salao.app | Senha: Teste@123</p>
              <p><span className="font-medium text-foreground">✂️ Profissional:</span> Email: profissional.teste@salao.app | Senha: Teste@123</p>
              <p><span className="font-medium text-foreground">🤝 Afiliado:</span> <Link to="/afiliado-saas/login" className="underline text-primary">Acessar login afiliado</Link></p>
              <p><span className="font-medium text-foreground">📊 Contador:</span> <Link to="/contador2026/login" className="underline text-primary">Acessar login contador</Link></p>
              <p><span className="font-medium text-foreground">🛡️ Admin:</span> <Link to="/admin/login" className="underline text-primary">Acessar login admin</Link></p>
            </div>
          </div>

          {/* Affiliate Link */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <Link 
              to="/afiliado-saas/login" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Quer ser afiliado do SaaS? <span className="underline">Clique aqui</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-card items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative text-center max-w-lg">
          <img 
            src={logo} 
            alt="SalãoCashBack" 
            className="w-64 h-64 mx-auto mb-8 animate-float drop-shadow-2xl"
          />
          <h2 className="font-display text-3xl font-bold mb-4">
            Eleve sua empresa ao{" "}
            <span className="text-gradient-gold">próximo nível</span>
          </h2>
          <p className="text-muted-foreground">
            Automatize vendas, agendamentos e pagamentos. 
            Foque no que importa: seu cliente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicLoginPage;
