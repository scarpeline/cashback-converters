import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Calculator, Mail, CheckCircle, Eye, EyeOff, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getDashboardForRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const ContadorLoginPage = () => {
  const navigate = useNavigate();
  const { user, signIn, signInWithMagicLink, getPrimaryRole, roles, loading: authLoading, authResolved } = useAuth();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState<"password" | "magiclink">("password");
  const [unauthorized, setUnauthorized] = useState(false);
  const [verifyingAccess, setVerifyingAccess] = useState(false);

  // Redirect if already logged in with contador role
  useEffect(() => {
    if (user && !authLoading && roles.length > 0) {
      const hasContadorRole = roles.includes("contador" as any);
      if (hasContadorRole) {
        navigate("/contador2026", { replace: true });
      } else {
        // Logged in but not a contador - redirect to their correct dashboard
        const role = getPrimaryRole();
        if (role) {
          navigate(getDashboardForRole(role), { replace: true });
        }
      }
    }
  }, [user, authLoading, roles, navigate, getPrimaryRole]);

  // After login, verify the user is actually a contador
  const verifyContadorAccess = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any).rpc("is_authorized_contador", { _user_id: userId });
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnauthorized(false);

    try {
      emailSchema.parse({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    if (!password) {
      setError("Senha obrigatória");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        const msg = signInError.message || "";
        if (msg.toLowerCase().includes("invalid login credentials")) {
          toast.error("Credenciais inválidas. Verifique e-mail e senha.");
        } else {
          toast.error("Erro ao fazer login. Tente novamente.");
        }
        setLoading(false);
        return;
      }

      // Verify this user is actually a registered contador
      setVerifyingAccess(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const isContador = await verifyContadorAccess(currentUser.id);
        if (!isContador) {
          // Not a contador - sign out and show error
          await supabase.auth.signOut();
          setUnauthorized(true);
          setVerifyingAccess(false);
          setLoading(false);
          return;
        }
      }

      setVerifyingAccess(false);
      toast.success("Acesso realizado!");
      setTimeout(() => setLoading(false), 5000);
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
      setLoading(false);
      setVerifyingAccess(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnauthorized(false);

    try {
      emailSchema.parse({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await signInWithMagicLink(email, "/contador2026/login");

      if (error) {
        toast.error("Erro ao enviar link de acesso. Tente novamente.");
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success("Link de acesso enviado!");
    } catch (err) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Portal do Contador</h2>
              <p className="text-xs text-muted-foreground">SalãoCashBack</p>
            </div>
          </div>

          {verifyingAccess ? (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm">Verificando autorização de contador...</p>
            </div>
          ) : emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-bold">Verifique seu e-mail</h1>
              <p className="text-muted-foreground">
                Enviamos um link de acesso para <strong>{email}</strong>.
                Clique no link para entrar.
              </p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setEmailSent(false)}
              >
                Usar outro e-mail
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Acesso Restrito</h1>
              <p className="text-muted-foreground mb-4">
                Portal exclusivo para contadores parceiros autorizados.
              </p>

              {/* Security badge */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg mb-6">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Acesso verificado por autenticação e registro de contador ativo.</p>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => { setLoginMode("password"); setError(""); setUnauthorized(false); }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${loginMode === "password" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Email + Senha
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode("magiclink"); setError(""); setUnauthorized(false); }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${loginMode === "magiclink" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Magic Link
                </button>
              </div>

              {unauthorized && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Acesso Negado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este e-mail não está registrado como contador autorizado. 
                      Contadores são cadastrados exclusivamente pelo administrador do sistema.
                    </p>
                  </div>
                </div>
              )}

              {loginMode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative mt-1">
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@escritorio.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); setUnauthorized(false); }}
                        className={`pl-10 ${error || unauthorized ? "border-destructive" : ""}`}
                      />
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Entrar
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <Label htmlFor="email-magic">E-mail Autorizado</Label>
                    <div className="relative mt-1">
                      <Input
                        id="email-magic"
                        type="email"
                        placeholder="seu@escritorio.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); setUnauthorized(false); }}
                        className={`pl-10 ${error || unauthorized ? "border-destructive" : ""}`}
                      />
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Enviar Link de Acesso
                  </Button>
                </form>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                Contadores são cadastrados pelo Super Admin.
                <br />
                Entre em contato se precisar de acesso.
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          <Link to="/" className="hover:text-primary transition-colors">
            © SalãoCashBack
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ContadorLoginPage;
