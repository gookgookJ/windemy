-- Add link_type and link_url to hero_slides for course/url linking
ALTER TABLE public.hero_slides
ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'course',
ADD COLUMN IF NOT EXISTS link_url text;

-- Optional: constrain link_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hero_slides_link_type_check'
  ) THEN
    ALTER TABLE public.hero_slides
    ADD CONSTRAINT hero_slides_link_type_check CHECK (link_type IN ('course', 'url'));
  END IF;
END $$;