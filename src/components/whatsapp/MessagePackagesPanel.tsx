import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, RefreshCw, ShoppingCart, Check, Clock, CreditCard } from 'lucide-react';
import {
  getPackages,
  createPackage,
  purchasePackage,
  confirmPurchase,
  getBalance,
  getPurchaseHistory,
  createDefaultPackages,
  MessagePackage,
  MessagePurchase,
  MessageBalance,
} from '@/services/messagePackageService';

interface MessagePackagesPanelProps {
  barbershopId: string;
}

export function MessagePackagesPanel({ barbershopId }: MessagePackagesPanelProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<MessagePackage[]>([]);
  const [balance, setBalance] = useState<MessageBalance | null>(null);
  const [history, setHistory] = useState<MessagePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MessagePackage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    quantity_messages: 100,
    price_per_message: 0.07,
    validity_days: 30,
  });

  useEffect(() => {
    loadData();
  }, [barbershopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await createDefaultPackages(barbershopId);
      const [pkgs, bal, hist] = await Promise.all([
        getPackages(barbershopId),
        getBalance(barbershopId),
        getPurchaseHistory(barbershopId),
      ]);
      setPackages(pkgs);
      setBalance(bal);
      setHistory(hist);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = async () => {
    if (!selectedPackage) return;

    try {
      const result = await purchasePackage({
        barbershop_id: barbershopId,
        package_id: selectedPackage.id,
        quantity_messages: selectedPackage.quantity_messages * quantity,
      });

      if (result.success && result.purchase) {
        const confirmed = await confirmPurchase({ purchase_id: result.purchase.id });
        if (confirmed) {
          toast({ title: 'Compra realizada!', description: 'Pacote adicionado ao seu saldo' });
          setShowBuyDialog(false);
          loadData();
        } else {
          toast({ title: 'Compra Pendente', description: 'Aguardando confirmação de pagamento' });
        }
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao comprar pacote', variant: 'destructive' });
    }
  };

  const handleCreatePackage = async () => {
    if (!newPackage.name || newPackage.quantity_messages <= 0) {
      toast({ title: 'Erro', description: 'Preencha todos os campos corretamente', variant: 'destructive' });
      return;
    }

    try {
      const success = await createPackage({
        barbershop_id: barbershopId,
        name: newPackage.name,
        description: newPackage.description,
        quantity_messages: newPackage.quantity_messages,
        price_per_message: newPackage.price_per_message,
        validity_days: newPackage.validity_days,
      });

      if (success) {
        toast({ title: 'Pacote criado!', description: 'Pacote personalizado criado com sucesso' });
        setShowCreateDialog(false);
        setNewPackage({ name: '', description: '', quantity_messages: 100, price_per_message: 0.07, validity_days: 30 });
        loadData();
      } else {
        toast({ title: 'Erro', description: 'Falha ao criar pacote', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao criar pacote', variant: 'destructive' });
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
          <h2 className="text-2xl font-bold">Pacotes de Mensagens</h2>
          <p className="text-muted-foreground">Gerencie seus pacotes de mensagens WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Criar Pacote
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.available_messages || 0}</div>
            <p className="text-xs text-muted-foreground">mensagens disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usado</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.used_messages || 0}</div>
            <p className="text-xs text-muted-foreground">mensagens usadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balance?.expired_messages || 0}</div>
            <p className="text-xs text-muted-foreground">mensagens expiradas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Pacotes Disponíveis</TabsTrigger>
          <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description || `${pkg.quantity_messages} mensagens`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">R$ {pkg.total_price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {pkg.price_per_message.toFixed(4)} por mensagem
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{pkg.quantity_messages} mensagens</span>
                    <Badge variant="secondary">{pkg.validity_days} dias validade</Badge>
                  </div>
                  <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setQuantity(1);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Comprar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Comprar Pacote</DialogTitle>
                        <DialogDescription>Confirme a compra do pacote</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="font-semibold">{selectedPackage?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedPackage?.quantity_messages} mensagens
                          </p>
                          <p className="text-lg font-bold mt-2">R$ {selectedPackage?.total_price.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantidade de pacotes</Label>
                          <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold">
                            R$ {((selectedPackage?.total_price || 0) * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBuyDialog(false)}>Cancelar</Button>
                        <Button onClick={handleBuyPackage}>
                          <CreditCard className="w-4 h-4 mr-2" /> Confirmar Compra
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Pacote</TableHead>
                    <TableHead>Mensagens</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma compra realizada ainda
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{new Date(purchase.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{purchase.package_id}</TableCell>
                        <TableCell>{purchase.quantity_messages}</TableCell>
                        <TableCell>R$ {purchase.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.payment_status === 'paid'
                                ? 'default'
                                : purchase.payment_status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {purchase.payment_status === 'paid' ? 'Pago' : purchase.payment_status === 'pending' ? 'Pendente' : 'Falhou'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Pacote Personalizado</DialogTitle>
            <DialogDescription>Crie um pacote de mensagens com preço customizado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <Input
                value={newPackage.name}
                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                placeholder="Ex: Pacote Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newPackage.description}
                onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade de Mensagens</Label>
                <Input
                  type="number"
                  value={newPackage.quantity_messages}
                  onChange={(e) => setNewPackage({ ...newPackage, quantity_messages: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço por Mensagem (R$)</Label>
                <Input
                  type="number"
                  step={0.001}
                  value={newPackage.price_per_message}
                  onChange={(e) => setNewPackage({ ...newPackage, price_per_message: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Validade (dias)</Label>
              <Input
                type="number"
                value={newPackage.validity_days}
                onChange={(e) => setNewPackage({ ...newPackage, validity_days: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total do pacote:</p>
              <p className="text-2xl font-bold">
                R$ {(newPackage.quantity_messages * newPackage.price_per_message).toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePackage}>Criar Pacote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
