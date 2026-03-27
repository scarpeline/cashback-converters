import { useEffect, useState } from 'react';
import { useAdvancedAIStats } from '@/hooks/useEnhancedAI';
import { Card } from '@/components/ui/card';
import { Loader2, MessageSquare, Users, Mic, BarChart3 } from 'lucide-react';

export function AIDashboard() {
  const { stats, loadStats } = useAdvancedAIStats();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadStats();
      setIsLoading(false);
    };
    loadData();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <Card className={`p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-3xl opacity-20">{Icon}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de IA</h2>
        <p className="text-gray-600 mt-1">Estatísticas e métricas do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MessageSquare />}
          label="Total de Conversas"
          value={stats.totalConversations}
          color="border-blue-500"
        />
        <StatCard
          icon={<Users />}
          label="Clientes Únicos"
          value={stats.uniqueClients}
          color="border-green-500"
        />
        <StatCard
          icon={<Mic />}
          label="Conversas por Áudio"
          value={stats.audioConversations}
          color="border-purple-500"
        />
        <StatCard
          icon={<BarChart3 />}
          label="Confiança Média"
          value={`${(stats.averageConfidence * 100).toFixed(1)}%`}
          color="border-orange-500"
        />
      </div>

      {/* Conversation Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipos de Conversa</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Texto</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.totalConversations > 0
                        ? (stats.textConversations / stats.totalConversations) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-semibold">
                {stats.textConversations}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Áudio</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.totalConversations > 0
                        ? (stats.audioConversations / stats.totalConversations) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-semibold">
                {stats.audioConversations}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Most Common Intents */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Intenções Mais Comuns</h3>
        <div className="space-y-2">
          {Object.entries(stats.mostUsedIntents)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([intent, count]) => (
              <div key={intent} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">
                  {intent.replace(/_/g, ' ')}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {count}
                </span>
              </div>
            ))}
          {Object.keys(stats.mostUsedIntents).length === 0 && (
            <p className="text-gray-400 text-sm">Nenhuma intenção registrada</p>
          )}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Métricas de Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Taxa de Áudio</p>
            <p className="text-2xl font-bold mt-1">
              {stats.totalConversations > 0
                ? (
                    (stats.audioConversations / stats.totalConversations) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Média por Cliente</p>
            <p className="text-2xl font-bold mt-1">
              {stats.uniqueClients > 0
                ? (stats.totalConversations / stats.uniqueClients).toFixed(1)
                : 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> Essas métricas são atualizadas em tempo real.
          Use-as para otimizar o desempenho da IA e melhorar a experiência do
          cliente.
        </p>
      </div>
    </div>
  );
}
