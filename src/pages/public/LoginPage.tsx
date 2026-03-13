import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2, User, Scissors, Store, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole, getDashboardForRole } from "@/lib/auth";
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
  const {
    user, signUp, signIn, signInWithWhatsApp,
    getPrimaryRole, roles, loading: authLoading,
    authResolved, sendPasswordResetEmail
  } = useAuth();

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

  // Redirect if already logged in AND roles loaded
  useEffect(() => {
    if (!user || !authResolved || roles.length === 0) return;
    
    const role = getPrimaryRole();
    if (!role) return;

    // Check if user selected a plan from pricing
    const selectedPlan = localStorage.getItem("selected_plan");
    if (selectedPlan && role === "dono") {
      try {
        const plan = JSON.parse(selectedPlan);
        localStorage.removeItem("selected_plan");
        if (plan.checkoutUrl) {
          window.location.href = plan.checkoutUrl;
          return;
        }
      } catch { /* ignore */ }
    }
    localStorage.removeItem("selected_plan");

    const dashboardUrl = getDashboardForRole(role);
    if (dashboardUrl) {
      navigate(dashboardUrl, { replace: true });
    }
  }, [user, authResolved, roles, getPrimaryRole, navigate]);

  // Failsafe: libera botão assim que auth/roles resolverem
  useEffect(() => {
    if (loading && user && authResolved && roles.length > 0) {
      setLoading(false);
    }
  }, [loading, user, authResolved, roles]);

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
          result = await signInWithWhatsApp(formData.whatsapp, formData.password);
        } else {
          result = await signIn(formData.email, formData.password);
        }

        if (result.error) {
          const msg = result.error.message || "Erro ao fazer login";
          if (msg.toLowerCase().includes("email not confirmed")) {
            toast.error("Confirme seu e-mail antes de entrar.");
          } else if (msg.toLowerCase().includes("invalid login credentials")) {
            toast.error("Credenciais inválidas. Verifique seus dados.");
          } else {
            toast.error("Erro ao fazer login. Tente novamente.");
          }
          setLoading(false);
          return;
        }

        toast.success("Login realizado com sucesso!");
        setTimeout(() => setLoading(false), 3000);
        return;
      } else {
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
            toast.error("Erro ao criar conta. Tente novamente.");
          }
          setLoading(false);
          return;
        }

        if (isBusinessUser) {
          toast.success("Conta criada! Abrindo a Asaas para configurar seus pagamentos...");
          setTimeout(() => {
            window.open("https://www.asaas.com/r/4095742a-0dd1-4fb7-b9ce-61431bb4f632", "_blank", "noopener,noreferrer");
          }, 1000);
          setTimeout(() => setMode("login"), 1500);
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar e depois faça login.");
          setMode("login");
        }
        setLoginType(userType === "dono" ? "dono" : "cliente");
        return;
      }
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "linear-gradient(180deg, hsl(222 47% 6%) 0%, hsl(222 30% 12%) 100%)" }}>
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-colors mb-8"
            style={{ color: "hsl(220 9% 55%)" }}
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
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(0 0% 98%)" }}>
            {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="mb-8" style={{ color: "hsl(220 9% 60%)" }}>
            {mode === "login"
              ? "Entre para acessar sua conta"
              : "Preencha os dados para começar"}
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-lg mb-6" style={{ background: "hsl(222 30% 12%)", border: "1px solid hsl(222 20% 18%)" }}>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === "login"
                ? "bg-gradient-gold shadow-sm"
                : ""
                }`}
              style={mode === "login" ? { color: "hsl(222 47% 11%)" } : { color: "hsl(220 9% 55%)" }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${mode === "signup"
                ? "bg-gradient-gold shadow-sm"
                : ""
                }`}
              style={mode === "signup" ? { color: "hsl(222 47% 11%)" } : { color: "hsl(220 9% 55%)" }}
            >
              Criar Conta
            </button>
          </div>

          {/* Login Type Selection (only for login) */}
          {mode === "login" && (
            <div className="mb-6">
              <Label className="mb-3 block" style={{ color: "hsl(220 9% 70%)" }}>Como você quer entrar?</Label>
              <div className="grid grid-cols-3 gap-2">
                {loginTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setLoginType(type.value)}
                    className="p-3 rounded-lg text-center transition-all"
                    style={{
                      background: loginType === type.value ? "hsl(42 100% 50% / 0.1)" : "hsl(222 30% 12%)",
                      border: loginType === type.value ? "1px solid hsl(42 100% 50% / 0.4)" : "1px solid hsl(222 20% 18%)",
                    }}
                  >
                    <type.icon className="w-5 h-5 mx-auto mb-1" style={{ color: loginType === type.value ? "hsl(42 100% 55%)" : "hsl(220 9% 50%)" }} />
                    <span className="text-xs font-medium block" style={{ color: loginType === type.value ? "hsl(42 100% 55%)" : "hsl(220 9% 50%)" }}>
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
              <Label className="mb-3 block" style={{ color: "hsl(220 9% 70%)" }}>Tipo de Conta</Label>
              <div className="grid grid-cols-1 gap-3">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className="p-4 rounded-lg text-left transition-all flex items-center gap-3"
                    style={{
                      background: userType === type.value ? "hsl(42 100% 50% / 0.08)" : "hsl(222 30% 12%)",
                      border: userType === type.value ? "1px solid hsl(42 100% 50% / 0.3)" : "1px solid hsl(222 20% 18%)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: userType === type.value ? "hsl(42 100% 50% / 0.15)" : "hsl(222 30% 15%)" }}>
                      <type.icon className="w-5 h-5" style={{ color: userType === type.value ? "hsl(42 100% 55%)" : "hsl(220 9% 50%)" }} />
                    </div>
                    <div>
                      <span className="font-medium block" style={{ color: userType === type.value ? "hsl(42 100% 55%)" : "hsl(0 0% 90%)" }}>
                        {type.label}
                      </span>
                      <span className="text-sm" style={{ color: "hsl(220 9% 55%)" }}>{type.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "hsl(220 9% 50%)" }}>
                Profissionais são cadastrados pelo dono. Afiliados têm página própria.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div>
                <Label htmlFor="name" style={{ color: "hsl(220 9% 70%)" }}>Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 bg-transparent text-white placeholder:text-white/30 ${errors.name ? "border-destructive" : ""}`}
                  style={{ borderColor: errors.name ? undefined : "hsl(222 20% 22%)" }}
                  autoComplete="name"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
            )}

            {/* WhatsApp */}
            {(mode === "signup" || loginType === "cliente") && (
              <div>
                <Label htmlFor="whatsapp" style={{ color: "hsl(220 9% 70%)" }}>WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsAppBR(e.target.value) })}
                  className={`mt-1 bg-transparent text-white placeholder:text-white/30 ${errors.whatsapp || errors.identifier ? "border-destructive" : ""}`}
                  style={{ borderColor: (errors.whatsapp || errors.identifier) ? undefined : "hsl(222 20% 22%)" }}
                  autoComplete="tel"
                />
                {(errors.whatsapp || errors.identifier) && (
                  <p className="text-xs text-destructive mt-1">{errors.whatsapp || errors.identifier}</p>
                )}
              </div>
            )}

            {/* Email */}
            {((mode === "signup" && isBusinessUser) || (mode === "login" && loginType !== "cliente")) && (
              <div>
                <Label htmlFor="email" style={{ color: "hsl(220 9% 70%)" }}>E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`mt-1 bg-transparent text-white placeholder:text-white/30 ${errors.email || errors.identifier ? "border-destructive" : ""}`}
                  style={{ borderColor: (errors.email || errors.identifier) ? undefined : "hsl(222 20% 22%)" }}
                  autoComplete="email"
                />
                {(errors.email || errors.identifier) && (
                  <p className="text-xs text-destructive mt-1">{errors.email || errors.identifier}</p>
                )}
              </div>
            )}

            {/* CPF/CNPJ */}
            {mode === "signup" && isBusinessUser && (
              <div>
                <Label htmlFor="cpfCnpj" style={{ color: "hsl(220 9% 70%)" }}>CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpjBR(e.target.value) })}
                  className="mt-1 bg-transparent text-white placeholder:text-white/30"
                  style={{ borderColor: "hsl(222 20% 22%)" }}
                  autoComplete="off"
                />
              </div>
            )}

            {/* PIX */}
            {mode === "signup" && isBusinessUser && (
              <div>
                <Label htmlFor="pix" style={{ color: "hsl(220 9% 70%)" }}>Chave PIX</Label>
                <Input
                  id="pix"
                  type="text"
                  placeholder="CPF, e-mail ou chave aleatória"
                  value={formData.pix}
                  onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  className="mt-1 bg-transparent text-white placeholder:text-white/30"
                  style={{ borderColor: "hsl(222 20% 22%)" }}
                  autoComplete="off"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <Label htmlFor="password" style={{ color: "hsl(220 9% 70%)" }}>Senha</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`pr-10 bg-transparent text-white placeholder:text-white/30 ${errors.password ? "border-destructive" : ""}`}
                  style={{ borderColor: errors.password ? undefined : "hsl(222 20% 22%)" }}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(220 9% 50%)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            {/* Forgot Password (login only) */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={async () => {
                    const identifier = loginType === "cliente" ? formData.whatsapp : formData.email;
                    let targetEmail = "";

                    if (loginType === "cliente") {
                      if (!formData.whatsapp || formData.whatsapp.length < 10) {
                        toast.error("Insira seu WhatsApp primeiro para localizarmos sua conta.");
                        return;
                      }
                      setLoading(true);
                      const norm = formData.whatsapp.replace(/\D/g, '');
                      const { data } = await supabase.rpc("get_email_by_whatsapp", { _whatsapp: norm });
                      setLoading(false);
                      if (!data) {
                        toast.error("Conta não encontrada com este WhatsApp.");
                        return;
                      }
                      targetEmail = data;
                    } else {
                      if (!formData.email || !formData.email.includes("@")) {
                        toast.error("Insira seu e-mail de cadastro primeiro.");
                        return;
                      }
                      targetEmail = formData.email;
                    }

                    if (targetEmail) {
                      const { error } = await sendPasswordResetEmail(targetEmail);
                      if (error) {
                        toast.error("Erro ao enviar e-mail: " + error.message);
                      } else {
                        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
                      }
                    }
                  }}
                  disabled={loading}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="xl"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          {/* Info for business users */}
          {mode === "signup" && isBusinessUser && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "hsl(42 100% 50% / 0.05)", border: "1px solid hsl(42 100% 50% / 0.15)" }}>
              <p className="text-xs text-center" style={{ color: "hsl(220 9% 55%)" }}>
                Ao criar sua conta, você será direcionado para a{" "}
                <a
                  href="https://www.asaas.com/r/4095742a-0dd1-4fb7-b9ce-61431bb4f632"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:opacity-80 transition-opacity"
                  style={{ color: "hsl(42 100% 55%)" }}
                >
                  Asaas
                </a>{" "}
                para configurar sua conta de pagamentos.
              </p>
            </div>
          )}

          {/* Affiliate Link */}
          <div className="mt-4 pt-4 text-center" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
            <Link
              to="/afiliado-saas/login"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: "hsl(220 9% 50%)" }}
            >
              Quer ser afiliado do SaaS? <span className="underline" style={{ color: "hsl(42 100% 55%)" }}>Clique aqui</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(145deg, hsl(222 30% 10%), hsl(222 47% 6%))" }}>
        {/* Glowing orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.1), transparent 70%)" }} />
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(217 91% 50% / 0.08), transparent 70%)" }} />

        <div className="relative text-center max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "hsl(42 100% 50% / 0.1)", border: "1px solid hsl(42 100% 50% / 0.25)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "hsl(42 100% 50%)" }} />
            <span className="text-sm font-medium" style={{ color: "hsl(42 100% 55%)" }}>SaaS para Barbearias</span>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 blur-2xl scale-150" style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.2), transparent)" }} />
            <img
              src={logo}
              alt="SalãoCashBack"
              className="relative w-56 h-56 mx-auto animate-float drop-shadow-2xl"
            />
          </div>

          <h2 className="font-display text-3xl font-bold mb-4" style={{ color: "hsl(0 0% 98%)" }}>
            Eleve sua empresa ao{" "}
            <span className="text-gradient-gold">próximo nível</span>
          </h2>
          <p style={{ color: "hsl(220 9% 60%)" }}>
            Automatize vendas, agendamentos e pagamentos.
            <br />
            <strong style={{ color: "hsl(42 100% 55%)" }}>Enquanto você corta o cabelo, o sistema vende.</strong>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8" style={{ borderTop: "1px solid hsl(222 20% 18%)" }}>
            {[
              { value: "500+", label: "Barbearias" },
              { value: "40%", label: "Mais receita" },
              { value: "7 dias", label: "Grátis" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-display font-bold text-gradient-gold">{value}</div>
                <div className="text-xs" style={{ color: "hsl(220 9% 50%)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLoginPage;
