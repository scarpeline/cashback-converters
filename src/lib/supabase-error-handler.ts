/**
 * Tratamento centralizado de erros do Supabase
 * Evita telas brancas e fornece feedback ao usuário
 */

export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export const handleSupabaseError = (error: any): string => {
  if (!error) return "Erro desconhecido";

  // Erro de conexão
  if (error.message?.includes("Failed to fetch")) {
    return "Erro de conexão. Verifique sua internet.";
  }

  // Erro de autenticação
  if (error.status === 401 || error.message?.includes("unauthorized")) {
    return "Sessão expirada. Faça login novamente.";
  }

  // Erro de permissão
  if (error.status === 403 || error.message?.includes("permission denied")) {
    return "Você não tem permissão para acessar isso.";
  }

  // Erro de tabela não encontrada
  if (error.code === "PGRST116" || error.message?.includes("relation does not exist")) {
    return "Recurso não disponível. Contate o suporte.";
  }

  // Erro de constraint (chave estrangeira, unique, etc)
  if (error.code?.startsWith("23")) {
    if (error.message?.includes("unique")) {
      return "Este registro já existe.";
    }
    if (error.message?.includes("foreign key")) {
      return "Referência inválida. Verifique os dados.";
    }
    return "Erro de validação dos dados.";
  }

  // Erro genérico
  return error.message || "Erro ao processar requisição";
};

/**
 * Wrapper seguro para queries do Supabase
 * Retorna dados ou array vazio em caso de erro
 */
export const safeSupabaseQuery = async <T>(
  query: Promise<{ data: T | null; error: any }>,
  fallback: T = [] as any
): Promise<T> => {
  try {
    const { data, error } = await query;
    if (error) {
      console.error("Supabase Error:", error);
      return fallback;
    }
    return data || fallback;
  } catch (err) {
    console.error("Query Error:", err);
    return fallback;
  }
};

/**
 * Validar se tabela existe antes de fazer query
 */
export const tableExists = async (supabase: any, tableName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .select("1")
      .limit(1);
    
    // Se erro é "relation does not exist", tabela não existe
    if (error?.code === "PGRST116") {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Retry logic para queries que podem falhar temporariamente
 */
export const retrySupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ data: T | null; error: any }> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn();
      if (!result.error) {
        return result;
      }
      lastError = result.error;

      // Não retry em erros de permissão ou autenticação
      if (result.error?.status === 401 || result.error?.status === 403) {
        return result;
      }

      // Aguarda antes de retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    } catch (err) {
      lastError = err;
    }
  }

  return { data: null, error: lastError };
};
