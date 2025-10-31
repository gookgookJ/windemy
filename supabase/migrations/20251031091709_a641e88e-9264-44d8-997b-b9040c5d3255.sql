-- Create FAQs table for managing frequently asked questions
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_faqs_active_order ON public.faqs(is_active, category, order_index);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for FAQs
CREATE POLICY "Anyone can view active FAQs"
ON public.faqs
FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert FAQs"
ON public.faqs
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update FAQs"
ON public.faqs
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete FAQs"
ON public.faqs
FOR DELETE
USING (public.is_admin());

-- Add update trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQ data
INSERT INTO public.faqs (category, question, answer, order_index, is_active) VALUES
('강의 수강', '강의는 언제까지 수강할 수 있나요?', '구매한 강의는 평생 소장하여 언제든지 수강하실 수 있습니다. 단, 일부 라이브 강의나 특별 프로그램은 수강 기간이 제한될 수 있습니다.', 1, true),
('강의 수강', '모바일에서도 강의를 들을 수 있나요?', '네, 모바일 브라우저를 통해 언제 어디서든 강의를 수강하실 수 있습니다. 모바일 앱도 준비 중이니 조금만 기다려주세요.', 2, true),
('결제 및 환불', '어떤 결제 방법을 지원하나요?', '신용카드, 체크카드, 계좌이체, 카카오페이, 토스페이 등 다양한 결제 방법을 지원합니다.', 1, true),
('결제 및 환불', '환불 정책이 어떻게 되나요?', '구매 후 7일 이내, 강의 진도율 10% 미만일 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요.', 2, true);