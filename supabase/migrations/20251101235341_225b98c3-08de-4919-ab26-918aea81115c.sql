-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  published_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create FAQs table
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create policy documents table (for terms and privacy)
CREATE TABLE public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  section_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all announcements"
ON public.announcements FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for FAQs
CREATE POLICY "Anyone can view active FAQs"
ON public.faqs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all FAQs"
ON public.faqs FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for policy documents
CREATE POLICY "Anyone can view active policy documents"
ON public.policy_documents FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all policy documents"
ON public.policy_documents FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_announcements_published_date ON public.announcements(published_date DESC);
CREATE INDEX idx_announcements_order ON public.announcements(order_index);
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_order ON public.faqs(order_index);
CREATE INDEX idx_policy_documents_type ON public.policy_documents(document_type);
CREATE INDEX idx_policy_documents_order ON public.policy_documents(order_index);

-- Add updated_at triggers
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policy_documents_updated_at
  BEFORE UPDATE ON public.policy_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();