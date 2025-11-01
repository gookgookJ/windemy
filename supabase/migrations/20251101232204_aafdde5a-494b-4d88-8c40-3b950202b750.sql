-- Create announcements table for managing announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create FAQs table for managing frequently asked questions
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create legal_documents table for terms and privacy policy
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL, -- 'terms' or 'privacy'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  section_id TEXT, -- For organizing into sections (e.g., 'terms-1', 'terms-2')
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0',
  effective_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Anyone can view published announcements"
  ON public.announcements FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all announcements"
  ON public.announcements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for FAQs
CREATE POLICY "Anyone can view published FAQs"
  ON public.faqs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all FAQs"
  ON public.faqs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for legal_documents
CREATE POLICY "Anyone can view published legal documents"
  ON public.legal_documents FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all legal documents"
  ON public.legal_documents FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_announcements_published ON public.announcements(is_published, published_at DESC);
CREATE INDEX idx_faqs_category ON public.faqs(category, order_index);
CREATE INDEX idx_legal_documents_type ON public.legal_documents(document_type, order_index);

-- Add trigger for updating updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();