import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts, getOrders, getPackages,
  deleteProduct, deletePackage,
  createProduct, updateProduct,
  createPackage, updatePackage,
  type Product, type Order, type Package,
} from "@/services/storeService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingBag, Package as PackageIcon, ClipboardList,
  Plus, Pencil, Trash2, DollarSign, AlertTriangle,
  Loader2, Star, CheckCircle2,
} from "lucide-react";

interface Props { barbershopId: string; }

// ── Formulário de Produto ────────────────────────────────────────────────────
function ProductForm({ barbershopId, initial, onSave, onCancel }: {
  barbershopId: string;
  initial: Partial<Product> | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>({
    name: "", price: 0, stock_quantity: 0, stock_alert_threshold: 5,
    product_type: "product", is_active: true, is_featured: false,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Preencha nome e preço.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await updateProduct(form.id, form);
      } else {
        await createProduct({ ...form, barbershop_id: barbershopId } as Product);
      }
      toast({ title: "Produto salvo com sucesso." });
      onSave();
    } catch {
      toast({ title: "Erro ao salvar produto.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const field = (label: string, key: keyof Product, type = "text", props: any = {}) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
        className="mt-1"
        {...props}
      />
    </div>
  );

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <h4 className="font-semibold">{form.id ? "Editar Produto" : "Novo Produto"}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Nome *", "name")}
          {field("Preço *", "price", "number")}
          {field("Preço original (opcional)", "compare_at_price", "number")}
          {field("Estoque", "stock_quantity", "number")}
          {field("Alerta de estoque", "stock_alert_threshold", "number")}
          {field("URL da imagem", "image_url")}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.product_type || "product"}
              onChange={(e) => setForm({ ...form, product_type: e.target.value as any })}
            >
              <option value="product">Produto</option>
              <option value="course">Curso</option>
              <option value="package">Pacote</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea
            className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Destaque
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Formulário de Pacote ─────────────────────────────────────────────────────
function PackageForm({ barbershopId, initial, onSave, onCancel }: {
  barbershopId: string;
  initial: Partial<Package> | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Package>>({
    name: "", price: 0, total_sessions: 0, validity_days: 30,
    package_type: "sessions", is_active: true, services: [],
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Preencha nome e preço.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await updatePackage(form.id, form);
      } else {
        await createPackage({ ...form, barbershop_id: barbershopId } as Package);
      }
      toast({ title: "Pacote salvo com sucesso." });
      onSave();
    } catch {
      toast({ title: "Erro ao salvar pacote.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <h4 className="font-semibold">{form.id ? "Editar Pacote" : "Novo Pacote"}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome *</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Preço *</label>
            <Input type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Total de Sessões</label>
            <Input type="number" value={form.total_sessions || 0} onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Validade (dias)</label>
            <Input type="number" value={form.validity_days || 30} onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.package_type || "sessions"}
              onChange={(e) => setForm({ ...form, package_type: e.target.value as any })}
            >
              <option value="sessions">Sessões</option>
              <option value="monthly">Mensal</option>
              <option value="prepaid">Pré-pago</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea
            className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Pacote ativo
        </label>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Painel Principal ─────────────────────────────────────────────────────────
export function MarketplacePanel({ barbershopId }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingPackage, setEditingPackage] = useState<Partial<Package> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["marketplace-products", barbershopId],
    queryFn: () => getProducts(barbershopId),
    enabled: !!barbershopId,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["marketplace-orders", barbershopId],
    queryFn: () => getOrders(barbershopId),
    enabled: !!barbershopId,
  });

  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ["marketplace-packages", barbershopId],
    queryFn: () => getPackages(barbershopId),
    enabled: !!barbershopId,
  });

  const deleteProductMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["marketplace-products", barbershopId] }); toast({ title: "Produto removido." }); },
  });

  const deletePackageMut = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["marketplace-packages", barbershopId] }); toast({ title: "Pacote removido." }); },
  });

  const totalRevenue = (orders as Order[]).filter((o) => o.payment_status === "paid").reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = (orders as Order[]).filter((o) => o.status === "pending").length;
  const lowStock = (products as Product[]).filter((p) => p.stock_quantity <= p.stock_alert_threshold).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <p className="text-muted-foreground text-sm">Produtos, pacotes e pedidos do seu estabelecimento.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, color: "green", label: "Receita paga", value: `R$ ${totalRevenue.toFixed(2)}` },
          { icon: ShoppingBag, color: "blue", label: "Produtos ativos", value: String((products as Product[]).filter((p) => p.is_active).length) },
          { icon: ClipboardList, color: "orange", label: "Pedidos pendentes", value: String(pendingOrders) },
          { icon: AlertTriangle, color: lowStock > 0 ? "red" : "green", label: "Estoque baixo", value: String(lowStock) },
        ].map(({ icon: Icon, color, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 text-${color}-500`} />
              </div>
              <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products"><ShoppingBag className="w-4 h-4 mr-1" />Produtos</TabsTrigger>
          <TabsTrigger value="packages"><PackageIcon className="w-4 h-4 mr-1" />Pacotes</TabsTrigger>
          <TabsTrigger value="orders"><ClipboardList className="w-4 h-4 mr-1" />Pedidos</TabsTrigger>
        </TabsList>

        {/* Produtos */}
        <TabsContent value="products" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Catálogo de Produtos</h3>
            <Button size="sm" onClick={() => { setEditingProduct({}); setShowProductForm(true); }}>
              <Plus className="w-4 h-4 mr-1" />Novo Produto
            </Button>
          </div>
          {showProductForm && (
            <ProductForm barbershopId={barbershopId} initial={editingProduct}
              onSave={() => { queryClient.invalidateQueries({ queryKey: ["marketplace-products", barbershopId] }); setShowProductForm(false); setEditingProduct(null); }}
              onCancel={() => { setShowProductForm(false); setEditingProduct(null); }}
            />
          )}
          {loadingProducts ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            : (products as Product[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Sem produtos cadastrados.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(products as Product[]).map((p) => (
                  <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-sm leading-tight">{p.name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {p.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                          <Badge variant="outline" className="text-xs">{p.product_type === "product" ? "Produto" : p.product_type === "course" ? "Curso" : "Pacote"}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-primary">R$ {p.price.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${p.stock_quantity <= p.stock_alert_threshold ? "text-red-500" : "text-green-600"}`}>
                          Estoque: {p.stock_quantity}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { setEditingProduct(p); setShowProductForm(true); }}>
                          <Pencil className="w-3 h-3 mr-1" />Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => deleteProductMut.mutate(p.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>

        {/* Pacotes */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Pacotes de Sessões</h3>
            <Button size="sm" onClick={() => { setEditingPackage({}); setShowPackageForm(true); }}>
              <Plus className="w-4 h-4 mr-1" />Novo Pacote
            </Button>
          </div>
          {showPackageForm && (
            <PackageForm barbershopId={barbershopId} initial={editingPackage}
              onSave={() => { queryClient.invalidateQueries({ queryKey: ["marketplace-packages", barbershopId] }); setShowPackageForm(false); setEditingPackage(null); }}
              onCancel={() => { setShowPackageForm(false); setEditingPackage(null); }}
            />
          )}
          {loadingPackages ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            : (packages as Package[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><PackageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Sem pacotes cadastrados.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(packages as Package[]).map((pkg) => (
                  <Card key={pkg.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div><p className="font-semibold">{pkg.name}</p><p className="text-xs text-muted-foreground">{pkg.description}</p></div>
                        <Badge className={pkg.is_active ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-muted text-muted-foreground"}>
                          {pkg.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-muted/40 rounded p-2"><p className="text-xs text-muted-foreground">Sessões</p><p className="font-bold">{pkg.total_sessions}</p></div>
                        <div className="bg-muted/40 rounded p-2"><p className="text-xs text-muted-foreground">Validade</p><p className="font-bold">{pkg.validity_days}d</p></div>
                        <div className="bg-muted/40 rounded p-2"><p className="text-xs text-muted-foreground">Preço</p><p className="font-bold text-primary">R${pkg.price}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { setEditingPackage(pkg); setShowPackageForm(true); }}>
                          <Pencil className="w-3 h-3 mr-1" />Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => deletePackageMut.mutate(pkg.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>

        {/* Pedidos */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <h3 className="font-semibold">Histórico de Pedidos</h3>
          {loadingOrders ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            : (orders as Order[]).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Nenhum pedido encontrado.</p></div>
            ) : (
              <div className="space-y-2">
                {(orders as Order[]).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-sm">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name || "Cliente"} · {new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Badge variant="outline" className={`text-xs ${
                            order.status === "delivered" ? "text-green-600 border-green-500/30" :
                            order.status === "pending" ? "text-orange-600 border-orange-500/30" :
                            order.status === "cancelled" ? "text-red-600 border-red-500/30" : ""
                          }`}>
                            {order.status === "pending" ? "Pendente" : order.status === "delivered" ? "Entregue" :
                             order.status === "processing" ? "Processando" : order.status === "cancelled" ? "Cancelado" : order.status}
                          </Badge>
                          {order.payment_status === "paid" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
