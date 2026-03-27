import { useState, useCallback, useEffect } from 'react';
import {
  getInactiveClients,
  sendReactivationMessage,
  runReactivationCampaign,
  getReactivationStats,
  trackReactivationResponse,
  type InactiveClient,
} from '@/services/clientReactivationService';

export interface ReactivationStats {
  total_campaigns: number;
  total_sent: number;
  total_successful: number;
  success_rate: number;
  avg_response_time: number;
}

export function useClientReactivation() {
  const [inactiveClients, setInactiveClients] = useState<InactiveClient[]>([]);
  const [stats, setStats] = useState<ReactivationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignRunning, setCampaignRunning] = useState(false);

  // Buscar clientes inativos
  const fetchInactiveClients = useCallback(
    async (daysInactive: number = 15, limit: number = 100) => {
      try {
        setLoading(true);
        setError(null);
        const clients = await getInactiveClients(daysInactive, limit);
        setInactiveClients(clients);
        return clients;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar clientes inativos';
        setError(message);
        console.error('Erro ao buscar clientes inativos:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const data = await getReactivationStats();
      setStats(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar estatísticas';
      setError(message);
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    }
  }, []);

  // Enviar mensagem para um cliente
  const sendMessage = useCallback(
    async (client: InactiveClient, customMessage?: string) => {
      try {
        setError(null);
        const result = await sendReactivationMessage(client, customMessage);
        
        if (result.success) {
          // Atualizar lista removendo o cliente
          setInactiveClients(prev => prev.filter(c => c.id !== client.id));
          // Atualizar estatísticas
          await fetchStats();
        }
        
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(message);
        console.error('Erro ao enviar mensagem:', err);
        return { success: false };
      }
    },
    [fetchStats]
  );

  // Executar campanha completa
  const runCampaign = useCallback(
    async (daysInactive: number = 15, limit: number = 50) => {
      try {
        setCampaignRunning(true);
        setError(null);
        
        const result = await runReactivationCampaign(daysInactive, limit);
        
        // Atualizar dados após campanha
        await fetchInactiveClients(daysInactive, limit);
        await fetchStats();
        
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao executar campanha';
        setError(message);
        console.error('Erro ao executar campanha:', err);
        return { total: 0, sent: 0, failed: 0 };
      } finally {
        setCampaignRunning(false);
      }
    },
    [fetchInactiveClients, fetchStats]
  );

  // Rastrear resposta de cliente
  const trackResponse = useCallback(
    async (clientId: string, responseType: 'scheduled' | 'declined' | 'no_response') => {
      try {
        setError(null);
        await trackReactivationResponse(clientId, responseType);
        
        // Atualizar lista
        setInactiveClients(prev => prev.filter(c => c.id !== clientId));
        // Atualizar estatísticas
        await fetchStats();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao rastrear resposta';
        setError(message);
        console.error('Erro ao rastrear resposta:', err);
      }
    },
    [fetchStats]
  );

  // Carregar dados iniciais
  useEffect(() => {
    fetchInactiveClients();
    fetchStats();
  }, [fetchInactiveClients, fetchStats]);

  return {
    inactiveClients,
    stats,
    loading,
    error,
    campaignRunning,
    fetchInactiveClients,
    fetchStats,
    sendMessage,
    runCampaign,
    trackResponse,
  };
}
