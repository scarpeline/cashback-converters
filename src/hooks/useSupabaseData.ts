/**
 * Hook customizado para carregar dados do Supabase com tratamento de erro
 * Evita telas brancas e fornece feedback ao usuário
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError, retrySupabaseQuery } from "@/lib/supabase-error-handler";
import { toast } from "sonner";

interface UseSupabaseDataOptions {
  showError?: boolean;
  retryCount?: number;
  fallbackData?: any;
}

export const useSupabaseData = <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  dependencies: any[] = [],
  options: UseSupabaseDataOptions = {}
) => {
  const { showError = true, retryCount = 2, fallbackData = null } = options;
  const [data, setData] = useState<T | null>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await retrySupabaseQuery(queryFn, retryCount);

        if (!isMounted) return;

        if (result.error) {
          const errorMessage = handleSupabaseError(result.error);
          setError(errorMessage);
          if (showError) {
            toast.error(errorMessage);
          }
          setData(fallbackData);
        } else {
          setData(result.data || fallbackData);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const errorMessage = handleSupabaseError(err);
        setError(errorMessage);
        if (showError) {
          toast.error(errorMessage);
        }
        setData(fallbackData);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => {} };
};

/**
 * Hook para operações de escrita (insert, update, delete)
 */
export const useSupabaseMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    mutationFn: () => Promise<{ data: any; error: any }>,
    options: { onSuccess?: () => void; onError?: (err: string) => void } = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await mutationFn();

      if (result.error) {
        const errorMessage = handleSupabaseError(result.error);
        setError(errorMessage);
        toast.error(errorMessage);
        options.onError?.(errorMessage);
        return null;
      }

      toast.success("Operação realizada com sucesso!");
      options.onSuccess?.();
      return result.data;
    } catch (err: any) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      toast.error(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
