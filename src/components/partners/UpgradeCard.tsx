// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePartnerCommissionConfig } from '@/hooks/usePartnerCommissionConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  currentType: 'afiliado' | 'franqueado';
  onUpgrade: () => void;
}

const FRANQUEADO_BENEFITS = [
  '🏪 Recrute afiliados e ganhe sobre a rede deles',
  `💰 Comissão sobre adesões dos clientes dos seus afiliados`,
  '📊 Painel de gestão de afiliados',
  '🎯 Suporte prioritário',
  '📈 Relatórios avançados de rede',
];

const DIRETOR_BENEFITS = [
  '👑 Gerencie franqueados em toda a rede',
  '💰 Comissão sobre toda a hierarquia',
  '🌐 Território exclusivo',
  '🤝 Treinamento e onboarding dedicado',
  '📊 Dashboard executivo completo',
  '🏆 Reconhecimento como Diretor Regional',
];

export default function UpgradeCard({ currentType, onUpgrade }: Props) {
  const { config } = usePartnerCommissionConfig();
  const [loading, setLoading] = useState(false);

  const isAfiliadoUpgrade = currentType === 'afiliado';
  const targetType = isAfiliadoUpgrade ? 'Franqueado' : 'Diretor';
  const price = isAfiliadoUpgrade ? config.preco_franqueado : config.preco_diretor;
  const benefits = isAfiliadoUpgrade ? FRANQUEADO_BENEFITS : DIRETOR_BENEFITS;
  const accentColor = isAfiliadoUpgrade ? 'text-blue-600' : 'text-purple-600';
  const bgColor = isAfiliadoUpgrade ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200';
  const btnVariant = isAfiliadoUpgrade ? 'default' : 'default';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-payment', {
        body: {
          action: 'charge',
          amount: price,
          description: `Upgrade para ${targetType}`,
        },
      });
      if (error) throw error;
      toast.success(`Upgrade para ${targetType} iniciado! Aguarde a confirmação.`);
      onUpgrade();
    } catch (err: any) {
      toast.error(`Erro ao processar upgrade: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`border ${bgColor}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${accentColor}`}>
          <ArrowUpCircle className="w-5 h-5" />
          Faça Upgrade para {targetType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Expanda sua rede e multiplique seus ganhos tornando-se {isAfiliadoUpgrade ? 'um' : 'um'} {targetType}.
        </p>

        <ul className="space-y-1.5">
          {benefits.map((b, i) => (
            <li key={i} className="text-sm">{b}</li>
          ))}
        </ul>

        <div className={`p-3 rounded-lg ${isAfiliadoUpgrade ? 'bg-blue-100' : 'bg-purple-100'}`}>
          <p className="text-xs text-muted-foreground">Investimento único</p>
          <p className={`text-2xl font-bold ${accentColor}`}>{formatCurrency(price)}</p>
        </div>

        <Button
          className={`w-full ${isAfiliadoUpgrade ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>
          ) : (
            <>Fazer Upgrade para {targetType} — {formatCurrency(price)}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
