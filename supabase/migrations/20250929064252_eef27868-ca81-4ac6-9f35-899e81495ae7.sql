-- 1. 사용자 그룹 관리 시스템
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_groups
CREATE POLICY "Admins can manage all user groups" 
ON public.user_groups 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Everyone can view user groups" 
ON public.user_groups 
FOR SELECT 
USING (true);

-- 2. 사용자-그룹 매핑 테이블
CREATE TABLE public.user_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_group_memberships
CREATE POLICY "Admins can manage all group memberships" 
ON public.user_group_memberships 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own group memberships" 
ON public.user_group_memberships 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

-- 3. 적립금 시스템
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 양수: 적립, 음수: 사용
  type TEXT NOT NULL CHECK (type IN ('earned', 'used', 'expired', 'admin_adjustment')),
  description TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own points transactions" 
ON public.points_transactions 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all points transactions" 
ON public.points_transactions 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "System can insert points transactions" 
ON public.points_transactions 
FOR INSERT 
WITH CHECK (true);

-- 4. 사용자 포인트 잔액 뷰 (계산된 컬럼)
CREATE OR REPLACE VIEW public.user_points_balance AS
SELECT 
  user_id,
  COALESCE(SUM(amount), 0) as total_points,
  COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_used
FROM public.points_transactions
WHERE expires_at IS NULL OR expires_at > now()
GROUP BY user_id;

-- 5. 포인트 만료 처리 함수
CREATE OR REPLACE FUNCTION public.expire_points()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- 만료된 포인트에 대해 차감 트랜잭션 생성
  INSERT INTO public.points_transactions (user_id, amount, type, description, expires_at)
  SELECT 
    pt.user_id,
    -pt.amount as amount,
    'expired' as type,
    'Points expired: ' || pt.description as description,
    now() as expires_at
  FROM public.points_transactions pt
  WHERE pt.type = 'earned' 
    AND pt.expires_at IS NOT NULL 
    AND pt.expires_at <= now()
    AND NOT EXISTS (
      SELECT 1 FROM public.points_transactions pt2
      WHERE pt2.user_id = pt.user_id 
        AND pt2.type = 'expired'
        AND pt2.description LIKE 'Points expired: ' || pt.description
    );
END;
$$;

-- Trigger for updating timestamps
CREATE TRIGGER update_user_groups_updated_at
BEFORE UPDATE ON public.user_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();