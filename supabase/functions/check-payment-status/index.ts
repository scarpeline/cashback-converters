import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentId } = await req.json()

    if (!paymentId) {
      throw new Error('ID do pagamento é obrigatório')
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configuração do Asaas
    const { data: asaasConfig } = await supabase
      .from('integration_settings')
      .select('base_url, api_key')
      .eq('service_name', 'asaas')
      .eq('environment', 'production')
      .single()

    if (!asaasConfig?.api_key) {
      throw new Error('Configuração do Asaas não encontrada')
    }

    // Consultar status do pagamento no Asaas
    const response = await fetch(`${asaasConfig.base_url}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': asaasConfig.api_key,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao consultar pagamento: ${response.statusText}`)
    }

    const paymentData = await response.json()

    // Se o pagamento foi confirmado, atualizar no banco
    if (paymentData.status === 'CONFIRMED' || paymentData.status === 'RECEIVED') {
      // Buscar pagamento local
      const { data: localPayment } = await supabase
        .from('payments')
        .select('id, appointment_id, barbershop_id, amount')
        .eq('asaas_payment_id', paymentId)
        .single()

      if (localPayment) {
        // Atualizar status do pagamento
        await supabase
          .from('payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', localPayment.id)

        // Atualizar status do agendamento
        if (localPayment.appointment_id) {
          await supabase
            .from('appointments')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', localPayment.appointment_id)
        }

        // Atualizar métricas diárias
        const today = new Date().toISOString().split('T')[0]
        await supabase.rpc('update_daily_metrics', {
          p_barbershop_id: localPayment.barbershop_id,
          p_date: today,
          p_revenue: localPayment.amount,
          p_services_count: 1,
          p_appointments_count: 1,
          p_clients_count: 1,
          p_pix_revenue: localPayment.amount
        })

        console.log(`Pagamento ${paymentId} confirmado e atualizado no banco`)
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentData.status,
        paymentDate: paymentData.dueDate,
        value: paymentData.value,
        billingType: paymentData.billingType,
        confirmed: paymentData.status === 'CONFIRMED' || paymentData.status === 'RECEIVED'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Erro ao verificar status do pagamento:', message)
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
