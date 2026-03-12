// 🛡️ EDGE FUNCTION TEST INTEGRATION SEGURO
// Substitua o conteúdo de supabase/functions/test-integration/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestRequest {
  testType: string
  configId?: string
  integrationType?: 'asaas' | 'twilio' | 'email' | 'whatsapp'
}

interface TestResult {
  success: boolean
  testType: string
  integrationType?: string
  timestamp: string
  message?: string
  error?: string
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

    // Validar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    // Extrair token e criar cliente
    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const body: TestRequest = await req.json()
    const { testType, configId, integrationType } = body

    // Validar campos obrigatórios
    if (!testType) {
      throw new Error('testType is required')
    }

    // Log seguro sem dados sensíveis
    console.log(`Integration test initiated: ${testType} by user ${user.id}`)
    
    // Registrar tentativa de teste
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'INTEGRATION_TEST',
        table_name: 'system',
        new_values: {
          test_type: testType,
          integration_type: integrationType,
          timestamp: new Date().toISOString()
        }
      })

    // Executar teste baseado no tipo
    let result: TestResult

    switch (testType) {
      case 'connection':
        result = await testConnection(supabase, user.id)
        break
        
      case 'integration':
        if (!integrationType) {
          throw new Error('integrationType is required for integration test')
        }
        result = await testIntegration(supabase, user.id, integrationType)
        break
        
      case 'permissions':
        result = await testPermissions(supabase, user.id)
        break
        
      default:
        throw new Error(`Unknown test type: ${testType}`)
    }

    // Log de sucesso (sem dados sensíveis)
    console.log(`Integration test completed: ${testType} - ${result.success ? 'SUCCESS' : 'FAILED'}`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    // Log seguro sem dados sensíveis
    console.error('Integration test error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test failed',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function testConnection(supabase: any, userId: string): Promise<TestResult> {
  try {
    // Testar conexão básica com o Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    return {
      success: true,
      testType: 'connection',
      timestamp: new Date().toISOString(),
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      success: false,
      testType: 'connection',
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}

async function testIntegration(supabase: any, userId: string, integrationType: string): Promise<TestResult> {
  try {
    // Verificar se usuário tem permissão para testar integrações
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)

    if (roleError) {
      throw new Error('Failed to verify user permissions')
    }

    const userRoles = roles?.map(r => r.role) || []
    const allowedRoles = ['super_admin', 'dono', 'contador']
    
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      throw new Error('Insufficient permissions for integration testing')
    }

    // Testar configuração da integração (sem expor chaves)
    let testResult = ''

    switch (integrationType) {
      case 'asaas':
        // Verificar se existe configuração ASAAS (sem expor chaves)
        const { data: asaasConfig } = await supabase
          .from('barbershops')
          .select('id, name, asaas_customer_id')
          .not('asaas_customer_id', 'is', null)
          .limit(1)

        testResult = asaasConfig && asaasConfig.length > 0 
          ? 'ASAAS configuration found' 
          : 'ASAAS configuration not found'
        break

      case 'twilio':
        // Verificar variáveis de ambiente (sem expor valores)
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
        testResult = twilioSid ? 'Twilio configured' : 'Twilio not configured'
        break

      case 'email':
        // Verificar configuração de email
        const emailConfig = Deno.env.get('RESEND_API_KEY')
        testResult = emailConfig ? 'Email service configured' : 'Email service not configured'
        break

      case 'whatsapp':
        // Verificar configuração WhatsApp
        const whatsappConfig = Deno.env.get('WHATSAPP_API_KEY')
        testResult = whatsappConfig ? 'WhatsApp configured' : 'WhatsApp not configured'
        break

      default:
        throw new Error(`Unknown integration type: ${integrationType}`)
    }

    return {
      success: true,
      testType: 'integration',
      integrationType,
      timestamp: new Date().toISOString(),
      message: testResult
    }
  } catch (error) {
    return {
      success: false,
      testType: 'integration',
      integrationType,
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}

async function testPermissions(supabase: any, userId: string): Promise<TestResult> {
  try {
    // Testar permissões do usuário em diferentes tabelas
    const tests = [
      { table: 'profiles', action: 'select' },
      { table: 'user_roles', action: 'select' },
    ]

    const results = []

    for (const test of tests) {
      try {
        const { data, error } = await supabase
          .from(test.table)
          .select('id')
          .limit(1)

        results.push({
          table: test.table,
          action: test.action,
          success: !error,
          error: error?.message
        })
      } catch (error) {
        results.push({
          table: test.table,
          action: test.action,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalTests = results.length

    return {
      success: successCount === totalTests,
      testType: 'permissions',
      timestamp: new Date().toISOString(),
      message: `Permissions test: ${successCount}/${totalTests} passed`
    }
  } catch (error) {
    return {
      success: false,
      testType: 'permissions',
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}
