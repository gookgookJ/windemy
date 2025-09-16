-- Add draft/published system to hero slides
ALTER TABLE hero_slides 
ADD COLUMN is_draft boolean DEFAULT false,
ADD COLUMN published_at timestamp with time zone;