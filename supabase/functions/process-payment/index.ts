import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('[process-payment] Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { courseId, optionId, couponId, pointsToUse, paymentMethod } = await req.json()
    console.log('[process-payment] Request:', { userId: user.id, courseId, optionId, couponId, pointsToUse })

    // 1. Check if user already purchased this course
    const { data: existingOrder, error: orderCheckError } = await supabaseClient
      .from('order_items')
      .select(`
        id,
        order:orders!inner(status, user_id)
      `)
      .eq('course_id', courseId)
      .eq('order.user_id', user.id)
      .eq('order.status', 'completed')
      .limit(1)

    if (orderCheckError) {
      console.error('[process-payment] Order check error:', orderCheckError)
      throw orderCheckError
    }

    if (existingOrder && existingOrder.length > 0) {
      console.log('[process-payment] Course already purchased')
      return new Response(
        JSON.stringify({ error: 'already_purchased', message: '이미 구매한 강의입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get course price
    let finalPrice = 0
    if (optionId) {
      const { data: option, error: optionError } = await supabaseClient
        .from('course_options')
        .select('price')
        .eq('id', optionId)
        .single()
      
      if (optionError) throw optionError
      finalPrice = option.price
    } else {
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('price')
        .eq('id', courseId)
        .single()
      
      if (courseError) throw courseError
      finalPrice = course.price
    }

    console.log('[process-payment] Base price:', finalPrice)

    // 3. Validate and apply coupon discount
    let couponDiscount = 0
    let userCouponId = null
    if (couponId) {
      // Check if user has this coupon assigned and not used
      const { data: userCoupon, error: userCouponError } = await supabaseClient
        .from('user_coupons')
        .select(`
          id,
          is_used,
          coupons (
            id,
            code,
            name,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount_amount,
            is_active,
            valid_from,
            valid_until,
            usage_limit,
            used_count
          )
        `)
        .eq('user_id', user.id)
        .eq('coupon_id', couponId)
        .eq('is_used', false)
        .single()

      if (userCouponError) {
        console.error('[process-payment] User coupon not found:', userCouponError)
        return new Response(
          JSON.stringify({ error: 'invalid_coupon', message: '사용할 수 없는 쿠폰입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const coupon = userCoupon.coupons as any
      userCouponId = userCoupon.id

      // Validate coupon
      const now = new Date()
      if (!coupon.is_active || new Date(coupon.valid_until) < now || new Date(coupon.valid_from) > now) {
        console.log('[process-payment] Coupon expired or inactive')
        return new Response(
          JSON.stringify({ error: 'invalid_coupon', message: '만료되었거나 사용할 수 없는 쿠폰입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        console.log('[process-payment] Coupon usage limit exceeded')
        return new Response(
          JSON.stringify({ error: 'invalid_coupon', message: '쿠폰 사용 한도를 초과했습니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check min order amount
      if (coupon.min_order_amount && finalPrice < coupon.min_order_amount) {
        console.log('[process-payment] Min order amount not met')
        return new Response(
          JSON.stringify({ error: 'invalid_coupon', message: `최소 주문 금액 ${coupon.min_order_amount.toLocaleString()}원 이상이어야 합니다.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate discount
      if (coupon.discount_type === 'percentage') {
        couponDiscount = Math.floor(finalPrice * (coupon.discount_value / 100))
      } else {
        couponDiscount = coupon.discount_value
      }

      // Apply max discount limit
      if (coupon.max_discount_amount && couponDiscount > coupon.max_discount_amount) {
        couponDiscount = coupon.max_discount_amount
      }

      console.log('[process-payment] Coupon discount:', couponDiscount)
    }

    // 4. Validate and apply points
    let pointsDiscount = 0
    if (pointsToUse > 0) {
      // Get user's current points balance
      const { data: pointsBalance, error: pointsError } = await supabaseClient
        .rpc('get_user_points_balance', { p_user_id: user.id })

      if (pointsError) throw pointsError

      if (pointsToUse > pointsBalance) {
        console.log('[process-payment] Insufficient points')
        return new Response(
          JSON.stringify({ error: 'insufficient_points', message: '보유 포인트가 부족합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const priceAfterCoupon = finalPrice - couponDiscount
      pointsDiscount = Math.min(pointsToUse, priceAfterCoupon)
      console.log('[process-payment] Points discount:', pointsDiscount)
    }

    const totalPrice = finalPrice - couponDiscount - pointsDiscount

    // 5. Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalPrice,
        status: 'completed',
        payment_method: totalPrice === 0 ? 'free' : paymentMethod
      })
      .select()
      .single()

    if (orderError) {
      console.error('[process-payment] Order creation error:', orderError)
      throw orderError
    }

    console.log('[process-payment] Order created:', order.id)

    // 6. Create order item
    const { error: orderItemError } = await supabaseClient
      .from('order_items')
      .insert({
        order_id: order.id,
        course_id: courseId,
        price: totalPrice
      })

    if (orderItemError) {
      console.error('[process-payment] Order item creation error:', orderItemError)
      throw orderItemError
    }

    // 7. Mark coupon as used
    if (userCouponId) {
      const { error: couponUpdateError } = await supabaseClient
        .from('user_coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          order_id: order.id
        })
        .eq('id', userCouponId)

      if (couponUpdateError) {
        console.error('[process-payment] Coupon update error:', couponUpdateError)
        // Don't throw, just log
      }

      // Increment coupon used count
      const { error: couponCountError } = await supabaseClient
        .rpc('increment_coupon_used_count', { coupon_id: couponId })
        .select()

      if (couponCountError) {
        console.error('[process-payment] Coupon count update error:', couponCountError)
      }
    }

    // 8. Deduct points
    if (pointsDiscount > 0) {
      const { error: pointsError } = await supabaseClient
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -pointsDiscount,
          type: 'used',
          description: `강의 결제 사용 (주문 #${order.id.substring(0, 8)})`,
          order_id: order.id,
          created_by: user.id
        })

      if (pointsError) {
        console.error('[process-payment] Points deduction error:', pointsError)
        throw pointsError
      }
    }

    // 9. Create enrollment
    const { error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress: 0
      })

    if (enrollmentError) {
      console.error('[process-payment] Enrollment creation error:', enrollmentError)
      throw enrollmentError
    }

    console.log('[process-payment] Payment processed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        totalPrice,
        couponDiscount,
        pointsDiscount,
        message: totalPrice === 0 ? '무료 강의 수강 등록이 완료되었습니다!' : '결제가 완료되어 수강 등록되었습니다!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[process-payment] Error:', error)
    return new Response(
      JSON.stringify({ error: 'internal_error', message: '결제 처리 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})