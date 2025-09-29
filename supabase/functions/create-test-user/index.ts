import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('테스트 사용자 생성 함수 시작됨')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight 요청 처리됨')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('요청 메서드:', req.method)

    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    console.log('Supabase 클라이언트 생성 완료')

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    console.log('현재 사용자 ID:', user?.id)

    if (!user) {
      console.log('인증되지 않은 사용자')
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the caller is an admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('사용자 프로필:', profile)
    console.log('프로필 에러:', profileError)

    if (!profile || profile.role !== 'admin') {
      console.log('관리자 권한 없음')
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('관리자 권한 확인됨')

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

    console.log('관리자 클라이언트 생성 완료')

    const body = await req.json()
    const { email, password } = body

    console.log('요청 데이터:', { email, password: password ? '***' : 'none' })

    if (!email || !password) {
      console.log('이메일 또는 비밀번호 누락')
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth 사용자 생성 시작')

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    console.log('Auth 사용자 생성 결과:', authUser ? 'success' : 'failed')
    console.log('Auth 에러:', authError)

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const testUserId = authUser.user.id
    console.log('생성된 사용자 ID:', testUserId)

    // Create profile with same structure as jayce
    console.log('프로필 생성 시작')
    const { error: profileError2 } = await supabaseAdmin
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

    console.log('프로필 생성 결과:', profileError2 ? 'failed' : 'success')
    console.log('프로필 에러:', profileError2)

    if (profileError2) {
      return new Response(
        JSON.stringify({ error: profileError2.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Copy orders
    console.log('주문 데이터 생성 시작')
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

    console.log('주문 생성 결과:', ordersError ? 'failed' : 'success')
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

    console.log('주문 아이템 생성 결과:', orderItemsError ? 'failed' : 'success')
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

    console.log('수강 신청 생성 결과:', enrollmentsError ? 'failed' : 'success')
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

    console.log('그룹 멤버십 생성 결과:', groupError ? 'failed' : 'success')
    if (groupError) {
      console.error('Group membership error:', groupError)
    }

    console.log('테스트 계정 생성 완료!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: testUserId,
        message: '테스트 계정이 성공적으로 생성되었습니다.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('전체 함수 에러:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})