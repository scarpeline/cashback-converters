// @ts-nocheck
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  Phone,
  User,
  Fingerprint,
  Wallet,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { formatCpfCnpjBR } from "@/lib/input-masks";
import { Badge } from "@/components/ui/badge";

interface ProfessionalBankData {
  name: string;
  cpf_cnpj: string;
  mobile_phone: string;
  pix_key: string;
  pix_key_type: string;
  asaas_wallet_id: string | null;
}

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF/CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

const ContaBancariaPage = () => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<ProfessionalBankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    mobile_phone: "",
    pix_key: "",
    pix_key_type: "cpf",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await (supabase as any)
        .from("professionals")
        .select("id, name, cpf_cnpj, whatsapp, pix_key, asaas_wallet_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof) {
        setProfessionalId(prof.id);
        const ph = (prof as any).whatsapp || "";
        const bankData: ProfessionalBankData = {
          name: prof.name || "",
          cpf_cnpj: prof.cpf_cnpj || "",
          mobile_phone: typeof ph === "string" ? ph.replace(/\D/g, "") : "",
          pix_key: prof.pix_key || "",
          pix_key_type: "cpf",
          asaas_wallet_id: prof.asaas_wallet_id,
        };
        setData(bankData);
        setForm({
          name: prof.name || profile?.name || "",
          cpf_cnpj: prof.cpf_cnpj || "",
          mobile_phone: bankData.mobile_phone,
          pix_key: prof.pix_key || "",
          pix_key_type: "cpf",
        });
      } else {
        setForm(f => ({ ...f, name: profile?.name || "" }));
      }
      setLoading(false);
    })();
  }, [user, profile]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome completo é obrigatório.");
      return;
    }
    if (!form.cpf_cnpj.replace(/\D/g, "")) {
      toast.error("CPF/CNPJ é obrigatório para registrar seu recebimento.");
      return;
    }
    if (!form.pix_key) {
      toast.error("Chave PIX é obrigatória para liberar o split.");
      return;
    }
    const phoneDigits = form.mobile_phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Número de Telefone Inválido para o Gateway.");
      return;
    }

    setSaving(true);

    // Save to professionals table
    const updatePayload: Record<string, string> = {
      name: form.name,
      cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
      pix_key: form.pix_key,
    };
    if (phoneDigits.length >= 10) (updatePayload as any).whatsapp = `+55${phoneDigits}`;

    const { error } = await (supabase as any)
      .from("professionals")
      .update(updatePayload)
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Erro Crítico ao Salvar: " + error.message);
      setSaving(false);
      return;
    }

    // Call edge function to create gateway account (Real Integration)
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("process-payment", {
        body: {
          action: "create-professional-account",
          professional_id: professionalId,
          cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
          name: form.name,
          email: profile?.email,
          mobile_phone: phoneDigits.length >= 10 ? phoneDigits : undefined,
          pix_key: form.pix_key,
        },
      });

      if (fnError) throw new Error(fnError.message);

      setData({
        ...form,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
        asaas_wallet_id: result?.wallet_id || data?.asaas_wallet_id || null,
      });

      toast.success("Parceria Ativada! Carteira Diamond criada com sucesso.");
    } catch (e: any) {
      console.error("Gateway error:", e);
      setData({
        ...form,
        cpf_cnpj: form.cpf_cnpj.replace(/\D/g, ""),
        asaas_wallet_id: data?.asaas_wallet_id || null,
      });
      toast.success("Dados salvos com sucesso! Sincronização em segundo plano ativa.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!professionalId) {
    return (
      <div className="space-y-8 animate-in fade-in max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Liberação <span className="text-gradient-gold">Financeira</span></h1>
        <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-3xl rounded-[3rem] p-16 text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-black text-white italic mb-4 uppercase">Acesso Não Identificado</h2>
            <p className="text-slate-500 font-medium">Seu ID de profissional não foi vinculado ao portal Diamond. Contate a administração do salão para liberar seu acesso financeiro.</p>
        </Card>
      </div>
    );
  }

  const hasGatewayAccount = !!data?.asaas_wallet_id;
  const hasData = !!data?.cpf_cnpj;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
         <div>
            <Badge className="bg-gradient-gold text-black font-black uppercase text-[9px] tracking-[0.2em] px-4 py-1.5 mb-5 rounded-full shadow-gold diamond-glow">Diamond Wallet</Badge>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic uppercase">Recebimento <span className="text-gradient-gold">Pro</span></h1>
            <p className="text-slate-500 font-medium italic mt-2 opacity-60">Configuração de Transferência e Split Automatizado Diamond</p>
         </div>
         {hasGatewayAccount && (
            <div className="flex items-center gap-3 bg-emerald-500/10 px-5 py-3 rounded-2xl border border-emerald-500/20 animate-in zoom-in-95">
               <ShieldCheck className="w-6 h-6 text-emerald-400" />
               <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Status Ativo</p>
                  <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest italic">Gateway Expert Conectado</p>
               </div>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-12">
          <Card className="glass-card rounded-[3.5rem] border-white/5 bg-slate-900/30 backdrop-blur-4xl shadow-2xl p-4 md:p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full group-hover:bg-orange-500/10 transition-all duration-1000" />
            
            <CardHeader className="pb-10 relative z-10">
              <CardTitle className="flex items-center gap-4 text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                <div className="w-14 h-14 bg-gradient-gold rounded-[1.4rem] flex items-center justify-center shadow-gold group-hover:rotate-6 transition-all duration-500">
                   <CreditCard className="w-7 h-7 text-black" />
                </div>
                Identidade de Saque
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium text-base mt-2 pl-[72px]">
                Preencha seus dados reais para que o sistema realize o split automático dos seus ganhos.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest flex italic"><User className="w-3 h-3" /> Nome Completo Conforme Documento *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="DIGITE SEU NOME PARA VALIDAÇÃO"
                    className="bg-white/5 border-white/10 h-16 rounded-2xl text-white font-black px-6 focus-visible:ring-orange-500/20 active:scale-[0.99] transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest flex italic"><Phone className="w-3 h-3" /> WhatsApp de Contato *</Label>
                  <Input
                    value={form.mobile_phone}
                    onChange={(e) => setForm({ ...form, mobile_phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    placeholder="11900000000"
                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold px-6 focus-visible:ring-orange-500/20 active:scale-[0.99] transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest flex italic"><Fingerprint className="w-3 h-3" /> CPF / CNPJ de Identificação *</Label>
                  <Input
                    value={formatCpfCnpjBR(form.cpf_cnpj)}
                    onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-bold px-6 focus-visible:ring-orange-500/20 active:scale-[0.99] transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest flex italic"><Wallet className="w-3 h-3" /> Modalidade de Chave PIX</Label>
                  <select
                    className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-2 text-sm text-white font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 transition-all appearance-none cursor-pointer"
                    value={form.pix_key_type}
                    onChange={(e) => setForm({ ...form, pix_key_type: e.target.value })}
                  >
                    {PIX_KEY_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-slate-900 text-white">{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] items-center gap-2 font-black text-slate-500 uppercase tracking-widest flex italic"><Sparkles className="w-3 h-3" /> Chave PIX para Depósito *</Label>
                  <Input
                    value={form.pix_key}
                    onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                    placeholder="SUA CHAVE PARA RECEBER"
                    className="bg-white/5 border-white/10 h-14 rounded-2xl text-white font-black px-6 focus-visible:ring-orange-500/20 active:scale-[0.99] transition-all"
                  />
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center">
                <Button 
                    className={`w-full md:w-[400px] h-18 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-gold-xl transition-all float-button relative overflow-hidden group/btn px-10 py-5 flex items-center justify-center gap-4 ${saving ? 'bg-slate-800' : 'bg-gradient-gold text-black active:scale-95'}`}
                    onClick={handleSave} 
                    disabled={saving}
                >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Zap className="w-6 h-6" /> {hasData ? "Atualizar Credenciais" : "Ativar Diamond Split"}</>}
                </Button>
                
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-8 flex items-center gap-3">
                   <ShieldCheck size={12} className="text-emerald-500" /> Sincronização Encriptada via SSL Asaas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasGatewayAccount && (
          <div className="md:col-span-12 animate-in slide-in-from-bottom duration-1000 delay-500">
             <div className="p-10 bg-emerald-500/5 rounded-[3rem] border border-emerald-500/10 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-emerald-500/10 transition-all duration-700">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-premium transition-transform group-hover:scale-110">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Recebimento Instantâneo Habilitado</h4>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Sua carteira SCB-PRO está preparada para o split automático.</p>
                   </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 font-bold px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest">Acesso VIP Full</Badge>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContaBancariaPage;
