/**
 * Verificação de funções RPC no banco de dados
 */

import { supabase } from '@/integrations/supabase/client';

export async function checkRpcFunctions() {
  const functions = [
    'get_email_by_whatsapp',
    'has_role',
    'is_super_admin',
    'owns_barbershop'
  ];

  const results: Record<string, boolean> = {};

  for (const funcName of functions) {
    try {
      // Tenta executar a função com parâmetros nulos para verificar se existe
      await supabase.rpc(funcName, {});
      results[funcName] = true;
    } catch (error) {
      console.warn(`Função RPC ${funcName} não encontrada ou inválida:`, error);
      results[funcName] = false;
    }
  }

  return results;
}

export async function createMissingFunctions() {
  const results = await checkRpcFunctions();
  
  if (!results.get_email_by_whatsapp) {
    console.warn('get_email_by_whatsapp não existe - login por WhatsApp pode não funcionar');
  }
  
  return results;
}
