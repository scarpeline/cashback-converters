// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export async function getAccountantsWithBarbershops() {
  try {
    const { data, error } = await (supabase as any).from('accountants').select('*').eq('is_active', true);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

export async function notifyAccountantAboutInactiveClients(accountantUserId: string, inactiveCount: number): Promise<boolean> {
  try {
    const { error } = await (supabase as any).from('notifications').insert({ user_id: accountantUserId, title: 'Clientes Inativos', message: `Voce tem  cliente(s) inativo(s).`, type: 'warning', read: false });
    return !error;
  } catch { return false; }
}

export async function runInactiveClientsAutomation() {
  try {
    const accountants = await getAccountantsWithBarbershops();
    let notified = 0;
    for (const acc of accountants) {
      const { count } = await (supabase as any).from('fiscal_service_requests').select('*', { count: 'exact', head: true }).eq('accountant_id', acc.id).eq('status', 'pending');
      if ((count || 0) > 0 && acc.user_id) { const ok = await notifyAccountantAboutInactiveClients(acc.user_id, count || 0); if (ok) notified++; }
    }
    return { processed: accountants.length, notified };
  } catch { return { processed: 0, notified: 0 }; }
}
