import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Eye, EyeOff, Loader2,
  User, Scissors, Store, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole, getDashboardForRole } from "@/lib/auth";
import { formatCpfCnpjBR, formatWhatsAppBR } from "@/lib/input-masks";
import logo from "@/assets/logo.png";
import { z } from "zod";
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
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const {
    user, signUp, signIn, signInWithWhatsApp,
    getPrimaryRole, roles, authResolved, sendPasswordResetEmail
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [userType, setUserType] = useState<UserType>("cliente");
  const [loginType, setLoginType] = useState<LoginType>("cliente");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "", whatsapp: "", email: "", password: "", cpfCnpj: "", pix: ""
  });

  useEffect(() => {
    if (!user || !authResolved) return;
    const role = getPrimaryRole();
    if (!role) return;
    const selectedPlan = localStorage.getItem("selected_plan");
    if (selectedPlan && role === "dono") {
      try {
        const plan = JSON.parse(selectedPlan);
        localStorage.removeItem("selected_plan");
        if (plan.checkoutUrl) { window.location.href = plan.checkoutUrl; return; }
      } catch { /* ignore */ }
    }
    localStorage.removeItem("selected_plan");
    navigate(getDashboardForRole(role), { replace: true });
  }, [user, authResolved, roles, getPrimaryRole, navigate]);

  useEffect(() => {
    if (loading && user && authResolved) setLoading(false);
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
        const d: Record<string, string> = { name: formData.name, whatsapp: formData.whatsapp, password: formData.password };
        if (isBusinessUser) d.email = formData.email;
        signupSchema.parse(d);
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const e: Record<string, string> = {};
        err.errors.forEach(x => { if (x.path[0]) e[x.path[0] as string] = x.message; });
        setErrors(e);
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
        const result = loginType === "cliente"
          ? await signInWithWhatsApp(formData.whatsapp, formData.password)
          : await signIn(formData.email, formData.password);
        if (result.error) {
          const msg = result.error.message || "";
          if (msg.toLowerCase().includes("email not confirmed")) toast.error(t("auth.error_email_confirmed"));
          else if (msg.toLowerCase().includes("invalid login credentials")) toast.error(t("auth.error_invalid_credentials"));
          else toast.error(t("auth.error_generic"));
          setLoading(false);
          return;
        }
        toast.success(t("auth.login_success"));
        setTimeout(() => setLoading(false), 3000);
      } else {
        const email = isBusinessUser
          ? formData.email
          : `${formData.whatsapp.replace(/\D/g, "")}@salao.app`;
        const { error } = await signUp(email, formData.password, {
          name: formData.name, whatsapp: formData.whatsapp, role: userType as AppRole,
          cpf_cnpj: isBusinessUser ? formData.cpfCnpj : undefined,
          pix_key: isBusinessUser ? formData.pix : undefined,
        });
        if (error) {
          toast.error(error.message.includes("already registered") ? t("auth.error_already_registered") : t("auth.error_signup_generic"));
          setLoading(false);
          return;
        }
        if (isBusinessUser) { toast.success(t("auth.signup_success_business")); navigate("/onboarding", { replace: true }); }
        else { toast.success(t("auth.signup_success_client")); setMode("login"); }
        setLoginType(userType === "dono" ? "dono" : "cliente");
      }
    } catch {
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.back_to_site")}
          </Link>
          <LanguageSelector />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-base font-semibold text-slate-900">SalãoCashBack</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          {mode === "login" ? t("auth.login_title") : t("auth.register_title")}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {mode === "login" ? t("auth.login_subtitle") : t("auth.register_subtitle")}
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t("auth.sign_in")}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t("auth.sign_up")}
          </button>
        </div>

        {/* Login type selector */}
        {mode === "login" && (
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 mb-3">{t("auth.login_type_label")}</p>
            <div className="grid grid-cols-3 gap-2">
              {loginTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLoginType(type.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                    loginType === type.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Signup type selector */}
        {mode === "signup" && (
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 mb-3">{t("auth.signup_type_label")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cliente", "dono"] as UserType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-sm font-medium transition-all ${
                    userType === type
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {type === "cliente" ? <User className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  {type === "cliente" ? t("auth.role_client") : t("auth.role_business_owner")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">{t("auth.name_label")}</Label>
              <Input
                id="name" type="text" placeholder={t("auth.name_placeholder")}
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-11 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
          )}

          {(mode === "signup" || loginType === "cliente") && (
            <div>
              <Label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">WhatsApp</Label>
              <Input
                id="whatsapp" type="tel" placeholder="(00) 00000-0000"
                value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: formatWhatsAppBR(e.target.value) })}
                className="mt-1 h-11 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                autoComplete="tel"
              />
              {(errors.whatsapp || errors.identifier) && <p className="text-xs text-red-500 mt-1">{errors.whatsapp || errors.identifier}</p>}
            </div>
          )}

          {((mode === "signup" && isBusinessUser) || (mode === "login" && loginType !== "cliente")) && (
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">{t("auth.email_label")}</Label>
              <Input
                id="email" type="email" placeholder={t("auth.email_placeholder")}
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 h-11 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                autoComplete="email"
              />
              {(errors.email || errors.identifier) && <p className="text-xs text-red-500 mt-1">{errors.email || errors.identifier}</p>}
            </div>
          )}

          {mode === "signup" && isBusinessUser && (
            <div>
              <Label htmlFor="cpfCnpj" className="text-sm font-medium text-slate-700">{t("auth.cpf_cnpj_label")}</Label>
              <Input
                id="cpfCnpj" type="text" placeholder="000.000.000-00"
                value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: formatCpfCnpjBR(e.target.value) })}
                className="mt-1 h-11 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
          )}

          {mode === "signup" && isBusinessUser && (
            <div>
              <Label htmlFor="pix" className="text-sm font-medium text-slate-700">{t("auth.pix_label")}</Label>
              <Input
                id="pix" type="text" placeholder={t("auth.pix_placeholder")}
                value={formData.pix} onChange={e => setFormData({ ...formData, pix: e.target.value })}
                className="mt-1 h-11 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">{t("auth.password_label")}</Label>
              {mode === "login" && (
                <button
                  type="button"
                  className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
                  onClick={async () => {
                    let targetEmail = "";
                    if (loginType === "cliente") {
                      if (!formData.whatsapp || formData.whatsapp.length < 10) { toast.error(t("auth.error_whatsapp_required")); return; }
                      setLoading(true);
                      const { data } = await (supabase as any).rpc("get_email_by_whatsapp", { _whatsapp: formData.whatsapp.replace(/\D/g, "") });
                      setLoading(false);
                      if (!data) { toast.error(t("auth.error_account_not_found")); return; }
                      targetEmail = data;
                    } else {
                      if (!formData.email?.includes("@")) { toast.error(t("auth.error_email_required")); return; }
                      targetEmail = formData.email;
                    }
                    const { error } = await sendPasswordResetEmail(targetEmail);
                    if (error) toast.error(t("auth.error_reset_email") + error.message);
                    else toast.success(t("auth.reset_email_sent"));
                  }}
                  disabled={loading}
                >
                  {t("auth.forgot_password")}
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="h-11 pr-10 text-slate-900 border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("processing")}</> : (mode === "login" ? t("auth.sign_in") : t("auth.sign_up"))}
          </button>
        </form>

        {mode === "signup" && isBusinessUser && (
          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            {t("auth.asaas_redirect_info")}{" "}
            <a href="https://www.asaas.com/r/4095742a-0dd1-4fb7-b9ce-61431bb4f632" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Asaas</a>
          </p>
        )}

        <hr className="my-8 border-slate-100" />

        <p className="text-center text-xs text-slate-400">
          {t("auth.want_to_be_affiliate")}{" "}
          <Link to="/afiliado-saas/login" className="text-orange-500 font-medium hover:underline">{t("auth.click_here")}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
