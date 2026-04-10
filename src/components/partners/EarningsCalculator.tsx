import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { usePartnerCommissionConfig } from '@/hooks/usePartnerCommissionConfig';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  partnerType: 'afiliado' | 'franqueado' | 'diretor';
}

function IconRow({ count, icon, color, max = 30 }: { count: number; icon: string; color: string; max?: number }) {
  const visible = Math.min(count, max);
  const extra = count - visible;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {Array.from({ length: visible }).map((_, i) => (
        <span key={i} className={`text-lg ${color}`}>{icon}</span>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra}</span>}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-green-600">{formatCurrency(value)}</span>
    </div>
  );
}

export default function EarningsCalculator({ partnerType }: Props) {
  const { config } = usePartnerCommissionConfig();

  // Afiliado sliders
  const [clientes, setClientes] = useState(5);

  // Franqueado sliders
  const [afiliados, setAfiliados] = useState(3);
  const [clientesPorAfiliado, setClientesPorAfiliado] = useState(5);

  // Diretor sliders
  const [franqueados, setFranqueados] = useState(2);
  const [afiliadosPorFranqueado, setAfiliadosPorFranqueado] = useState(3);
  const [clientesPorAfiliadoDir, setClientesPorAfiliadoDir] = useState(5);

  if (partnerType === 'afiliado') {
    const adesao = clientes * config.valor_adesao * (config.comissao_adesao_afiliado / 100);
    const recorrente = clientes * config.valor_mensalidade * (config.comissao_recorrente_afiliado / 100);
    const total = adesao + recorrente;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💰 Calculadora de Ganhos — Afiliado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Clientes indicados</span>
              <span className="font-bold text-orange-500">{clientes}</span>
            </div>
            <Slider
              min={1} max={50} step={1}
              value={[clientes]}
              onValueChange={([v]) => setClientes(v)}
              className="w-full"
            />
          </div>

          <IconRow count={clientes} icon="👤" color="text-orange-500" max={30} />

          <div className="space-y-1 pt-2">
            <ResultRow label={`Adesão (${config.comissao_adesao_afiliado}% × ${clientes} clientes)`} value={adesao} />
            <ResultRow label={`Recorrente/mês (${config.comissao_recorrente_afiliado}% × ${clientes} clientes)`} value={recorrente} />
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Total estimado</span>
              <span className="text-xl font-bold text-gradient-gold">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (partnerType === 'franqueado') {
    const totalClientes = afiliados * clientesPorAfiliado;
    const comAdesoes = totalClientes * config.valor_adesao * (config.comissao_adesao_franqueado / 100);
    const comRecorrente = totalClientes * config.valor_mensalidade * (config.comissao_recorrente_franqueado / 100);
    const total = comAdesoes + comRecorrente;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💰 Calculadora de Ganhos — Franqueado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Afiliados na rede</span>
              <span className="font-bold text-blue-500">{afiliados}</span>
            </div>
            <Slider min={1} max={20} step={1} value={[afiliados]} onValueChange={([v]) => setAfiliados(v)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Clientes por afiliado</span>
              <span className="font-bold text-orange-500">{clientesPorAfiliado}</span>
            </div>
            <Slider min={1} max={20} step={1} value={[clientesPorAfiliado]} onValueChange={([v]) => setClientesPorAfiliado(v)} />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-1">Afiliados</p>
            <IconRow count={afiliados} icon="🏪" color="text-blue-500" max={20} />
            <p className="text-xs text-muted-foreground mt-2 mb-1">Clientes totais ({totalClientes})</p>
            <IconRow count={Math.min(totalClientes, 30)} icon="👤" color="text-orange-500" max={30} />
          </div>

          <div className="space-y-1 pt-2">
            <ResultRow label={`Sobre adesões (${config.comissao_adesao_franqueado}%)`} value={comAdesoes} />
            <ResultRow label={`Recorrente/mês (${config.comissao_recorrente_franqueado}%)`} value={comRecorrente} />
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Total estimado</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Diretor
  const totalAfiliados = franqueados * afiliadosPorFranqueado;
  const totalClientes = totalAfiliados * clientesPorAfiliadoDir;
  const comAfiliados = totalAfiliados * config.valor_adesao * (config.comissao_adesao_diretor / 100);
  const comFranqueados = totalClientes * config.valor_mensalidade * (config.comissao_recorrente_diretor / 100);
  const total = comAfiliados + comFranqueados;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">💰 Calculadora de Ganhos — Diretor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Franqueados</span>
            <span className="font-bold text-purple-500">{franqueados}</span>
          </div>
          <Slider min={1} max={10} step={1} value={[franqueados]} onValueChange={([v]) => setFranqueados(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Afiliados por franqueado</span>
            <span className="font-bold text-blue-500">{afiliadosPorFranqueado}</span>
          </div>
          <Slider min={1} max={10} step={1} value={[afiliadosPorFranqueado]} onValueChange={([v]) => setAfiliadosPorFranqueado(v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Clientes por afiliado</span>
            <span className="font-bold text-orange-500">{clientesPorAfiliadoDir}</span>
          </div>
          <Slider min={1} max={20} step={1} value={[clientesPorAfiliadoDir]} onValueChange={([v]) => setClientesPorAfiliadoDir(v)} />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Franqueados</p>
          <IconRow count={franqueados} icon="👑" color="text-purple-500" max={10} />
          <p className="text-xs text-muted-foreground mt-2 mb-1">Afiliados ({totalAfiliados})</p>
          <IconRow count={Math.min(totalAfiliados, 20)} icon="🏪" color="text-blue-500" max={20} />
          <p className="text-xs text-muted-foreground mt-2 mb-1">Clientes ({totalClientes})</p>
          <IconRow count={Math.min(totalClientes, 30)} icon="👤" color="text-orange-500" max={30} />
        </div>

        <div className="space-y-1 pt-2">
          <ResultRow label={`Sobre afiliados/adesões (${config.comissao_adesao_diretor}%)`} value={comAfiliados} />
          <ResultRow label={`Sobre franqueados/recorrente (${config.comissao_recorrente_diretor}%)`} value={comFranqueados} />
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold">Total estimado</span>
            <span className="text-xl font-bold text-purple-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
