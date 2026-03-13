import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  RefreshCw,
  Play,
  AlertTriangle,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { IntegrationTester, IntegrationTest } from "@/services/integrations/IntegrationTester";

export const IntegrationTestsPanel = () => {
  const [tests, setTests] = useState<IntegrationTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  useEffect(() => {
    // Carregar resultados anteriores se existirem
    setTests(IntegrationTester.getTestResults());
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    setCurrentTest('Iniciando testes...');
    
    try {
      const results = await IntegrationTester.runAllTests();
      setTests(results);
      
      const summary = IntegrationTester.getTestSummary();
      
      if (summary.failed === 0) {
        toast.success(`Todos os ${summary.total} testes passaram com sucesso!`);
      } else {
        toast.warning(`${summary.passed} testes passaram, ${summary.failed} falharam`);
      }
    } catch (error: any) {
      toast.error(`Erro ao executar testes: ${error.message}`);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const runSingleTest = async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);

    try {
      let result: IntegrationTest;
      
      switch (testType) {
        case 'payment':
          result = await IntegrationTester.testPaymentGateway();
          break;
        case 'sms':
          result = await IntegrationTester.testSMS();
          break;
        case 'email':
          result = await IntegrationTester.testEmail();
          break;
        case 'webhook':
          result = await IntegrationTester.testWebhooks();
          break;
        default:
          throw new Error('Tipo de teste desconhecido');
      }

      // Atualizar o teste específico na lista
      setTests(prev => prev.map(t => t.id === result.id ? result : t));
      
      if (result.status === 'success') {
        toast.success(`${result.name} testado com sucesso!`);
      } else {
        toast.error(`Erro em ${result.name}: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const clearResults = () => {
    IntegrationTester.clearResults();
    setTests([]);
    toast.info('Resultados dos testes limpos');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Executando</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const summary = IntegrationTester.getTestSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Testes de Integração
          </h2>
          <p className="text-muted-foreground">
            Verifique o funcionamento de todas as integrações externas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={clearResults}
            disabled={isRunning}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Executar Todos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resumo dos Testes */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resumo dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passaram</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Falharam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{summary.pending}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
            
            {summary.total > 0 && (
              <div className="mt-4">
                <Progress 
                  value={(summary.passed / summary.total) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round((summary.passed / summary.total) * 100)}% dos testes passaram
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Testes */}
      <div className="grid gap-4">
        {[
          { id: 'payment', name: 'Gateway de Pagamento', description: 'Testar conexão com Asaas', icon: '💳' },
          { id: 'sms', name: 'SMS', description: 'Testar integração com Twilio', icon: '📱' },
          { id: 'email', name: 'Email', description: 'Testar integração com Resend', icon: '📧' },
          { id: 'webhook', name: 'Webhooks', description: 'Testar webhooks configurados', icon: '🔗' }
        ].map((testInfo) => {
          const test = tests.find(t => t.id === `${testInfo.id}-gateway` || t.id === `sms-${testInfo.id}` || t.id === `email-${testInfo.id}` || t.id === testInfo.id);
          
          return (
            <Card key={testInfo.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{testInfo.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{testInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{testInfo.description}</p>
                      
                      {test && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            {getStatusBadge(test.status)}
                            {test.duration && (
                              <span className="text-xs text-muted-foreground">
                                {test.duration}ms
                              </span>
                            )}
                          </div>
                          
                          {test.error && (
                            <p className="text-sm text-red-600">{test.error}</p>
                          )}
                          
                          {test.result && (
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(test.result).map(([key, value]) => (
                                <div key={key}>
                                  <strong>{key}:</strong> {JSON.stringify(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runSingleTest(testInfo.id)}
                    disabled={isRunning && currentTest !== testInfo.id}
                  >
                    {isRunning && currentTest === testInfo.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tests.length === 0 && !isRunning && (
        <Card>
          <CardContent className="py-12 text-center">
            <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum teste executado ainda.
            </p>
            <Button onClick={runAllTests}>
              <Play className="w-4 h-4 mr-2" />
              Executar Primeiros Testes
            </Button>
          </CardContent>
        </Card>
      )}

      {isRunning && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-blue-900">Executando testes...</p>
                <p className="text-sm text-blue-700">
                  {currentTest || 'Aguarde...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
