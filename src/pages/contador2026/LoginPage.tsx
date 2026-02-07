import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Calculator, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getRedirectPath } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const ContadorLoginPage = () => {
  const navigate = useNavigate();
  const { user, signInWithMagicLink, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      navigate(getRedirectPath(role), { replace: true });
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
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
          Voltar ao site
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Logo/Icon */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Portal do Contador</h2>
              <p className="text-xs text-muted-foreground">SalãoCashBack</p>
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
              <h1 className="font-display text-2xl font-bold mb-2">
                Acesso Restrito
              </h1>
              <p className="text-muted-foreground mb-6">
                Este portal é exclusivo para contadores parceiros.
                Digite seu e-mail para receber o link de acesso.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail Autorizado</Label>
                  <div className="relative mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@escritorio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${error ? "border-destructive" : ""}`}
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

              <p className="text-xs text-muted-foreground text-center mt-6">
                Contadores são cadastrados pelo Super Admin.
                <br />
                Entre em contato se precisar de acesso.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
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
