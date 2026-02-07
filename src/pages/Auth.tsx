import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type UserType = "cliente" | "dono" | "profissional" | "afiliado";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignup = searchParams.get("mode") === "signup";
  
  const [mode, setMode] = useState<"login" | "signup">(isSignup ? "signup" : "login");
  const [userType, setUserType] = useState<UserType>("cliente");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    password: "",
    cpfCnpj: "",
    pix: ""
  });

  const isBusinessUser = userType !== "cliente";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success(mode === "login" ? "Login realizado!" : "Conta criada com sucesso!");
    setLoading(false);
    
    // Navigate based on user type
    const dashboardRoutes: Record<UserType, string> = {
      cliente: "/cliente",
      dono: "/dono",
      profissional: "/profissional",
      afiliado: "/afiliado"
    };
    
    navigate(dashboardRoutes[userType]);
  };

  const userTypes: { value: UserType; label: string }[] = [
    { value: "cliente", label: "Sou Cliente" },
    { value: "dono", label: "Sou Dono de Barbearia" },
    { value: "profissional", label: "Sou Profissional" },
    { value: "afiliado", label: "Sou Afiliado" }
  ];

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

          {/* User Type Selection (only for signup) */}
          {mode === "signup" && (
            <div className="mb-6">
              <Label className="mb-3 block">Tipo de Conta</Label>
              <div className="grid grid-cols-2 gap-2">
                {userTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setUserType(type.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      userType === type.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
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
                  required
                  className="mt-1"
                />
              </div>
            )}

            {/* WhatsApp */}
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            {/* Email (business users or login) */}
            {(mode === "login" || isBusinessUser) && (
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={mode === "login" || isBusinessUser}
                  className="mt-1"
                />
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
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  required
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
                  required
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
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password (login only) */}
            {mode === "login" && (
              <div className="text-right">
                <a href="#" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </a>
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
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          {/* Info for business users */}
          {mode === "signup" && isBusinessUser && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Sua conta ASAAS será criada automaticamente para receber pagamentos.
            </p>
          )}
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

export default Auth;
