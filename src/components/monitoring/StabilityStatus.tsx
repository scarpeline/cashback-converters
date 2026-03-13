/**
 * Componente de Status de Estabilidade
 * Exibe informações sobre a saúde do sistema em tempo real
 */

import React, { useState, useEffect } from 'react';
import { useStabilityMonitor } from '@/lib/stability-monitor';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Clock,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

interface StabilityStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function StabilityStatus({ showDetails = false, className }: StabilityStatusProps) {
  const { validateSystem, getErrorSummary, getRecentLogs } = useStabilityMonitor();
  const [status, setStatus] = useState<'checking' | 'stable' | 'unstable' | 'error'>('checking');
  const [report, setReport] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkStability();
    const interval = setInterval(checkStability, 30000); // Verificar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const checkStability = async () => {
    try {
      setStatus('checking');
      const systemReport = await validateSystem();
      setReport(systemReport);
      
      const isStable = systemReport.page.isValid && 
                      systemReport.routes.every((r: any) => r.status === 'OK') &&
                      systemReport.errors.length === 0;
      
      setStatus(isStable ? 'stable' : 'unstable');
    } catch (error) {
      setStatus('error');
      console.error('Erro ao verificar estabilidade:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'stable':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'unstable':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unstable':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'checking':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'stable':
        return 'Sistema Estável';
      case 'unstable':
        return 'Sistema Instável';
      case 'error':
        return 'Erro Crítico';
      case 'checking':
        return 'Verificando...';
      default:
        return 'Desconhecido';
    }
  };

  const recentErrors = getErrorSummary();
  const recentLogs = getRecentLogs(5);

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <Badge className={getStatusColor()} variant="outline">
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Status do Sistema</CardTitle>
          </div>
          <Badge className={getStatusColor()} variant="outline">
            {getStatusText()}
          </Badge>
        </div>
        <CardDescription>
          Monitoramento em tempo real da saúde e performance do sistema
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Performance</p>
              <p className="text-xs text-gray-500">
                {report?.page?.performance ? `${report.page.performance.toFixed(0)}ms` : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-xs text-gray-500">99.9%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Rotas</p>
              <p className="text-xs text-gray-500">
                {report?.routes?.filter((r: any) => r.status === 'OK').length || 0}/
                {report?.routes?.length || 0}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Erros</p>
              <p className="text-xs text-gray-500">{recentErrors.length}</p>
            </div>
          </div>
        </div>

        {/* Alertas de Erro */}
        {recentErrors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: {recentErrors.length} erro(s) detectado(s)</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {recentErrors.slice(0, 3).map(([error, count], index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{error}</span> ({count} ocorrências)
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Logs Recentes */}
        {recentLogs.length > 0 && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mb-2"
            >
              Logs Recentes ({recentLogs.length})
            </Button>
            
            {isExpanded && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentLogs.map((log, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.level === 'ERROR' ? 'destructive' : 'outline'}>
                        {log.level}
                      </Badge>
                      <span className="font-medium">{log.component}</span>
                      <span className="text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button onClick={checkStability} size="sm" variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Verificar Agora
          </Button>
          
          <Button 
            onClick={() => window.open('/dashboard/superadmin/system-logs', '_blank')}
            size="sm" 
            variant="outline"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente compacto para header
export function StabilityIndicator() {
  return <StabilityStatus showDetails={false} />;
}
