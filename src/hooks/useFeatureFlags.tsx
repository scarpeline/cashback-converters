// @ts-nocheck
import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_all_features');
      
      if (error) {
        console.error('Erro ao carregar features:', error);
        return;
      }

      const featureMap: Record<string, boolean> = {};
      if (data) {
        data.forEach((feature: FeatureFlag) => {
          featureMap[feature.feature_key] = feature.enabled;
        });
      }

      setFeatures(featureMap);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    return features[featureKey] || false;
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any).rpc('toggle_feature', {
        p_feature_key: featureKey,
        p_enabled: enabled
      });

      if (error) {
        toast.error('Erro ao alterar feature: ' + error.message);
        return false;
      }

      setFeatures(prev => ({
        ...prev,
        [featureKey]: enabled
      }));

      toast.success(`Feature ${enabled ? 'ativada' : 'desativada'} com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao toggle feature:', error);
      toast.error('Erro ao alterar feature');
      return false;
    }
  };

  return {
    features,
    loading,
    isFeatureEnabled,
    toggleFeature,
    reload: loadFeatureFlags
  };
}

// Hook global para verificar features
export function useFeature(featureKey: string) {
  const { isFeatureEnabled, loading } = useFeatureFlags();
  
  return {
    enabled: isFeatureEnabled(featureKey),
    loading
  };
}

// Componente HOC para conditional rendering
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  featureKey: string,
  fallback?: React.ComponentType | React.ReactElement
) {
  return function FeatureFlagComponent(props: P) {
    const { enabled, loading } = useFeature(featureKey);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!enabled) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        return <fallback />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

// Componente para renderização condicional
export function FeatureGate({ 
  featureKey, 
  children, 
  fallback = null 
}: { 
  featureKey: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  const { enabled, loading } = useFeature(featureKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
