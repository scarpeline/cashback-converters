import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Calendar, DollarSign, Filter, Search } from 'lucide-react';

interface Debt {
  id: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid';
  service: string;
  days_overdue?: number;
}

const DividasPage = () => {
  const [debts, setDebts] = useState<Debt[]>([
    {
      id: '1',
      client_name: 'João Silva',
      amount: 150.00,
      due_date: '2024-06-10',
      status: 'overdue',
      service: 'Corte + Barba',
      days_overdue: 7
    },
    {
      id: '2',
      client_name: 'Maria Santos',
      amount: 85.00,
      due_date: '2024-06-15',
      status: 'pending',
      service: 'Corte Masculino'
    },
    {
      id: '3',
      client_name: 'Pedro Costa',
      amount: 200.00,
      due_date: '2024-06-05',
      status: 'overdue',
      service: 'Corte + Tratamento',
      days_overdue: 12
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || debt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalOverdue = debts
    .filter(d => d.status === 'overdue')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPending = debts
    .filter(d => d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Vencido';
      case 'pending':
        return 'Pendente';
      case 'paid':
        return 'Pago';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Dívidas</h1>
          <p className="text-gray-400">Controle de contas a receber e pagamentos em atraso</p>
        </div>
        <Button className="button-primary">
          <DollarSign className="w-4 h-4 mr-2" />
          Gerar Cobrança
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Total em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              R$ {totalOverdue.toFixed(2)}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {debts.filter(d => d.status === 'overdue').length} dívidas
            </p>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              A Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              R$ {totalPending.toFixed(2)}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {debts.filter(d => d.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="card-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Taxa de Recuperação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">87%</div>
            <p className="text-sm text-gray-400 mt-1">Mês atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-dark">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background-dark border border-border-color rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent-orange"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'button-primary' : 'border-gray-600 text-gray-400'}
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
                className={filterStatus === 'overdue' ? 'button-primary' : 'border-gray-600 text-gray-400'}
              >
                Vencidas
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'button-primary' : 'border-gray-600 text-gray-400'}
              >
                Pendentes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debts List */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle className="text-white">Lista de Dívidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDebts.map((debt) => (
              <div key={debt.id} className="border border-border-color rounded-lg p-4 hover:border-accent-orange transition-colors">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{debt.client_name}</h3>
                      <Badge className={getStatusColor(debt.status)}>
                        {getStatusText(debt.status)}
                      </Badge>
                      {debt.days_overdue && (
                        <Badge variant="outline" className="text-red-400 border-red-400/30">
                          {debt.days_overdue} dias
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{debt.service}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Vencimento: {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xl font-bold text-white">
                      R$ {debt.amount.toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-400">
                        Enviar Lembrete
                      </Button>
                      <Button size="sm" className="button-primary">
                        Receber
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDebts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhuma dívida encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DividasPage;
