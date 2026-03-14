import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, Download, Upload, Calendar, CheckCircle, 
  XCircle, Clock, HardDrive, Shield, Settings
} from 'lucide-react';
import { useFeature } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupStats {
  total_backups: number;
  completed_backups: number;
  failed_backups: number;
  total_size_gb: number;
  last_backup_date: string;
  oldest_backup_date: string;
  retention_days: number;
}

interface Backup {
  id: string;
  file_name: string;
  file_size: number;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at: string;
  checksum: string;
}

interface BackupSettings {
  backup_frequency: string;
  retention_days: number;
  backup_location: string;
  encryption_enabled: boolean;
  compression_enabled: boolean;
  auto_cleanup: boolean;
  notification_emails: string[];
}

export function BackupSystemPanel() {
  const { enabled: backupEnabled } = useFeature('backup_system');
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (backupEnabled) {
      loadBackupData();
    }
  }, [backupEnabled]);

  const loadBackupData = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas
      const { data: statsData } = await db.rpc('get_backup_stats');
      if (statsData) {
        setStats(statsData[0]);
      }

      // Carregar backups recentes
      const { data: backupsData } = await db
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (backupsData) {
        setBackups(backupsData);
      }

      // Carregar configurações
      const { data: settingsData } = await db
        .from('backup_settings')
        .select('*')
        .limit(1);
      
      if (settingsData) {
        setSettings(settingsData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (type: string = 'full') => {
    setCreating(true);
    try {
      const { data } = await supabase.rpc('start_backup', { p_backup_type: type });
      
      if (data) {
        await loadBackupData();
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const { data } = await supabase.rpc('restore_backup', { p_backup_id: backupId });
      
      if (data) {
        // Backup restaurado com sucesso
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
    } finally {
      setRestoring(null);
    }
  };

  const handleCleanup = async () => {
    try {
      const { data } = await supabase.rpc('cleanup_old_backups');
      
      if (data) {
        await loadBackupData();
      }
    } catch (error) {
      console.error('Erro ao limpar backups:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'running': return Clock;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!backupEnabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sistema de Backup Desativado</h3>
          <p className="text-muted-foreground mb-4">
            Ative o módulo de backup automático para acessar este painel.
          </p>
          <Button onClick={() => window.location.href = '/admin/features'}>
            Ativar Sistema de Backup
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
          <h2 className="text-2xl font-bold">Sistema de Backup</h2>
          <p className="text-muted-foreground">
            Backup automático e restauração do banco de dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCreateBackup('full')} disabled={creating}>
            <Download className="w-4 h-4 mr-2" />
            {creating ? 'Criando...' : 'Criar Backup'}
          </Button>
          <Button variant="outline" onClick={handleCleanup}>
            <Settings className="w-4 h-4 mr-2" />
            Limpar Antigos
          </Button>
        </div>
      </div>

      {/* Estatísticas de Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Backups</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats?.total_backups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Concluídos</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats?.completed_backups || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Espaço Usado</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats?.total_size_gb || 0} GB</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Retenção</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats?.retention_days || 0} dias</div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Atuais */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações do Sistema
            </CardTitle>
            <CardDescription>
              Configurações atuais do sistema de backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Frequência</div>
                <Badge variant="outline">{settings.backup_frequency}</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Localização</div>
                <Badge variant="outline">{settings.backup_location}</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Criptografia</div>
                <Badge className={settings.encryption_enabled ? 'bg-green-500' : 'bg-red-500'}>
                  {settings.encryption_enabled ? 'Ativada' : 'Desativada'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Compressão</div>
                <Badge className={settings.compression_enabled ? 'bg-green-500' : 'bg-red-500'}>
                  {settings.compression_enabled ? 'Ativada' : 'Desativada'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Limpeza Automática</div>
                <Badge className={settings.auto_cleanup ? 'bg-green-500' : 'bg-red-500'}>
                  {settings.auto_cleanup ? 'Ativada' : 'Desativada'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Notificações</div>
                <Badge variant="outline">
                  {settings.notification_emails?.length || 0} emails
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico de Backups
          </CardTitle>
          <CardDescription>
            backups realizados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.map((backup) => {
              const StatusIcon = getStatusIcon(backup.status);
              return (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-4 h-4 ${
                      backup.status === 'completed' ? 'text-green-500' :
                      backup.status === 'failed' ? 'text-red-500' :
                      'text-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{backup.file_name}</span>
                        <Badge className={`text-xs ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {backup.backup_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(backup.file_size)} • {backup.checksum?.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm">
                        {format(new Date(backup.started_at), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                      {backup.completed_at && (
                        <div className="text-xs text-muted-foreground">
                          Concluído: {format(new Date(backup.completed_at), "dd/MM HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                    {backup.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={restoring === backup.id}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {restoring === backup.id ? 'Restaurando...' : 'Restaurar'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Segurança */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Backups são criptografados com AES256 e armazenados de forma segura. 
          A restauração substituirá completamente o banco de dados atual.
        </AlertDescription>
      </Alert>
    </div>
  );
}
