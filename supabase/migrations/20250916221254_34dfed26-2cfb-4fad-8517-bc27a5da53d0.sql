-- Clean up duplicate homepage sections by removing draft entries
-- Keep only the published (is_draft = false) versions

DELETE FROM homepage_section_courses 
WHERE section_id IN (
  SELECT id FROM homepage_sections WHERE is_draft = true
);

DELETE FROM homepage_sections WHERE is_draft = true;

-- Remove the draft columns since they're causing type issues
ALTER TABLE homepage_sections DROP COLUMN IF EXISTS is_draft;
ALTER TABLE homepage_sections DROP COLUMN IF EXISTS published_at;
ALTER TABLE homepage_section_courses DROP COLUMN IF EXISTS is_draft;