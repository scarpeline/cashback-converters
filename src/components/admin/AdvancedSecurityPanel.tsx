import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Eye, AlertTriangle, Activity, Users, Calendar, 
  TrendingUp, Lock, Database, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useFeature } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SecurityStats {
  total_logs: number;
  high_risk_events: number;
  blocked_ips_count: number;
  failed_logins_24h: number;
  open_vulnerabilities: number;
  critical_vulnerabilities: number;
}

interface SecurityLog {
  id: string;
  user_id: string;
  ip_address: string;
  action: string;
  risk_level: string;
  details: any;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_until: string;
  attempts_count: number;
  last_attempt_at: string;
}

interface Vulnerability {
  id: string;
  scan_type: string;
  severity: string;
  description: string;
  affected_endpoint: string;
  status: string;
  created_at: string;
}

export function AdvancedSecurityPanel() {
  const { enabled: securityEnabled } = useFeature('advanced_security');
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (securityEnabled) {
      loadSecurityData();
    }
  }, [securityEnabled]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas
      const { data: statsData } = await db.rpc('get_security_stats');
      if (statsData) {
        setStats(statsData[0]);
      }

      // Carregar logs recentes
      const { data: logsData } = await db
        .from('security_logs')
        .select(`
          *,
          user:profiles(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (logsData) {
        setRecentLogs(logsData);
      }

      // Carregar IPs bloqueados
      const { data: ipsData } = await db
        .from('blocked_ips')
        .select('*')
        .order('blocked_until', { ascending: false })
        .limit(10);
      
      if (ipsData) {
        setBlockedIPs(ipsData);
      }

      // Carregar vulnerabilidades
      const { data: vulnData } = await db
        .from('vulnerability_scans')
        .select('*')
        .eq('status', 'open')
        .order('severity', { ascending: false })
        .limit(10);
      
      if (vulnData) {
        setVulnerabilities(vulnData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress: string) => {
    try {
      const { error } = await db.rpc('unblock_ip', { p_ip_address: ipAddress });
      
      if (error) {
        throw error;
      }

      // Recarregar dados
      await loadSecurityData();
    } catch (error) {
      console.error('Erro ao desbloquear IP:', error);
    }
  };

  const handleScanVulnerabilities = async () => {
    try {
      const { data } = await supabase.rpc('scan_vulnerabilities');
      
      if (data) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Erro ao escanear vulnerabilidades:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!securityEnabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sistema de Segurança Desativado</h3>
          <p className="text-muted-foreground mb-4">
            Ative o módulo de segurança avançada para acessar este painel.
          </p>
          <Button onClick={() => window.location.href = '/admin/features'}>
            Ativar Sistema de Segurança
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Segurança Avançada</h2>
          <p className="text-muted-foreground">
            Monitoramento e proteção do sistema
          </p>
        </div>
        <Button onClick={handleScanVulnerabilities}>
          <Shield className="w-4 h-4 mr-2" />
          Escanear Vulnerabilidades
        </Button>
      </div>

      {/* Estatísticas de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Logs (7d)</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats?.total_logs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Alto Risco</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{stats?.high_risk_events || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">IPs Bloqueados</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats?.blocked_ips_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Falhas Login (24h)</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats?.failed_logins_24h || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Vulnerabilidades</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats?.open_vulnerabilities || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Críticas</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats?.critical_vulnerabilities || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Logs de Segurança Recentes
          </CardTitle>
          <CardDescription>
            Atividades recentes monitoradas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(log.risk_level)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <Badge className={`text-xs ${getRiskLevelColor(log.risk_level)}`}>
                        {log.risk_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.user?.name || 'Usuário desconhecido'} • {log.ip_address}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IPs Bloqueados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            IPs Bloqueados
          </CardTitle>
          <CardDescription>
            Endereços IP bloqueados por atividades suspeitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blockedIPs.map((ip) => (
              <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-medium">{ip.ip_address}</div>
                    <div className="text-sm text-muted-foreground">
                      {ip.reason} • {ip.attempts_count} tentativas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(ip.blocked_until), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblockIP(ip.ip_address)}
                  >
                    Desbloquear
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Vulnerabilidades Detectadas
          </CardTitle>
          <CardDescription>
            Problemas de segurança identificados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vulnerabilities.map((vuln) => (
              <div key={vuln.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vuln.scan_type}</span>
                      <Badge className={`text-xs ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vuln.description}
                      {vuln.affected_endpoint && ` • ${vuln.affected_endpoint}`}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(vuln.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
