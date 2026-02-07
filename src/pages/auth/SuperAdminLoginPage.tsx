import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Shield, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getRedirectPath } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const SuperAdminLoginPage = () => {
  const navigate = useNavigate();
  const { user, getPrimaryRole, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      const role = getPrimaryRole();
      if (role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate(getRedirectPath(role));
      }
    }
  }, [user, authLoading, navigate, getPrimaryRole]);

  const validateForm = () => {
    setErrors({});
    try {
      emailSchema.parse({ email });
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
      // Check if email is authorized
      const authorizedEmails = [
        'escarpelineparticular@gmail.com',
        'escarpelineparticular2@gmail.com'
      ];

      if (!authorizedEmails.includes(email.toLowerCase())) {
        toast.error("E-mail não autorizado para acesso Super Admin");
        setLoading(false);
        return;
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/super-admin`,
        }
      });

      if (error) {
        toast.error(error.message || "Erro ao enviar link");
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast.success("Link mágico enviado para seu e-mail!");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-destructive/5">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl block">
              Super Admin
            </span>
            <span className="text-sm text-muted-foreground">SalãoCashBack</span>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold mb-2">
          Acesso Restrito
        </h1>
        <p className="text-muted-foreground mb-8">
          Área exclusiva para administradores do sistema.
        </p>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail Autorizado</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Mail className="w-4 h-4 mr-2" />
              Enviar Link Mágico
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold mb-2">
                Verifique seu e-mail
              </h2>
              <p className="text-muted-foreground">
                Enviamos um link mágico para <strong>{email}</strong>.
                Clique no link para acessar o painel.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setEmailSent(false)}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        <div className="mt-8 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-xs text-muted-foreground text-center">
            Apenas e-mails previamente autorizados podem acessar esta área.
            Tentativas não autorizadas são registradas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
