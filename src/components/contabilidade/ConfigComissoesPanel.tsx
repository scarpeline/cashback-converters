import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, Loader2, Percent, TrendingUp } from "lucide-react";

interface ConfigComissao {
  id: string;
  porcentagem_app: number;
  porcentagem_contador: number;
  ativo: boolean;
}

export function ConfigComissoesPanel() {
  const [config, setConfig] = useState<ConfigComissao | null>(null);
  const [pctApp, setPctApp] = useState("20");
  const [pctContador, setPctContador] = useState("80");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("config_comissoes")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLoading(false);
    if (error && error.code !== "PGRST116") {
      toast.error("Erro ao carregar configuração: " + error.message);
      return;
    }
    if (data) {
      setConfig(data as ConfigComissao);
      setPctApp(String(data.porcentagem_app));
      setPctContador(String(data.porcentagem_contador));
    }
  };

  const handleSalvar = async () => {
    const pApp = Number(pctApp);
    const pCont = Number(pctContador);
    if (isNaN(pApp) || isNaN(pCont)) { toast.error("Valores inválidos."); return; }
    if (Math.abs(pApp + pCont - 100) > 0.01) {
      toast.error(`Soma deve ser 100%. Atual: ${(pApp + pCont).toFixed(1)}%`);
      return;
    }
    if (pApp < 0 || pApp > 100 || pCont < 0 || pCont > 100) {
      toast.error("Percentuais devem estar entre 0 e 100.");
      return;
    }
    setSaving(true);
    if (config) {
      const { error } = await supabase
        .from("config_comissoes")
        .update({ porcentagem_app: pApp, porcentagem_contador: pCont })
        .eq("id", config.id);
      setSaving(false);
      if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    } else {
      const { error } = await supabase
        .from("config_comissoes")
        .insert({ porcentagem_app: pApp, porcentagem_contador: pCont, ativo: true });
      setSaving(false);
      if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    }
    toast.success("Configuração de comissões salva!");
    await fetchConfig();
  };

  const pAppNum = Number(pctApp) || 0;
  const pContNum = Number(pctContador) || 0;
  const soma = pAppNum + pContNum;
  const somaOk = Math.abs(soma - 100) < 0.01;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Configuração de Comissões
          </CardTitle>
          <CardDescription>
            Define como a receita de serviços contábeis é dividida entre o app e o contador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Porcentagem do App (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={pctApp}
                    onChange={(e) => {
                      setPctApp(e.target.value);
                      const v = Number(e.target.value);
                      if (!isNaN(v)) setPctContador(String(Math.max(0, 100 - v)));
                    }}
                    className="text-lg font-semibold"
                  />
                  <p className="text-sm text-muted-foreground">
                    O app retém esta % de cada serviço contábil pago.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-500" />
                    Porcentagem do Contador (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={pctContador}
                    onChange={(e) => {
                      setPctContador(e.target.value);
                      const v = Number(e.target.value);
                      if (!isNaN(v)) setPctApp(String(Math.max(0, 100 - v)));
                    }}
                    className="text-lg font-semibold"
                  />
                  <p className="text-sm text-muted-foreground">
                    O contador recebe esta % de cada serviço ou assinatura.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${somaOk ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total:</span>
                  <span className={`text-lg font-bold ${somaOk ? "text-green-600" : "text-red-600"}`}>
                    {soma.toFixed(1)}%
                  </span>
                </div>
                {!somaOk && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ A soma deve ser exatamente 100%. Faltam {(100 - soma).toFixed(1)}%.
                  </p>
                )}
                {somaOk && (
                  <p className="text-xs text-green-600 mt-1">✓ Distribuição válida.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">Exemplo: serviço de R$ 200</p>
                  <p className="font-semibold">App recebe:</p>
                  <p className="text-primary font-bold text-lg">R$ {(200 * pAppNum / 100).toFixed(2)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground text-xs mb-1">Exemplo: serviço de R$ 200</p>
                  <p className="font-semibold">Contador recebe:</p>
                  <p className="text-amber-500 font-bold text-lg">R$ {(200 * pContNum / 100).toFixed(2)}</p>
                </div>
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={handleSalvar}
                disabled={saving || !somaOk}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configuração
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {config && (
        <Card className="border-muted">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Configuração atual: App <strong>{config.porcentagem_app}%</strong> ·
              Contador <strong>{config.porcentagem_contador}%</strong>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ConfigComissoesPanel;
