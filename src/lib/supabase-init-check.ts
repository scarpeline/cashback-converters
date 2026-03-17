/**
 * Verificação de inicialização do Supabase
 * Diagnóstico para erros de "No available adapters"
 */

export function checkSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log('🔍 Supabase Config Check:');
  console.log('URL:', url ? '✅ Configurada' : '❌ Faltando');
  console.log('Key:', key ? '✅ Configurada' : '❌ Faltando');

  if (!url || !key) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    console.error('Adicione ao .env:');
    console.error('VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
    console.error('VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica');
    return false;
  }

  // Validar formato da URL
  if (!url.includes('supabase.co')) {
    console.error('❌ URL do Supabase inválida');
    return false;
  }

  // Validar formato da chave
  if (!key.includes('.')) {
    console.error('❌ Chave do Supabase inválida');
    return false;
  }

  console.log('✅ Configuração do Supabase OK');
  return true;
}

export function initSupabaseCheck() {
  if (typeof window !== 'undefined') {
    checkSupabaseConfig();
  }
}
