import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Percent,
  ArrowRight,
  Info,
  Rocket
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SimulatorProps {
  variant: 'afiliado' | 'barbearia';
  onCTA?: () => void;
}

// Internal factors (not shown to user)
const INTERNAL_FACTORS = {
  directFactor: 0.08, // Hidden commission factor
  indirectFactor: 0.03, // Sub-affiliate factor
};

const EarningsSimulator = ({ variant, onCTA }: SimulatorProps) => {
  // Affiliate inputs
  const [barbershops, setBarbershops] = useState(5);
  const [ticketMedio, setTicketMedio] = useState(500);
  const [adesaoPercent, setAdesaoPercent] = useState(60);
  const [subAfiliados, setSubAfiliados] = useState(2);
  const [producaoSubAfiliado, setProducaoSubAfiliado] = useState(300);
  const [crescimentoMensal, setCrescimentoMensal] = useState(10);

  // Barbershop inputs
  const [clientesAtivos, setClientesAtivos] = useState(100);
  const [ticketServico, setTicketServico] = useState(50);
  const [indicacoesMes, setIndicacoesMes] = useState(10);
  const [cashbackRate, setCashbackRate] = useState(5);

  const calculations = useMemo(() => {
    if (variant === 'afiliado') {
      const receitaDireta = barbershops * ticketMedio * INTERNAL_FACTORS.directFactor * (adesaoPercent / 100);
      const receitaIndireta = subAfiliados * producaoSubAfiliado * INTERNAL_FACTORS.indirectFactor;
      const ganhoMensal = receitaDireta + receitaIndireta;
      
      const projecao6Meses = ganhoMensal * Math.pow(1 + crescimentoMensal / 100, 6);
      const projecao12Meses = ganhoMensal * Math.pow(1 + crescimentoMensal / 100, 12);

      return {
        receitaDireta,
        receitaIndireta,
        ganhoMensal,
        projecao6Meses,
        projecao12Meses,
        barbershopsAtivos: barbershops,
        subAfiliadosAtivos: subAfiliados
      };
    } else {
      // Barbershop variant
      const faturamentoBase = clientesAtivos * ticketServico;
      const faturamentoIndicacoes = indicacoesMes * ticketServico * 0.8;
      const cashbackDistribuido = faturamentoBase * (cashbackRate / 100);
      const faturamentoTotal = faturamentoBase + faturamentoIndicacoes;
      
      const projecao6Meses = faturamentoTotal * Math.pow(1 + crescimentoMensal / 100, 6);
      const projecao12Meses = faturamentoTotal * Math.pow(1 + crescimentoMensal / 100, 12);

      return {
        receitaDireta: faturamentoBase,
        receitaIndireta: faturamentoIndicacoes,
        ganhoMensal: faturamentoTotal,
        projecao6Meses,
        projecao12Meses,
        cashbackDistribuido,
        clientesAtivos,
        indicacoesMes
      };
    }
  }, [
    variant, barbershops, ticketMedio, adesaoPercent, subAfiliados, 
    producaoSubAfiliado, crescimentoMensal, clientesAtivos, ticketServico,
    indicacoesMes, cashbackRate
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {variant === 'afiliado' 
              ? 'Veja como seus ganhos podem crescer conforme sua base cresce'
              : 'Veja como sua barbearia pode faturar mais mês após mês'
            }
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simule cenários reais, entenda o potencial da sua rede e visualize a escala do seu negócio — sem promessas irreais.
          </p>
        </div>

        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-10">
              {/* Left Column - Inputs */}
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold flex items-center gap-2 mb-6">
                  <Rocket className="w-5 h-5 text-primary" />
                  Ajuste os valores
                </h3>

                {variant === 'afiliado' ? (
                  <>
                    {/* Barbershops Input */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          Barbearias ativas indicadas
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Este valor é apenas uma simulação para ajudar no planejamento.</p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <Input
                          type="number"
                          value={barbershops}
                          onChange={(e) => setBarbershops(Number(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                      </div>
                      <Slider
                        value={[barbershops]}
                        onValueChange={([v]) => setBarbershops(v)}
                        max={50}
                        step={1}
                      />
                    </div>

                    {/* Ticket Médio */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          Ticket médio mensal (R$)
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Valor médio mensal por barbearia ativa.</p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="font-semibold text-primary">{formatCurrency(ticketMedio)}</span>
                      </div>
                      <Slider
                        value={[ticketMedio]}
                        onValueChange={([v]) => setTicketMedio(v)}
                        min={200}
                        max={2000}
                        step={50}
                      />
                    </div>

                    {/* Adesão */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          Percentual estimado de adesão
                        </span>
                        <span className="font-semibold text-primary">{adesaoPercent}%</span>
                      </div>
                      <Slider
                        value={[adesaoPercent]}
                        onValueChange={([v]) => setAdesaoPercent(v)}
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>

                    {/* Sub-afiliados */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          Subafiliados ativos
                        </span>
                        <Input
                          type="number"
                          value={subAfiliados}
                          onChange={(e) => setSubAfiliados(Number(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                      </div>
                      <Slider
                        value={[subAfiliados]}
                        onValueChange={([v]) => setSubAfiliados(v)}
                        max={20}
                        step={1}
                      />
                    </div>

                    {/* Produção Sub-afiliado */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none">Produção média mensal por subafiliado</span>
                        <span className="font-semibold text-primary">{formatCurrency(producaoSubAfiliado)}</span>
                      </div>
                      <Slider
                        value={[producaoSubAfiliado]}
                        onValueChange={([v]) => setProducaoSubAfiliado(v)}
                        min={100}
                        max={1000}
                        step={50}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Clientes Ativos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          Clientes ativos mensais
                        </span>
                        <Input
                          type="number"
                          value={clientesAtivos}
                          onChange={(e) => setClientesAtivos(Number(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                      </div>
                      <Slider
                        value={[clientesAtivos]}
                        onValueChange={([v]) => setClientesAtivos(v)}
                        max={500}
                        step={10}
                      />
                    </div>

                    {/* Ticket Serviço */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none">Ticket médio por serviço (R$)</span>
                        <span className="font-semibold text-primary">{formatCurrency(ticketServico)}</span>
                      </div>
                      <Slider
                        value={[ticketServico]}
                        onValueChange={([v]) => setTicketServico(v)}
                        min={20}
                        max={150}
                        step={5}
                      />
                    </div>

                    {/* Indicações */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          Novos clientes via indicação/mês
                        </span>
                        <Input
                          type="number"
                          value={indicacoesMes}
                          onChange={(e) => setIndicacoesMes(Number(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                      </div>
                      <Slider
                        value={[indicacoesMes]}
                        onValueChange={([v]) => setIndicacoesMes(v)}
                        max={50}
                        step={1}
                      />
                    </div>

                    {/* Cashback Rate */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-none flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          Taxa de cashback
                        </span>
                        <span className="font-semibold text-primary">{cashbackRate}%</span>
                      </div>
                      <Slider
                        value={[cashbackRate]}
                        onValueChange={([v]) => setCashbackRate(v)}
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                  </>
                )}

                {/* Crescimento Mensal (both variants) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium leading-none flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      Crescimento mensal estimado
                    </span>
                    <span className="font-semibold text-primary">{crescimentoMensal}%</span>
                  </div>
                  <Slider
                    value={[crescimentoMensal]}
                    onValueChange={([v]) => setCrescimentoMensal(v)}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                <h3 className="font-display text-xl font-semibold flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Resultados Estimados
                </h3>

                {/* Main Result */}
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Ganho Mensal Estimado</p>
                    <p className="text-4xl sm:text-5xl font-display font-bold text-gradient-gold">
                      {formatCurrency(calculations.ganhoMensal)}
                    </p>
                  </CardContent>
                </Card>

                {/* Breakdown Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {variant === 'afiliado' ? 'Receita Direta' : 'Faturamento Base'}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(calculations.receitaDireta)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {variant === 'afiliado' ? 'Receita Indireta' : 'Via Indicações'}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(calculations.receitaIndireta)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Projections Table */}
                <Card className="bg-muted/20 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Projeções de Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Período</TableHead>
                          <TableHead className="text-right">Estimativa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Atual</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(calculations.ganhoMensal)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Em 6 meses</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(calculations.projecao6Meses)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Em 12 meses</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(calculations.projecao12Meses)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Growth Visualization */}
                <div className="flex items-end justify-around h-32 px-4">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-16 bg-muted rounded-t transition-all duration-500"
                      style={{ height: '30%' }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">Atual</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-16 bg-primary/60 rounded-t transition-all duration-500"
                      style={{ height: `${Math.min(60, 30 * (calculations.projecao6Meses / calculations.ganhoMensal))}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">6 meses</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-16 bg-gradient-gold rounded-t transition-all duration-500"
                      style={{ height: `${Math.min(100, 30 * (calculations.projecao12Meses / calculations.ganhoMensal))}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">12 meses</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={onCTA}
                >
                  🚀 Quero começar agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-3xl mx-auto">
          Esta simulação é apenas ilustrativa e não representa promessa ou garantia de ganhos. 
          Os resultados dependem exclusivamente da performance individual e da adesão da base.
        </p>
      </div>
    </TooltipProvider>
  );
};

export default EarningsSimulator;
