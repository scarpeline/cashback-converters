import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2, 
  User, 
  Scissors, 
  Store, 
  Sparkles, 
  Mail, 
  Globe, 
  ChevronDown, 
  Check 
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole, getDashboardForRole } from "@/lib/auth";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

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

const LoginPage = () => {
  const { t, i18n } = useTranslation("common");
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
    if (!user || !authResolved) return;
    
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

    const dashboardUrl = role ? getDashboardForRole(role) : "/app";
    if (dashboardUrl) {
      navigate(dashboardUrl, { replace: true });
    }
  }, [user, authResolved, roles, getPrimaryRole, navigate]);

  // Failsafe: libera botão assim que auth/roles resolverem
  useEffect(() => {
    if (loading && user && authResolved) {
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
            toast.error(t("auth.error_email_confirmed"));
          } else if (msg.toLowerCase().includes("invalid login credentials")) {
            toast.error(t("auth.error_invalid_credentials"));
          } else {
            toast.error(t("auth.error_generic"));
          }
          setLoading(false);
          return;
        }

        toast.success(t("auth.login_success"));
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
            toast.error(t("auth.error_already_registered"));
          } else {
            toast.error(t("auth.error_signup_generic"));
          }
          setLoading(false);
          return;
        }

        if (isBusinessUser) {
          toast.success(t("auth.signup_success_business"));
          // Redirect to onboarding page for business users
          navigate("/onboarding", { replace: true });
        } else {
          toast.success(t("auth.signup_success_client"));
          setMode("login");
        }
        setLoginType(userType === "dono" ? "dono" : "cliente");
        return;
      }
    } catch (err) {
      toast.error(t("auth.error_generic"));
      setLoading(false);
    }
  };

  const loginTypes: { value: LoginType; label: string; icon: React.ElementType }[] = [
    { value: "cliente", label: t("auth.role_client_short"), icon: User },
    { value: "profissional", label: t("auth.role_professional_short"), icon: Scissors },
    { value: "dono", label: t("auth.role_business_owner_short"), icon: Store },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] animate-in fade-in duration-700">
      {/* Left Side - Form */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center px-4 py-12 lg:px-12 z-10 relative overflow-y-auto"
      >
        <div className="w-full max-w-md mx-auto">
          {/* Back Button & Language Switcher */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 transition-all hover:text-gold group text-slate-400"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {t("auth.back_to_site")}
            </Link>

            <LanguageSelector />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <motion.img 
              src={logo} 
              alt="SalãoCashBack" 
              className="w-12 h-12"
              whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
            />
            <span className="font-display font-bold text-2xl bg-gradient-to-r from-[#D4AF37] via-[#f7e48b] to-[#D4AF37] bg-clip-text text-transparent">
              SalãoCashBack
            </span>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="font-display text-3xl font-bold mb-2 text-slate-50">
              {mode === "login" ? t("auth.login_title") : t("auth.register_title")}
            </h1>
            <p className="mb-8 text-slate-400">
              {mode === "login"
                ? t("auth.login_subtitle")
                : t("auth.register_subtitle")}
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-xl mb-8 bg-[#1e293b]/50 border border-slate-800 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${mode === "login"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#020617] shadow-lg shadow-gold/20 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t("auth.sign_in")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${mode === "signup"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#020617] shadow-lg shadow-gold/20 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              {t("auth.sign_up")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${userType}-${loginType}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Login Type Selection (only for login) */}
              {mode === "login" && (
                <div className="mb-8">
                  <Label className="mb-4 block text-slate-400 text-sm font-medium">{t("auth.login_type_label")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {loginTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setLoginType(type.value)}
                        className={`p-3 rounded-xl text-center transition-all duration-300 border ${
                          loginType === type.value 
                            ? "bg-gold/10 border-gold/40 shadow-gold/20 shadow-lg scale-105" 
                            : "bg-[#0f172a] border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <type.icon className={`w-5 h-5 mx-auto mb-2 transition-colors ${
                          loginType === type.value ? "text-gold" : "text-slate-500"
                        }`} />
                        <span className={`text-[11px] font-bold block transition-colors ${
                          loginType === type.value ? "text-gold" : "text-slate-500"
                        }`}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* User Type Selection (only for signup) */}
              {mode === "signup" && (
                <div className="mb-8">
                  <Label className="mb-4 block text-slate-400 text-sm font-medium">{t("auth.signup_type_label")}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setUserType("cliente")}
                      className={`flex-1 flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${userType === "cliente"
                        ? "border-gold bg-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.1)] scale-[1.02]"
                        : "border-slate-800 bg-[#0f172a] hover:border-gold/30 hover:bg-gold/5"
                        }`}
                    >
                      <div className={`p-3 rounded-full ${userType === "cliente" ? "bg-gold text-[#020617]" : "bg-slate-800 text-slate-500"
                        }`}>
                        <User className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className={`block text-sm font-bold ${userType === "cliente" ? "text-gold" : "text-slate-300"
                          }`}>
                          {t("auth.role_client")}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType("dono")}
                      className={`flex-1 flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${userType === "dono"
                        ? "border-gold bg-gold/5 shadow-[0_0_20px_rgba(212,175,55,0.1)] scale-[1.02]"
                        : "border-slate-800 bg-[#0f172a] hover:border-gold/30 hover:bg-gold/5"
                        }`}
                    >
                      <div className={`p-3 rounded-full ${userType === "dono" ? "bg-gold text-[#020617]" : "bg-slate-800 text-slate-500"
                        }`}>
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className={`block text-sm font-bold ${userType === "dono" ? "text-gold" : "text-slate-300"
                          }`}>
                          {t("auth.role_business_owner")}
                        </span>
                      </div>
                    </button>
                  </div>
                  <p className="text-[11px] mt-4 text-slate-500 italic text-center">
                    {t("auth.signup_disclaimer")}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300 ml-1 text-sm font-medium">{t("auth.name_label")}</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold transition-colors" />
                      <Input
                        id="name"
                        type="text"
                        placeholder={t("auth.name_placeholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-11 bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
                  </div>
                )}

                {/* WhatsApp */}
                {(mode === "signup" || loginType === "cliente") && (
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-slate-300 ml-1 text-sm font-medium">WhatsApp</Label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsAppBR(e.target.value) })}
                        className="pl-11 bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                        autoComplete="tel"
                      />
                    </div>
                    {(errors.whatsapp || errors.identifier) && (
                      <p className="text-xs text-red-500 mt-1 ml-1">{errors.whatsapp || errors.identifier}</p>
                    )}
                  </div>
                )}

                {/* Email */}
                {((mode === "signup" && isBusinessUser) || (mode === "login" && loginType !== "cliente")) && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 ml-1 text-sm font-medium">{t("auth.email_label")}</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-gold transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.email_placeholder")}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-11 bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                        autoComplete="email"
                      />
                    </div>
                    {(errors.email || errors.identifier) && (
                      <p className="text-xs text-red-500 mt-1 ml-1">{errors.email || errors.identifier}</p>
                    )}
                  </div>
                )}

                {/* CPF/CNPJ */}
                {mode === "signup" && isBusinessUser && (
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj" className="text-slate-300 ml-1 text-sm font-medium">{t("auth.cpf_cnpj_label")}</Label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpjBR(e.target.value) })}
                      className="bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* PIX */}
                {mode === "signup" && isBusinessUser && (
                  <div className="space-y-2">
                    <Label htmlFor="pix" className="text-slate-300 ml-1 text-sm font-medium">{t("auth.pix_label")}</Label>
                    <Input
                      id="pix"
                      type="text"
                      placeholder={t("auth.pix_placeholder")}
                      value={formData.pix}
                      onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                      className="bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 ml-1 text-sm font-medium">{t("auth.password_label")}</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="px-11 bg-[#0f172a] border-slate-800 focus:border-gold/50 transition-all h-13 rounded-xl text-slate-200"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
                </div>

                {/* Forgot Password (login only) */}
                {mode === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-xs text-gold hover:text-white transition-colors font-medium"
                      onClick={async () => {
                        const identifier = loginType === "cliente" ? formData.whatsapp : formData.email;
                        let targetEmail = "";

                        if (loginType === "cliente") {
                          if (!formData.whatsapp || formData.whatsapp.length < 10) {
                            toast.error(t("auth.error_whatsapp_required"));
                            return;
                          }
                          setLoading(true);
                          const norm = formData.whatsapp.replace(/\D/g, '');
                          const { data } = await (supabase as any).rpc("get_email_by_whatsapp", { _whatsapp: norm });
                          setLoading(false);
                          if (!data) {
                            toast.error(t("auth.error_account_not_found"));
                            return;
                          }
                          targetEmail = data;
                        } else {
                          if (!formData.email || !formData.email.includes("@")) {
                            toast.error(t("auth.error_email_required"));
                            return;
                          }
                          targetEmail = formData.email;
                        }

                        if (targetEmail) {
                          const { error } = await sendPasswordResetEmail(targetEmail);
                          if (error) {
                            toast.error(t("auth.error_reset_email") + error.message);
                          } else {
                            toast.success(t("auth.reset_email_sent"));
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      {t("auth.forgot_password")}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-13 mt-4 bg-gradient-to-r from-[#D4AF37] via-[#f7e48b] to-[#D4AF37] text-[#020617] font-black text-base rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 border-none group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("processing")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                       {mode === "login" ? t("auth.sign_in") : t("auth.sign_up")}
                       <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Info for business users */}
          {mode === "signup" && isBusinessUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <p className="text-[11px] text-center text-slate-500 leading-relaxed">
                {t("auth.asaas_redirect_info")}{" "}
                <a
                  href="https://www.asaas.com/r/4095742a-0dd1-4fb7-b9ce-61431bb4f632"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold font-bold underline hover:text-white transition-colors"
                >
                  Asaas
                </a>
              </p>
            </motion.div>
          )}

          {/* Affiliate Link */}
          <div className="mt-8 pt-6 text-center border-t border-slate-800">
            <Link
              to="/afiliado-saas/login"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              {t("auth.want_to_be_affiliate")}{" "}
              <span className="text-gold font-bold underline">{t("auth.click_here")}</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Premium Visual Marketing */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="hidden lg:flex flex-1 relative bg-[#020617] items-center justify-center p-12 overflow-hidden border-l border-slate-800"
      >
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-gold/10 rounded-full blur-[140px] opacity-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] opacity-30" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="max-w-xl text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-12 backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            {t("auth.visual_badge")}
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-display text-5xl xl:text-7xl font-black mb-8 text-slate-50 leading-[1.1] tracking-tight"
          >
            {t("auth.visual_title")} <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#f7e48b] to-[#D4AF37] bg-clip-text text-transparent italic">
               {t("auth.visual_title_highlight")}
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg xl:text-xl text-slate-400 mb-16 leading-relaxed font-medium"
          >
            {t("auth.visual_subtitle")} <br />
            <span className="text-gold underline decoration-gold/30 underline-offset-8">{t("auth.visual_description")}</span>
          </motion.p>

          {/* Stats cards */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-6 pt-16 border-t border-slate-800"
          >
            {[
              { value: "500+", label: t("auth.stat_partners") },
              { value: "40%", label: t("auth.stat_revenue") },
              { value: "100%", label: t("auth.stat_digital") },
            ].map(({ value, label }) => (
              <div key={label} className="text-center group p-4 rounded-2xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
                <div className="text-3xl font-display font-black bg-gradient-to-r from-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Security badge at bottom right */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 right-12 flex items-center gap-3 bg-[#0f172a]/50 backdrop-blur-xl px-5 py-2.5 rounded-full border border-slate-800 shadow-2xl"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">{t("auth.security_title")}</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
