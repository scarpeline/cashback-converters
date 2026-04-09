// @ts-nocheck
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  starts_at: string;
  ends_at: string;
  trial_used: boolean;
  subscription_plans: {
    name: string;
    price: number;
    duration_months: number;
  };
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  canAccessPremium: boolean;
  refreshSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(name, price, duration_months)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('ends_at', new Date().toISOString())
        .single();

      // PGRST116 = no rows found (normal), ignore 404 (table may not exist yet)
      if (error && error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('404')) {
        console.error('Erro ao buscar assinatura:', error);
      }

      setSubscription(data ?? null);
    } catch (error) {
      // Silently ignore if table doesn't exist
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive = subscription?.status === 'active' && new Date(subscription.ends_at) > new Date();
  const isExpired = subscription ? new Date(subscription.ends_at) < new Date() : false;
  const daysUntilExpiry = subscription ? Math.ceil((new Date(subscription.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const canAccessPremium = isActive || !subscription; // Sem assinatura = trial

  const value = {
    subscription,
    loading,
    isActive,
    isExpired,
    daysUntilExpiry,
    canAccessPremium,
    refreshSubscription: fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Middleware para proteção de rotas
export function requireSubscription<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: { allowTrial?: boolean; redirectTo?: string } = {}
) {
  return function SubscriptionProtectedComponent(props: T) {
    const { canAccessPremium, subscription, loading } = useSubscription();
    const { user } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      window.location.href = '/login';
      return null;
    }

    if (!canAccessPremium) {
      if (options.redirectTo) {
        window.location.href = options.redirectTo;
        return null;
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Assinatura Necessária</h2>
            <p className="text-muted-foreground mb-6">
              Você precisa de uma assinatura ativa para acessar esta funcionalidade.
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Ver Planos
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
