-- 관리자 메모 시스템 확장 (이미 존재하는 admin_notes 테이블 활용)
-- 현재 테이블이 이미 있으므로 추가 기능만 구현

-- 쿠폰 사용자 배정 테이블 생성 (기존 coupons 테이블 활용)
CREATE TABLE public.user_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.orders(id),
  is_used BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, coupon_id)
);

-- Enable RLS
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_coupons
CREATE POLICY "Users can view their own coupons" 
ON public.user_coupons 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all user coupons" 
ON public.user_coupons 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "System can update coupon usage" 
ON public.user_coupons 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 활동 로그 시스템 확장 (기존 activity_logs 테이블이 있으므로 개선)
-- 현재 activity_logs 테이블에 추가 인덱스 생성
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- 활동 로그 자동 생성을 위한 함수들
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT 'general',
  p_entity_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    ip_address
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    inet_client_addr()
  );
END;
$$;

-- 수강/주문 정보 뷰 생성 (이미 존재하는 테이블들 활용)
CREATE OR REPLACE VIEW public.user_enrollment_summary AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  COUNT(DISTINCT e.id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END) as completed_courses,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_spent,
  MAX(e.enrolled_at) as last_enrollment_date,
  MAX(o.created_at) as last_order_date
FROM public.profiles p
LEFT JOIN public.enrollments e ON e.user_id = p.id
LEFT JOIN public.orders o ON o.user_id = p.id AND o.status = 'completed'
GROUP BY p.id, p.email, p.full_name;

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW public.user_activity_stats AS
SELECT 
  user_id,
  COUNT(*) as total_activities,
  COUNT(DISTINCT DATE(created_at)) as active_days,
  MAX(created_at) as last_activity,
  array_agg(DISTINCT action ORDER BY action) as action_types
FROM public.activity_logs
WHERE created_at >= now() - interval '30 days'
GROUP BY user_id;

-- 포인트 잔액 업데이트 함수
CREATE OR REPLACE FUNCTION public.get_user_points_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.points_transactions
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- 사용자 그룹 멤버십 뷰
CREATE OR REPLACE VIEW public.user_group_summary AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  array_agg(ug.name ORDER BY ugm.assigned_at DESC) as group_names,
  array_agg(ug.color ORDER BY ugm.assigned_at DESC) as group_colors,
  COUNT(ugm.id) as group_count
FROM public.profiles p
LEFT JOIN public.user_group_memberships ugm ON ugm.user_id = p.id
LEFT JOIN public.user_groups ug ON ug.id = ugm.group_id
GROUP BY p.id, p.email, p.full_name;