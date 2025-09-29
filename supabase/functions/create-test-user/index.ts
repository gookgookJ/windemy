import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the caller is an admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Jayce user data to copy
    const jayceUserId = 'eca70779-ecd7-4fe5-b668-e6be42b109a1'
    const testUserId = authUser.user.id

    // Create profile with same structure as jayce
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        email: email,
        full_name: '테스트 계정',
        role: 'admin',
        instructor_bio: '안녕하세요, 테스트입니다.',
        instructor_avatar_url: 'https://hzeoergmlzhdorhgzehz.supabase.co/storage/v1/object/public/course-thumbnails/1757400424291.jpg',
        marketing_consent: false,
        phone: ''
      })

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Copy orders
    const orderData = [
      {
        id: crypto.randomUUID(),
        user_id: testUserId,
        total_amount: 0,
        payment_method: 'free',
        status: 'completed',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: crypto.randomUUID(),
        user_id: testUserId,
        total_amount: 0,
        payment_method: 'free',
        status: 'completed',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)

    if (ordersError) {
      console.error('Orders error:', ordersError)
    }

    // Copy order items
    const orderItemsData = [
      {
        order_id: orderData[0].id,
        course_id: '13a7c08c-3506-4f0e-acd4-81f6475f8fec',
        price: 0
      },
      {
        order_id: orderData[1].id,
        course_id: 'ad5bc0e1-fa49-4748-8db3-769d25637db1',
        price: 0
      }
    ]

    const { error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsData)

    if (orderItemsError) {
      console.error('Order items error:', orderItemsError)
    }

    // Copy enrollments
    const enrollmentsData = [
      {
        user_id: testUserId,
        course_id: '13a7c08c-3506-4f0e-acd4-81f6475f8fec',
        enrolled_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0.00
      },
      {
        user_id: testUserId,
        course_id: 'ad5bc0e1-fa49-4748-8db3-769d25637db1',
        enrolled_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0.00
      }
    ]

    const { error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .insert(enrollmentsData)

    if (enrollmentsError) {
      console.error('Enrollments error:', enrollmentsError)
    }

    // Copy group membership
    const { error: groupError } = await supabaseAdmin
      .from('user_group_memberships')
      .insert({
        user_id: testUserId,
        group_id: 'cd1e286e-f3c5-49a4-a006-c9c16ed815e5'
      })

    if (groupError) {
      console.error('Group membership error:', groupError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: testUserId,
        message: '테스트 계정이 성공적으로 생성되었습니다.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})