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
    const { name, cpf, phone, email, cep, addressNumber, course, enrollmentId } = await req.json()
    
    // Asaas API Key from environment variable
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const ASAAS_URL = Deno.env.get('ASAAS_API_URL') || 'https://sandbox.asaas.com/api/v3' // Default to sandbox

    if (!ASAAS_API_KEY) throw new Error('Asaas API Key is missing')

    // 1. Create or Find Customer in Asaas
    const customerReq = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${cpf}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    })
    const customerRes = await customerReq.json()
    let customerId = ''

    if (customerRes.data && customerRes.data.length > 0) {
      customerId = customerRes.data[0].id
    } else {
      const newCustomerReq = await fetch(`${ASAAS_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify({ name, cpfCnpj: cpf, email, phone, mobilePhone: phone, addressNumber, postalCode: cep })
      })
      const newCustomerRes = await newCustomerReq.json()
      if (newCustomerRes.errors) throw new Error(newCustomerRes.errors[0].description)
      customerId = newCustomerRes.id
    }

    // 2. Create Payment (Pix/Boleto as default for example, or let Asaas decide)
    const paymentReq = await fetch(`${ASAAS_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // Let user choose
        value: 199.90, // We should map course name to price from Supabase, but for now hardcoded or fetched. 
        // Best approach: fetch price from Supabase course_prices table
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
        description: `Matrícula - ${course}`,
        externalReference: enrollmentId // VERY IMPORTANT FOR WEBHOOK!
      })
    })
    
    const paymentRes = await paymentReq.json()
    if (paymentRes.errors) throw new Error(paymentRes.errors[0].description)

    return new Response(JSON.stringify({ invoiceUrl: paymentRes.invoiceUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
