/**
 * Dashboard de Automação para Super Admin
 * Interface completa para gerenciar sistema de reativação
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Send, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Play,
  RefreshCw
} from 'lucide-react';
import { useAutomation, InactivitySettings, AutomationTemplate } from '@/hooks/useAutomation';

export function AutomationDashboard() {
  const {
    inactivitySettings,
    templates,
    tracking,
    sendLogs,
    permissions,
    loading,
    error,
    checkPermission,
    updateInactivitySettings,
    saveTemplate,
    processDailyInactivity,
    loadSendLogs
  } = useAutomation();

  const [activeTab, setActiveTab] = useState('settings');
  const [editingTemplate, setEditingTemplate] = useState<AutomationTemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar permissões
  const canConfigure = checkPermission('can_configure_inactivity');
  const canCreateTemplates = checkPermission('can_create_templates');
  const canViewLogs = checkPermission('can_view_logs');
  const canManage = checkPermission('can_manage_automation');

  // Estados para configuração
  const [settingsForm, setSettingsForm] = useState<Record<string, { days: number; enabled: boolean }>>({});

  // Estados para template
  const [templateForm, setTemplateForm] = useState<Partial<AutomationTemplate>>({
    name: '',
    channel: 'email',
    user_role: 'cliente',
    subject: '',
    content: '',
    is_active: true
  });

  // Inicializar formulários
  useEffect(() => {
    const form: Record<string, { days: number; enabled: boolean }> = {};
    inactivitySettings.forEach(setting => {
      form[setting.user_role] = {
        days: setting.inactivity_days,
        enabled: setting.is_enabled
      };
    });
    setSettingsForm(form);
  }, [inactivitySettings]);

  // Salvar configurações de inatividade
  const handleSaveSettings = async () => {
    if (!canConfigure) return;

    try {
      const updates = Object.entries(settingsForm).map(([role, config]) => ({
        user_role: role,
        inactivity_days: config.days,
        is_enabled: config.enabled
      }));

      await updateInactivitySettings(updates);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  };

  // Salvar template
  const handleSaveTemplate = async () => {
    if (!canCreateTemplates) return;

    try {
      await saveTemplate(templateForm);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        channel: 'email',
        user_role: 'cliente',
        subject: '',
        content: '',
        is_active: true
      });
    } catch (err) {
      console.error('Erro ao salvar template:', err);
    }
  };

  // Processar inatividade manualmente
  const handleProcessInactivity = async () => {
    if (!canManage) return;

    setIsProcessing(true);
    try {
      await processDailyInactivity();
      await loadSendLogs(50);
    } catch (err) {
      console.error('Erro ao processar inatividade:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Editar template
  const handleEditTemplate = (template: AutomationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm(template);
  };

  // Novo template
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      channel: 'email',
      user_role: 'cliente',
      subject: '',
      content: '',
      is_active: true
    });
  };

  // Estatísticas
  const stats = {
    totalUsers: tracking.length,
    activeUsers: tracking.filter(t => t.status === 'active').length,
    inactiveUsers: tracking.filter(t => t.status === 'inactive').length,
    warningUsers: tracking.filter(t => t.status === 'warning').length,
    totalSent: sendLogs.filter(l => l.status === 'sent').length,
    totalDelivered: sendLogs.filter(l => l.status === 'delivered').length,
    totalFailed: sendLogs.filter(l => l.status === 'failed').length
  };

  if (!canViewLogs && !canConfigure && !canCreateTemplates) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar o sistema de automação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automação de Reativação</h1>
          <p className="text-gray-600">Gerencie o sistema automático de reativação de usuários</p>
        </div>
        {canManage && (
          <Button onClick={handleProcessInactivity} disabled={isProcessing}>
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Processar Inatividade
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Alerta</p>
                <p className="text-2xl font-bold">{stats.warningUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {canConfigure && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          )}
          {canCreateTemplates && (
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Templates
            </TabsTrigger>
          )}
          {canViewLogs && (
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tracking
            </TabsTrigger>
          )}
          {canViewLogs && (
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Logs
            </TabsTrigger>
          )}
        </TabsList>

        {/* Configurações de Inatividade */}
        {canConfigure && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Inatividade</CardTitle>
                <CardDescription>
                  Defina o número de dias de inatividade para cada perfil de usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settingsForm).map(([role, config]) => (
                  <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => 
                          setSettingsForm(prev => ({
                            ...prev,
                            [role]: { ...prev[role], enabled }
                          }))
                        }
                      />
                      <div>
                        <Label className="font-medium">{role.replace('_', ' ').toUpperCase()}</Label>
                        <p className="text-sm text-gray-500">Perfil de usuário</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={config.days}
                        onChange={(e) => 
                          setSettingsForm(prev => ({
                            ...prev,
                            [role]: { ...prev[role], days: parseInt(e.target.value) || 30 }
                          }))
                        }
                        className="w-20"
                        disabled={!config.enabled}
                      />
                      <Label>dias</Label>
                    </div>
                  </div>
                ))}
                <Button onClick={handleSaveSettings} disabled={loading}>
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Templates de Mensagem */}
        {canCreateTemplates && (
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Templates de Mensagem</CardTitle>
                    <CardDescription>
                      Crie e personalize mensagens para cada canal e perfil
                    </CardDescription>
                  </div>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de Templates */}
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={template.channel === 'email' ? 'default' : 'secondary'}>
                              {template.channel}
                            </Badge>
                            <Badge variant="outline">{template.user_role}</Badge>
                            {template.is_active && <Badge variant="default">Ativo</Badge>}
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-medium">{template.name}</h4>
                        {template.subject && (
                          <p className="text-sm text-gray-600">Assunto: {template.subject}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {template.content}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* Formulário de Template */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">
                      {editingTemplate ? 'Editar Template' : 'Novo Template'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome do template"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="channel">Canal</Label>
                          <Select
                            value={templateForm.channel}
                            onValueChange={(value) => setTemplateForm(prev => ({ ...prev, channel: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="user_role">Perfil</Label>
                          <Select
                            value={templateForm.user_role}
                            onValueChange={(value) => setTemplateForm(prev => ({ ...prev, user_role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="dono">Dono</SelectItem>
                              <SelectItem value="profissional">Profissional</SelectItem>
                              <SelectItem value="afiliado_barbearia">Afiliado Barbearia</SelectItem>
                              <SelectItem value="afiliado_saas">Afiliado SaaS</SelectItem>
                              <SelectItem value="contador">Contador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {templateForm.channel === 'email' && (
                        <div>
                          <Label htmlFor="subject">Assunto</Label>
                          <Input
                            id="subject"
                            value={templateForm.subject}
                            onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Assunto do e-mail"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="content">Conteúdo</Label>
                        <Textarea
                          id="content"
                          value={templateForm.content}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Conteúdo da mensagem. Use variáveis: {nome}, {dias_inativo}, {link_reativacao}"
                          rows={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Variáveis disponíveis: {'{nome}'}, {'{dias_inativo}'}, {'{link_reativacao}'}, {'{email}'}, {'{whatsapp}'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={templateForm.is_active}
                          onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>Template ativo</Label>
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={handleSaveTemplate} disabled={loading}>
                          {editingTemplate ? 'Atualizar' : 'Criar'} Template
                        </Button>
                        {editingTemplate && (
                          <Button variant="outline" onClick={handleNewTemplate}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tracking de Usuários */}
        {canViewLogs && (
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Tracking de Inatividade</CardTitle>
                <CardDescription>
                  Status de inatividade de todos os usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tracking.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant={user.status === 'active' ? 'default' : 
                                       user.status === 'warning' ? 'secondary' :
                                       user.status === 'inactive' ? 'destructive' : 'outline'}>
                            {user.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{user.user_role}</p>
                            <p className="text-sm text-gray-600">
                              Último login: {new Date(user.last_login).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium">{user.inactivity_days} dias</p>
                          <p className="text-sm text-gray-500">
                            {user.notification_count} notificações
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Logs de Envio */}
        {canViewLogs && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Envio</CardTitle>
                <CardDescription>
                  Histórico de todas as mensagens enviadas pelo sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sendLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant={log.status === 'sent' ? 'default' : 
                                       log.status === 'delivered' ? 'secondary' :
                                       log.status === 'failed' ? 'destructive' : 'outline'}>
                            {log.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{log.channel}</p>
                            <p className="text-sm text-gray-600">
                              Para: {log.recipient}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {new Date(log.sent_at).toLocaleString()}
                          </p>
                          {log.error_message && (
                            <p className="text-xs text-red-500 mt-1">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
