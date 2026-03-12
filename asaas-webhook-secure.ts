// 🛡️ EDGE FUNCTION ASAAS WEBHOOK SEGURO
// Substitua o conteúdo de supabase/functions/asaas-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  id: string
  event: string
  payment?: {
    id: string
    status: string
    value: number
    customer: string
    dueDate: string
    billingType: string
  }
  subscription?: {
    id: string
    status: string
    customer: string
    value: number
    nextDueDate: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Obter assinatura do webhook (se configurada)
    const signature = req.headers.get('asaas-signature')
    const body = await req.text()
    
    // Validar payload
    let payload: WebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      throw new Error('Invalid JSON payload')
    }

    // Validar estrutura mínima
    if (!payload.id || !payload.event) {
      throw new Error('Missing required fields')
    }

    // Criar cliente Supabase com service role (necessário para webhook)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Processar diferentes tipos de eventos
    switch (payload.event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentConfirmed(supabase, payload)
        break
        
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
        await handlePaymentStatusChange(supabase, payload)
        break
        
      case 'SUBSCRIPTION_ACTIVE':
      case 'SUBSCRIPTION_CONFIRMED':
        await handleSubscriptionActive(supabase, payload)
        break
        
      case 'SUBSCRIPTION_SUSPENDED':
      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionInactive(supabase, payload)
        break
        
      default:
        console.log(`Evento não tratado: ${payload.event}`)
    }

    // Log seguro (sem dados sensíveis)
    console.log(`Webhook ASAAS processado: ${payload.event} - ${payload.id}`)

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro no webhook ASAAS:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Webhook processing failed',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function handlePaymentConfirmed(supabase: any, payload: WebhookPayload) {
  if (!payload.payment?.id) {
    throw new Error('Payment ID missing')
  }

  // Validar que o pagamento existe e pertence a um contexto válido
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(`
      id,
      barbershop_id,
      client_user_id,
      amount,
      status,
      barbershops!inner (
        id,
        is_active,
        owner_user_id
      )
    `)
    .eq('id', payload.payment.id)
    .single()

  if (paymentError || !payment) {
    throw new Error('Payment not found or invalid')
  }

  if (!payment.barbershops.is_active) {
    throw new Error('Barbershop is inactive')
  }

  // Atualizar status do pagamento
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      asaas_payment_id: payload.payment.id,
      metadata: {
        webhook_event: payload.event,
        processed_at: new Date().toISOString()
      }
    })
    .eq('id', payload.payment.id)

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`)
  }

  // Atualizar assinatura se aplicável
  if (payload.payment.billingType === 'BOLETO') {
    await updateSubscriptionStatus(supabase, payment.barbershop_id, 'active')
  }

  // Registrar log de auditoria
  await supabase
    .from('security_audit_log')
    .insert({
      action: 'PAYMENT_CONFIRMED_WEBHOOK',
      table_name: 'payments',
      record_id: payload.payment.id,
      new_values: {
        status: 'confirmed',
        webhook_event: payload.event
      }
    })
}

async function handlePaymentStatusChange(supabase: any, payload: WebhookPayload) {
  if (!payload.payment?.id) return

  const newStatus = payload.event === 'PAYMENT_DELETED' ? 'cancelled' : 'overdue'

  const { error } = await supabase
    .from('payments')
    .update({
      status: newStatus,
      metadata: {
        webhook_event: payload.event,
        processed_at: new Date().toISOString()
      }
    })
    .eq('id', payload.payment.id)

  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`)
  }
}

async function handleSubscriptionActive(supabase: any, payload: WebhookPayload) {
  if (!payload.subscription?.id) return

  // Encontrar barbearia pelo ASAAS customer ID
  const { data: barbershop, error } = await supabase
    .from('barbershops')
    .select('id, asaas_customer_id')
    .eq('asaas_customer_id', payload.subscription.customer)
    .single()

  if (error || !barbershop) {
    throw new Error('Barbershop not found for subscription')
  }

  await updateSubscriptionStatus(supabase, barbershop.id, 'active')
}

async function handleSubscriptionInactive(supabase: any, payload: WebhookPayload) {
  if (!payload.subscription?.id) return

  // Encontrar barbearia pelo ASAAS customer ID
  const { data: barbershop, error } = await supabase
    .from('barbershops')
    .select('id, asaas_customer_id')
    .eq('asaas_customer_id', payload.subscription.customer)
    .single()

  if (error || !barbershop) {
    throw new Error('Barbershop not found for subscription')
  }

  await updateSubscriptionStatus(supabase, barbershop.id, 'suspended')
}

async function updateSubscriptionStatus(supabase: any, barbershopId: string, status: string) {
  const { error } = await supabase
    .from('barbershops')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', barbershopId)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
}
