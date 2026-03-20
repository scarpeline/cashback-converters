import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  ShoppingCart,
  Plus,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Package2,
  BookOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  getOrders,
  updateOrderStatus,
  getPackages,
  createPackage,
  getStoreStats,
  Product,
  Order,
  Package as StorePackage,
} from '@/services/storeService';

interface StorePanelProps {
  barbershopId: string;
}

export function StorePanel({ barbershopId }: StorePanelProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, lowStockProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0, packagesSold: 0 });
  const [loading, setLoading] = useState(true);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, cost: 0, sku: '', category: '', product_type: 'product' as const, stock_quantity: 0 });
  const [newPackage, setNewPackage] = useState({ name: '', description: '', package_type: 'sessions' as const, total_sessions: 10, price: 0, validity_days: 90 });

  useEffect(() => { loadData(); }, [barbershopId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, packagesData, statsData] = await Promise.all([
        getProducts(barbershopId),
        getOrders(barbershopId),
        getPackages(barbershopId),
        getStoreStats(barbershopId),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setPackages(packagesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast({ title: 'Erro', description: 'Preencha nome e preço', variant: 'destructive' });
      return;
    }
    const result = await createProduct({ ...newProduct, barbershop_id: barbershopId });
    if (result.success) {
      toast({ title: 'Produto criado!' });
      setShowProductDialog(false);
      loadData();
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleCreatePackage = async () => {
    if (!newPackage.name || newPackage.price <= 0) {
      toast({ title: 'Erro', description: 'Preencha nome e preço', variant: 'destructive' });
      return;
    }
    const result = await createPackage({ ...newPackage, barbershop_id: barbershopId });
    if (result.success) {
      toast({ title: 'Pacote criado!' });
      setShowPackageDialog(false);
      loadData();
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) {
      toast({ title: 'Status atualizado!' });
      loadData();
    } else {
      toast({ title: 'Erro', description: 'Falha ao atualizar status', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Loja Interna</h2>
          <p className="text-muted-foreground">Gerencie produtos, pacotes e pedidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPackageDialog(true)}><Plus className="w-4 h-4 mr-2" /> Novo Pacote</Button>
          <Button onClick={() => setShowProductDialog(true)}><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Produtos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalProducts}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pedidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalOrders}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pacotes Vendidos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.packagesSold}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="packages">Pacotes</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum produto cadastrado</TableCell></TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.description}</p></div></TableCell>
                        <TableCell><Badge variant="outline">{p.product_type === 'product' ? 'Produto' : p.product_type === 'course' ? 'Curso' : 'Pacote'}</Badge></TableCell>
                        <TableCell>R$ {p.price.toFixed(2)}</TableCell>
                        <TableCell><div className="flex items-center gap-2">{p.stock_quantity <= p.stock_alert_threshold && <AlertTriangle className="w-4 h-4 text-orange-500" />}<span>{p.stock_quantity}</span></div></TableCell>
                        <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pacote</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Vendas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum pacote cadastrado</TableCell></TableRow>
                  ) : (
                    packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell><div><p className="font-medium">{pkg.name}</p><p className="text-xs text-muted-foreground">{pkg.description}</p></div></TableCell>
                        <TableCell>{pkg.total_sessions} sessões</TableCell>
                        <TableCell>R$ {pkg.price.toFixed(2)}</TableCell>
                        <TableCell>{pkg.validity_days} dias</TableCell>
                        <TableCell>{pkg.sales_count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhum pedido registrado</TableCell></TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name || 'Cliente'}</TableCell>
                        <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>{order.payment_status}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                        <TableCell>
                          <select
                            className="text-sm border rounded p-1"
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                          >
                            <option value="pending">Pendente</option>
                            <option value="processing">Processando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregue</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
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

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Preço</Label><Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Estoque</Label><Input type="number" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label>Tipo</Label>
              <select className="w-full border rounded p-2" value={newProduct.product_type} onChange={(e) => setNewProduct({ ...newProduct, product_type: e.target.value as any })}>
                <option value="product">Produto</option>
                <option value="course">Curso</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateProduct}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pacote de Serviços</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })} placeholder="Ex: 10 Sessões de Corte" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sessões</Label><Input type="number" value={newPackage.total_sessions} onChange={(e) => setNewPackage({ ...newPackage, total_sessions: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label>Validade (dias)</Label><Input type="number" value={newPackage.validity_days} onChange={(e) => setNewPackage({ ...newPackage, validity_days: parseInt(e.target.value) || 90 })} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPackageDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreatePackage}>Criar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
