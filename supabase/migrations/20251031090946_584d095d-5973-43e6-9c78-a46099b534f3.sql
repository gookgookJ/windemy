-- Create announcements table for managing announcements
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal_documents table for managing terms and privacy policy
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_announcements_active ON public.announcements(is_active, priority DESC);
CREATE INDEX idx_legal_documents_type_active ON public.legal_documents(document_type, is_active, effective_date DESC);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
USING (public.is_admin());

-- RLS Policies for legal_documents
CREATE POLICY "Anyone can view active legal documents"
ON public.legal_documents
FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert legal documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update legal documents"
ON public.legal_documents
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete legal documents"
ON public.legal_documents
FOR DELETE
USING (public.is_admin());

-- Add update trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial welcome announcement
INSERT INTO public.announcements (title, content, is_active, priority)
VALUES (
  '윈들리아카데미에 오신 것을 환영합니다!',
  '안녕하세요! 윈들리아카데미입니다.

이커머스 사업과 관련하여 궁금하셨던 부분들을 속시원하게 해결해드립니다.

**주요 학습 내용:**
- 매출 상승을 위한 실전 전략
- AI 활용 마케팅 기법
- 이커머스 운영 노하우
- 데이터 기반 의사결정

여러분의 성공적인 이커머스 사업을 위해 최선을 다하겠습니다.',
  true,
  1
);

-- Insert current terms of service
INSERT INTO public.legal_documents (document_type, title, content, version, is_active, effective_date)
VALUES (
  'terms',
  '윈들리아카데미 이용약관',
  '현재 하드코딩된 이용약관 내용을 여기에 복사해주세요.',
  '1.0',
  true,
  now()
);

-- Insert current privacy policy
INSERT INTO public.legal_documents (document_type, title, content, version, is_active, effective_date)
VALUES (
  'privacy',
  '개인정보 처리방침',
  '현재 하드코딩된 개인정보처리방침 내용을 여기에 복사해주세요.',
  '1.0',
  true,
  now()
);