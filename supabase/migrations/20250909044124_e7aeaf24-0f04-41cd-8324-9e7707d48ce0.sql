-- 공지사항 테이블
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'maintenance', 'feature')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'instructors', 'premium')),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 고객 지원 티켓 테이블
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'course', 'refund')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 쿠폰 및 할인 코드 테이블  
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_courses UUID[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 시스템 설정 테이블
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 활동 로그 테이블
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 공지사항 정책
CREATE POLICY "Everyone can view published announcements"
ON public.announcements FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all announcements"
ON public.announcements FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 지원 티켓 정책
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 쿠폰 정책
CREATE POLICY "Active coupons viewable by authenticated users"
ON public.coupons FOR SELECT
USING (is_active = true AND valid_until > now() AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all coupons"
ON public.coupons FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 시스템 설정 정책
CREATE POLICY "Public settings viewable by everyone"
ON public.system_settings FOR SELECT
USING (is_public = true);

CREATE POLICY "Admins can manage all settings"
ON public.system_settings FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 활동 로그 정책
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 트리거 설정
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 초기 시스템 설정 데이터
INSERT INTO public.system_settings (key, value, description, category, is_public, updated_by) VALUES
('site_name', '"에듀플랫폼"', '사이트 이름', 'general', true, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('site_description', '"최고의 온라인 학습 경험을 제공합니다"', '사이트 설명', 'general', true, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('max_course_price', '500000', '최대 강의 가격', 'course', false, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('commission_rate', '0.3', '수수료율 (0.3 = 30%)', 'payment', false, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('auto_approval', 'false', '강의 자동 승인 여부', 'course', false, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));

-- 샘플 공지사항
INSERT INTO public.announcements (title, content, type, is_published, target_audience, created_by) VALUES
('플랫폼 오픈 안내', '안녕하세요! 새로운 온라인 학습 플랫폼이 오픈되었습니다. 다양한 강의를 만나보세요!', 'general', true, 'all', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('신규 강사 모집', '경험이 풍부한 강사님들을 모집합니다. 많은 지원 바랍니다.', 'feature', true, 'instructors', (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));