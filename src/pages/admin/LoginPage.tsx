import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Shield, Mail, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getRedirectPath } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, signInWithMagicLink, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      navigate(getRedirectPath(role), { replace: true });
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const checkAuthorization = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("authorized_super_admins")
        .select("email, is_active")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();
      
      return !!data && !error;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Check if email is authorized
      const isAuthorized = await checkAuthorization(email);
      
      if (!isAuthorized) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const { error } = await signInWithMagicLink(email);
      
      if (error) {
        toast.error(error.message || "Erro ao enviar link de acesso");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {/* Card */}
        <div className="bg-card border border-destructive/20 rounded-2xl p-8 shadow-lg">
          {/* Logo/Icon */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Super Admin</h2>
              <p className="text-xs text-muted-foreground">Acesso Restrito</p>
            </div>
          </div>

          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-bold">
                Verifique seu e-mail
              </h1>
              <p className="text-muted-foreground">
                Enviamos um link de acesso para <strong>{email}</strong>.
                Clique no link para entrar no painel administrativo.
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Usar outro e-mail
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                Área Administrativa
              </h1>
              <p className="text-muted-foreground mb-6">
                Este acesso é exclusivo para administradores autorizados.
              </p>

              {unauthorized && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Acesso Negado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este e-mail não está autorizado a acessar o painel administrativo.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail Autorizado</Label>
                  <div className="relative mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@salao.app"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setUnauthorized(false);
                      }}
                      className={`pl-10 ${error || unauthorized ? "border-destructive" : ""}`}
                    />
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                </div>

                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Solicitar Acesso
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Login via magic link para maior segurança.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
