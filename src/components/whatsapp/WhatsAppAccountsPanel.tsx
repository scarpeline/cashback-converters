import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Phone, MessageSquare, Settings, Plus, RefreshCw, Trash2, Crown } from 'lucide-react';
import {
  getWhatsAppAccounts,
  registerWhatsAppAccount,
  verifyPhoneNumber,
  resendVerificationCode,
  setPrimaryAccount,
  deleteWhatsAppAccount,
  updateAccountCredentials,
  WhatsAppAccount,
  AccountWithProfessional,
} from '@/services/whatsappAccountService';
import { getWhatsAppAccountsWithProfessional } from '@/services/whatsappAccountService';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppAccountsPanelProps {
  barbershopId: string;
}

export function WhatsAppAccountsPanel({ barbershopId }: WhatsAppAccountsPanelProps) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountWithProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);

  const [newAccount, setNewAccount] = useState({
    phone_number: '',
    professional_id: '',
    nickname: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [credentials, setCredentials] = useState({
    twilio_sid: '',
    twilio_auth_token: '',
    twilio_messaging_service_sid: '',
  });

  useEffect(() => {
    loadAccounts();
    loadProfessionals();
  }, [barbershopId]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getWhatsAppAccountsWithProfessional(barbershopId);
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar contas WhatsApp', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      const { data } = await (supabase as any)
        .from('professionals')
        .select('id, name')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true);

      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.phone_number) {
      toast({ title: 'Erro', description: 'Informe o número de WhatsApp', variant: 'destructive' });
      return;
    }

    try {
      const result = await registerWhatsAppAccount({
        barbershop_id: barbershopId,
        professional_id: newAccount.professional_id || undefined,
        phone_number: newAccount.phone_number,
        nickname: newAccount.nickname || undefined,
      });

      if (result.success) {
        toast({ title: 'Conta cadastrada', description: 'Código de verificação enviado!' });
        setSelectedAccount(result.account!);
        setShowAddDialog(false);
        setShowVerifyDialog(true);
        setNewAccount({ phone_number: '', professional_id: '', nickname: '' });
        loadAccounts();
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao cadastrar conta', variant: 'destructive' });
    }
  };

  const handleVerify = async () => {
    if (!selectedAccount || !verificationCode) return;

    try {
      const result = await verifyPhoneNumber({
        account_id: selectedAccount.id,
        code: verificationCode,
        twilio_sid: credentials.twilio_sid || undefined,
        twilio_auth_token: credentials.twilio_auth_token || undefined,
      });

      if (result.success) {
        toast({ title: 'Verificado!', description: 'Número de WhatsApp verificado com sucesso!' });
        setShowVerifyDialog(false);
        setShowCredentialsDialog(true);
        loadAccounts();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha na verificação', variant: 'destructive' });
    }
  };

  const handleResendCode = async () => {
    if (!selectedAccount) return;

    const result = await resendVerificationCode(selectedAccount.id);
    if (result.success) {
      toast({ title: 'Código reenviado', description: 'Verifique seu WhatsApp' });
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  const handleSaveCredentials = async () => {
    if (!selectedAccount) return;

    try {
      const success = await updateAccountCredentials({
        accountId: selectedAccount.id,
        twilio_sid: credentials.twilio_sid,
        twilio_auth_token: credentials.twilio_auth_token,
        twilio_messaging_service_sid: credentials.twilio_messaging_service_sid,
      });

      if (success) {
        toast({ title: 'Credenciais salvas', description: 'Configuração do Twilio concluída!' });
        setShowCredentialsDialog(false);
        setCredentials({ twilio_sid: '', twilio_auth_token: '', twilio_messaging_service_sid: '' });
        loadAccounts();
      } else {
        toast({ title: 'Erro', description: 'Falha ao salvar credenciais', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar credenciais', variant: 'destructive' });
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    const success = await setPrimaryAccount(accountId, barbershopId);
    if (success) {
      toast({ title: 'Conta principal definida' });
      loadAccounts();
    } else {
      toast({ title: 'Erro', description: 'Falha ao definir conta principal', variant: 'destructive' });
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;

    const success = await deleteWhatsAppAccount(accountId);
    if (success) {
      toast({ title: 'Conta removida' });
      loadAccounts();
    } else {
      toast({ title: 'Erro', description: 'Falha ao remover conta', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contas WhatsApp</h2>
          <p className="text-muted-foreground">Gerencie os números de WhatsApp para envio de mensagens</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Adicionar Número</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Número de WhatsApp</DialogTitle>
              <DialogDescription>Cadastre o número que será usado para enviar mensagens aos clientes</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Número de WhatsApp</Label>
                <Input
                  placeholder="+55 11 99999-9999"
                  value={newAccount.phone_number}
                  onChange={(e) => setNewAccount({ ...newAccount, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Profissional Vinculado (opcional)</Label>
                <Select onValueChange={(v) => setNewAccount({ ...newAccount, professional_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum / Conta do Salão</SelectItem>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Apelido (opcional)</Label>
                <Input
                  placeholder="Ex: WhatsApp Principal"
                  value={newAccount.nickname}
                  onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button onClick={handleAddAccount}>Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Contas Cadastradas</TabsTrigger>
          <TabsTrigger value="help">Como Configurar</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
                <p className="text-muted-foreground mb-4">Cadastre um número de WhatsApp para começar a enviar mensagens</p>
                <Button onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-2" /> Cadastrar Número</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${account.is_verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          {account.is_verified ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{account.nickname || account.phone_number}</h3>
                            {account.is_primary && (
                              <Badge variant="secondary"><Crown className="w-3 h-3 mr-1" /> Principal</Badge>
                            )}
                            {account.is_verified ? (
                              <Badge variant="default">Verificado</Badge>
                            ) : (
                              <Badge variant="outline">Pendente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{account.phone_number}</p>
                          {account.professional && (
                            <p className="text-sm text-muted-foreground">Profissional: {account.professional.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setShowVerifyDialog(true);
                            }}
                          >
                            Verificar
                          </Button>
                        )}
                        {account.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account);
                              setCredentials({
                                twilio_sid: account.twilio_sid || '',
                                twilio_auth_token: account.twilio_auth_token || '',
                                twilio_messaging_service_sid: account.twilio_messaging_service_sid || '',
                              });
                              setShowCredentialsDialog(true);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        {!account.is_primary && account.is_verified && (
                          <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(account.id)}>
                            Definir Principal
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar o WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Cadastre o número</h4>
                <p className="text-sm text-muted-foreground">Adicione o número de WhatsApp que será usado para enviar mensagens. Pode ser um número dedicado ou o próprio número do profissional.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Verifique o número</h4>
                <p className="text-sm text-muted-foreground">Você receberá um código de verificação via SMS ou WhatsApp. Insira o código para confirmar a posse do número.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">3. Configure credenciais Twilio</h4>
                <p className="text-sm text-muted-foreground">Crie uma conta no Twilio (twilio.com), obtenha suas credenciais (Account SID e Auth Token) e insira no sistema.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">4. Compre pacotes de mensagens</h4>
                <p className="text-sm text-muted-foreground">Acesse a área de pacotes de mensagens para adquirir créditos de envio.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Número de WhatsApp</DialogTitle>
            <DialogDescription>
              Enviamos um código de 6 dígitos para {selectedAccount?.phone_number}. Insira abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código de Verificação</Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button variant="ghost" onClick={handleResendCode}>
              <RefreshCw className="w-4 h-4 mr-2" /> Reenviar Código
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>Cancelar</Button>
            <Button onClick={handleVerify} disabled={verificationCode.length !== 6}>Verificar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciais Twilio</DialogTitle>
            <DialogDescription>
              Configure suas credenciais do Twilio para ativar o envio de mensagens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <Input
                type="password"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={credentials.twilio_sid}
                onChange={(e) => setCredentials({ ...credentials, twilio_sid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Auth Token</Label>
              <Input
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={credentials.twilio_auth_token}
                onChange={(e) => setCredentials({ ...credentials, twilio_auth_token: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Messaging Service SID (opcional)</Label>
              <Input
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={credentials.twilio_messaging_service_sid}
                onChange={(e) => setCredentials({ ...credentials, twilio_messaging_service_sid: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredentialsDialog(false)}>Pular</Button>
            <Button onClick={handleSaveCredentials}>Salvar Credenciais</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
