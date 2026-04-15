// Supabase Edge Function: check-blocked-numbers
// Verifica números bloqueados e gera alertas automáticos
// Rodar via cron job a cada 15 minutos

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getHighFailureRateNumbers(supabaseClient: any) {
  const { data } = await supabaseClient
    .from('whatsapp_numbers')
    .select('*, whatsapp_accounts(*)')
    .eq('is_active', true)
    .eq('is_blocked', false);

  const problematicNumbers: any[] = [];

  for (const number of data || []) {
    const total = number.successful_count + number.failed_count;
    if (total < 10) continue;

    const failureRate = number.failed_count / total;

    if (failureRate > 0.3) {
      problematicNumbers.push({
        ...number,
        failureRate,
      });
    }
  }

  return problematicNumbers;
}

async function autoUnblockNumbers(supabaseClient: any) {
  const { data } = await supabaseClient
    .from('whatsapp_numbers')
    .select('*')
    .eq('is_blocked', true)
    .eq('is_active', true)
    .lt('blocked_until', new Date().toISOString());

  let unblocked = 0;

  for (const number of data || []) {
    await supabaseClient
      .from('whatsapp_numbers')
      .update({
        is_blocked: false,
        blocked_until: null,
      })
      .eq('id', number.id);

    await supabaseClient.from('blocked_numbers_alerts').insert({
      whatsapp_number_id: number.id,
      alert_type: 'cooldown',
      severity: 'low',
      message: `Número ${number.phone_number} desbloqueado automaticamente após período de cooldown`,
      suggested_action: 'Monitore o número para evitar novos bloqueios',
    });

    unblocked++;
  }

  return unblocked;
}

async function checkRateLimits(supabaseClient: any) {
  const { data: policies } = await supabaseClient
    .from('sending_policies')
    .select('*');

  const issues: any[] = [];

  for (const policy of policies || []) {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { count: recentSends } = await supabaseClient
      .from('message_sending_logs')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_accounts.barbershop_id', policy.barbershop_id)
      .gte('created_at', oneHourAgo);

    if (recentSends && recentSends > policy.max_messages_per_hour * 0.9) {
      issues.push({
        barbershop_id: policy.barbershop_id,
        issue: 'rate_limit_warning',
        message: `Barbearia está usando ${recentSends}/${policy.max_messages_per_hour} mensagens por hora (90%)`,
        severity: recentSends >= policy.max_messages_per_hour ? 'high' : 'medium',
      });
    }
  }

  return issues;
}

async function notifySuperAdmins(supabaseClient: any, alerts: any[]) {
  const { data: superAdmins } = await supabaseClient
    .from('authorized_super_admins')
    .select('email')
    .eq('is_active', true);

  for (const admin of superAdmins || []) {
    for (const alert of alerts) {
      await supabaseClient.from('notifications').insert({
        user_id: admin.email,
        title: `⚠️ Alerta WhatsApp: ${alert.type}`,
        message: alert.message,
        type: 'warning',
        priority: alert.severity === 'critical' ? 'high' : 'normal',
        data: alert,
      });
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      unblocked_numbers: 0,
      high_failure_rate: 0,
      rate_limit_warnings: 0,
      alerts_created: 0,
    };

    const unblocked = await autoUnblockNumbers(supabaseClient);
    results.unblocked_numbers = unblocked;

    const problematicNumbers = await getHighFailureRateNumbers(supabaseClient);
    results.high_failure_rate = problematicNumbers.length;

    for (const number of problematicNumbers) {
      await supabaseClient.from('blocked_numbers_alerts').insert({
        whatsapp_number_id: number.id,
        alert_type: 'high_failure_rate',
        severity: number.failureRate > 0.5 ? 'high' : 'medium',
        message: `Número ${number.phone_number} tem taxa de falha de ${(number.failureRate * 100).toFixed(1)}%`,
        suggested_action: 'Verifique o número e considere substitui-lo',
      });
      results.alerts_created++;
    }

    const rateIssues = await checkRateLimits(supabaseClient);
    results.rate_limit_warnings = rateIssues.length;

    const criticalAlerts = [
      ...problematicNumbers.filter(n => n.failureRate > 0.5).map(n => ({
        type: 'high_failure_rate',
        severity: 'high',
        message: `Número ${n.phone_number} com alta taxa de falha`,
      })),
      ...rateIssues.filter(i => i.severity === 'high').map(i => ({
        type: 'rate_limit',
        severity: 'high',
        message: i.message,
      })),
    ];

    if (criticalAlerts.length > 0) {
      await notifySuperAdmins(supabaseClient, criticalAlerts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na verificação:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
