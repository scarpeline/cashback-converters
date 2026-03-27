// Store Service
// Gerenciamento da loja interna - produtos, pedidos, pacotes

import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  category?: string;
  product_type: 'product' | 'course' | 'package';
  image_url?: string;
  images?: string[];
  stock_quantity: number;
  stock_alert_threshold: number;
  is_active: boolean;
  is_featured: boolean;
}

export interface Order {
  id: string;
  barbershop_id: string;
  client_user_id?: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
}

export interface Package {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  package_type: 'sessions' | 'monthly' | 'prepaid';
  services: { service_id: string; service_name: string; quantity: number }[];
  total_sessions: number;
  remaining_sessions: number;
  price: number;
  original_price?: number;
  validity_days: number;
  is_active: boolean;
  sales_count?: number;
  [key: string]: any;
}

export interface ClientPackage {
  id: string;
  client_user_id: string;
  barbershop_id: string;
  package_id: string;
  remaining_sessions: number;
  total_sessions: number;
  status: 'active' | 'expired' | 'exhausted' | 'cancelled';
  purchased_at: string;
  expires_at: string;
  last_used_at?: string;
}

export async function getProducts(barbershopId: string, type?: string): Promise<Product[]> {
  try {
    let query = (supabase as any)
      .from('store_products')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('product_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return { success: true, product: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('store_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return false;
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  return updateProduct(productId, { is_active: false });
}

export async function updateStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const { data } = await (supabase as any)
      .from('store_products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (data) {
      const newQuantity = data.stock_quantity + quantity;
      if (newQuantity < 0) return false;

      await (supabase as any)
        .from('store_products')
        .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId);
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    return false;
  }
}

export async function getOrders(barbershopId: string, status?: string, limit: number = 50): Promise<Order[]> {
  try {
    let query = (supabase as any)
      .from('store_orders')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

export async function getClientOrders(clientUserId: string): Promise<Order[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_orders')
      .select('*')
      .eq('client_user_id', clientUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getOrderItems(orderId: string): Promise<any[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar itens do pedido:', error);
    return [];
  }
}

export async function createOrder(params: {
  barbershop_id: string;
  client_user_id?: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const subtotal = params.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const total = subtotal;

    const { data: order, error: orderError } = await (supabase as any)
      .from('store_orders')
      .insert({
        barbershop_id: params.barbershop_id,
        client_user_id: params.client_user_id,
        order_number: `ORD-${Date.now()}`,
        status: 'pending',
        subtotal,
        total,
        customer_name: params.customer_name,
        customer_email: params.customer_email,
        customer_phone: params.customer_phone,
        notes: params.notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    for (const item of params.items) {
      const { data: product } = await (supabase as any)
        .from('store_products')
        .select('name, sku')
        .eq('id', item.product_id)
        .single();

      await (supabase as any).from('store_order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name: product?.name || 'Produto',
        product_sku: product?.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      });

      if (product) {
        await updateStock(item.product_id, -item.quantity);
      }
    }

    return { success: true, order };
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('store_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return false;
  }
}

export async function getPackages(barbershopId: string): Promise<Package[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_packages')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return [];
  }
}

export async function createPackage(pkg: Partial<Package>): Promise<{ success: boolean; package?: Package; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from('store_packages')
      .insert({
        ...pkg,
        remaining_sessions: pkg.total_sessions,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, package: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getClientPackages(clientUserId: string): Promise<ClientPackage[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('client_packages')
      .select('*')
      .eq('client_user_id', clientUserId)
      .eq('status', 'active')
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pacotes do cliente:', error);
    return [];
  }
}

export async function purchasePackage(params: {
  client_user_id: string;
  barbershop_id: string;
  package_id: string;
  order_id?: string;
}): Promise<{ success: boolean; client_package?: ClientPackage; error?: string }> {
  try {
    const { data: pkg, error: pkgError } = await (supabase as any)
      .from('store_packages')
      .select('*')
      .eq('id', params.package_id)
      .single();

    if (pkgError || !pkg) {
      return { success: false, error: 'Pacote não encontrado' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.validity_days);

    const { data, error } = await (supabase as any)
      .from('client_packages')
      .insert({
        client_user_id: params.client_user_id,
        barbershop_id: params.barbershop_id,
        package_id: params.package_id,
        purchase_order_id: params.order_id,
        remaining_sessions: pkg.total_sessions,
        total_sessions: pkg.total_sessions,
        original_value: pkg.price,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await (supabase as any)
      .from('store_packages')
      .update({ sales_count: (pkg.sales_count || 0) + 1 })
      .eq('id', params.package_id);

    return { success: true, client_package: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function usePackageSession(clientPackageId: string, appointmentId?: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).rpc('use_package_session', {
      p_client_package_id: clientPackageId,
    });

    if (error) throw error;

    if (appointmentId) {
      const { data: usage } = await (supabase as any)
        .from('client_package_usage')
        .select('id')
        .eq('client_package_id', clientPackageId)
        .order('session_number', { ascending: false })
        .limit(1)
        .single();

      if (usage) {
        await (supabase as any)
          .from('client_package_usage')
          .update({ appointment_id: appointmentId })
          .eq('id', usage.id);
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao usar sessão do pacote:', error);
    return false;
  }
}

export async function getStoreStats(barbershopId: string): Promise<{
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  packagesSold: number;
}> {
  try {
    const [
      { count: products },
      { data: lowStock },
      { count: orders },
      { count: pending },
      { data: revenue },
      { count: packages },
    ] = await Promise.all([
      (supabase as any).from('store_products').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('is_active', true),
      (supabase as any).from('store_products').select('id').eq('barbershop_id', barbershopId).eq('is_active', true).lte('stock_quantity', (supabase as any).rpc('stock_alert_threshold').select('stock_alert_threshold')),
      (supabase as any).from('store_orders').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
      (supabase as any).from('store_orders').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId).eq('status', 'pending'),
      (supabase as any).from('store_orders').select('total').eq('barbershop_id', barbershopId).eq('payment_status', 'paid'),
      (supabase as any).from('client_packages').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
    ]);

    const totalRevenue = revenue?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;

    return {
      totalProducts: products || 0,
      lowStockProducts: lowStock?.length || 0,
      totalOrders: orders || 0,
      pendingOrders: pending || 0,
      totalRevenue,
      packagesSold: packages || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      packagesSold: 0,
    };
  }
}
