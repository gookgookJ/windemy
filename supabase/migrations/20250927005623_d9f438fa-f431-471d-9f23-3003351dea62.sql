-- Create table for named course drafts
CREATE TABLE IF NOT EXISTS public.course_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  data jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique name per creator
CREATE UNIQUE INDEX IF NOT EXISTS uniq_course_drafts_owner_name 
  ON public.course_drafts (created_by, name);

-- Enable RLS
ALTER TABLE public.course_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Admins can manage all course drafts"
  ON public.course_drafts
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own drafts"
  ON public.course_drafts
  FOR SELECT
  USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own drafts"
  ON public.course_drafts
  FOR INSERT
  WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own drafts"
  ON public.course_drafts
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own drafts"
  ON public.course_drafts
  FOR DELETE
  USING (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_course_drafts_updated_at ON public.course_drafts;
CREATE TRIGGER update_course_drafts_updated_at
BEFORE UPDATE ON public.course_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();