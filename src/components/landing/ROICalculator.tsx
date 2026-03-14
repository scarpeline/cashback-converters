import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  Target,
  Zap,
  Award
} from "lucide-react";

interface ROICalculatorProps {
  onCalculate?: (results: ROIResults) => void;
}

interface ROIResults {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyCost: number;
  annualCost: number;
  monthlyProfit: number;
  annualProfit: number;
  roi: number;
  paybackMonths: number;
  timeSaved: number;
  additionalClients: number;
  reductionInNoShows: number;
}

const ROICalculator = ({ onCalculate }: ROICalculatorProps) => {
  const [formData, setFormData] = useState({
    professionals: 1,
    dailyClients: 10,
    averageTicket: 50,
    workingDays: 25,
    currentNoShows: 20,
    timePerClient: 30
  });

  const [results, setResults] = useState<ROIResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const plans = [
    { name: "Iniciante", price: 127, professionals: 1 },
    { name: "Profissional", price: 197, professionals: 3 },
    { name: "Empresarial", price: 397, professionals: 10 },
    { name: "Ilimitado", price: 797, professionals: 999 }
  ];

  useEffect(() => {
    calculateROI();
  }, [formData]);

  const calculateROI = () => {
    setIsCalculating(true);

    setTimeout(() => {
      // Cálculos baseados nos dados do formulário
      const plan = plans.find(p => p.professionals >= formData.professionals) || plans[3];
      const monthlyCost = plan.price;
      const annualCost = monthlyCost * 12;

      // Receita atual
      const currentMonthlyClients = formData.professionals * formData.dailyClients * formData.workingDays;
      const currentMonthlyRevenue = currentMonthlyClients * formData.averageTicket;
      
      // Benefícios do sistema
      const reductionInNoShows = formData.currentNoShows * 0.7; // Redução de 70% em faltas
      const additionalClients = currentMonthlyClients * 0.3; // Aumento de 30% em clientes
      const timeSavedPerClient = formData.timePerClient * 0.4; // Economia de 40% de tempo por cliente
      
      // Nova receita com o sistema
      const newNoShowRate = formData.currentNoShows - reductionInNoShows;
      const effectiveClients = currentMonthlyClients * (1 - newNoShowRate / 100) + additionalClients;
      const newMonthlyRevenue = effectiveClients * formData.averageTicket;
      
      // Economia de tempo
      const monthlyHoursSaved = (effectiveClients * timeSavedPerClient) / 60;
      const monthlyTimeValue = monthlyHoursSaved * 50; // R$50/hora valorizado
      
      // Resultados
      const monthlyProfit = (newMonthlyRevenue - currentMonthlyRevenue) + monthlyTimeValue - monthlyCost;
      const annualProfit = monthlyProfit * 12;
      const roi = ((annualProfit / annualCost) * 100);
      const paybackMonths = monthlyCost > 0 ? Math.ceil(annualCost / (monthlyProfit + monthlyCost)) : 0;

      const calculatedResults: ROIResults = {
        monthlyRevenue: newMonthlyRevenue,
        annualRevenue: newMonthlyRevenue * 12,
        monthlyCost,
        annualCost,
        monthlyProfit,
        annualProfit,
        roi,
        paybackMonths,
        timeSaved: monthlyHoursSaved,
        additionalClients,
        reductionInNoShows: reductionInNoShows
      };

      setResults(calculatedResults);
      setIsCalculating(false);
      
      if (onCalculate) {
        onCalculate(calculatedResults);
      }
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!results) {
    return (
      <div className="flex items-center justify-center p-8">
        <Calculator className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Calculator Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          Calculadora de ROI
        </h3>
        <p className="text-gray-300">
          Veja quanto o Salão CashBack pode aumentar seus lucros
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Input Form */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Informações da sua Barbearia
            </CardTitle>
            <CardDescription className="text-gray-400">
              Preencha os dados para calcular seu retorno
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white text-sm">Profissionais</Label>
                <Input
                  type="number"
                  value={formData.professionals}
                  onChange={(e) => handleInputChange('professionals', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="1"
                  max="50"
                />
              </div>
              
              <div>
                <Label className="text-white text-sm">Clientes/dia/profissional</Label>
                <Input
                  type="number"
                  value={formData.dailyClients}
                  onChange={(e) => handleInputChange('dailyClients', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <Label className="text-white text-sm">Ticket médio (R$)</Label>
                <Input
                  type="number"
                  value={formData.averageTicket}
                  onChange={(e) => handleInputChange('averageTicket', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="10"
                  max="1000"
                />
              </div>
              
              <div>
                <Label className="text-white text-sm">Dias trabalhados/mês</Label>
                <Input
                  type="number"
                  value={formData.workingDays}
                  onChange={(e) => handleInputChange('workingDays', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="1"
                  max="31"
                />
              </div>
              
              <div>
                <Label className="text-white text-sm">Taxa de não comparecimento (%)</Label>
                <Input
                  type="number"
                  value={formData.currentNoShows}
                  onChange={(e) => handleInputChange('currentNoShows', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <Label className="text-white text-sm">Tempo/cliente (minutos)</Label>
                <Input
                  type="number"
                  value={formData.timePerClient}
                  onChange={(e) => handleInputChange('timePerClient', e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min="10"
                  max="120"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Plano Recomendado</span>
              </div>
              <div className="text-white text-2xl font-bold mb-1">
                {plans.find(p => p.professionals >= formData.professionals)?.name}
              </div>
              <div className="text-gray-300">
                {formatCurrency(plans.find(p => p.professionals >= formData.professionals)?.price || 0)}/mês
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          
          {/* Main Results */}
          <Card className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-white mb-2">
                  {formatPercentage(results.roi)}
                </div>
                <div className="text-gray-300 text-lg">
                  Retorno sobre Investimento Anual
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {results.paybackMonths}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Meses para pagar o investimento
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatCurrency(results.annualProfit)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Lucro adicional anual
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">Receita Mensal</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(results.monthlyRevenue)}
                </div>
                <div className="text-green-400 text-sm">
                  +{formatCurrency(results.monthlyRevenue - (formData.professionals * formData.dailyClients * formData.workingDays * formData.averageTicket))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">Novos Clientes</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  +{results.additionalClients}
                </div>
                <div className="text-blue-400 text-sm">
                  Por mês
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Tempo Economizado</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {results.timeSaved.toFixed(1)}h
                </div>
                <div className="text-purple-400 text-sm">
                  Por mês
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium">Redução de Faltas</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  -{results.reductionInNoShows.toFixed(1)}%
                </div>
                <div className="text-orange-400 text-sm">
                  Taxa de não comparecimento
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits List */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <h4 className="text-white font-bold mb-4">Benefícios Incluídos no Cálculo:</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">
                    Redução de 70% na taxa de não comparecimento
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">
                    Aumento de 30% no número de clientes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">
                    Economia de 40% de tempo por atendimento
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">
                    Valorização do tempo economizado (R$50/hora)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">
            Comece a Transformar Seus Resultados Hoje
          </h3>
          <p className="text-white/90 mb-6">
            Teste grátis por 35 dias e veja o ROI na prática
          </p>
          <Button 
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold"
          >
            Começar Teste Grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
