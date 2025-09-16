-- Add draft status to homepage sections for safer content management
ALTER TABLE homepage_sections 
ADD COLUMN is_draft BOOLEAN DEFAULT false;

-- Add published_at timestamp to track when sections go live
ALTER TABLE homepage_sections 
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- Update existing sections to be published (maintain current behavior)
UPDATE homepage_sections 
SET is_draft = false, published_at = now() 
WHERE is_active = true;

-- Create draft versions of existing sections for admin editing
INSERT INTO homepage_sections (
  title, subtitle, icon_type, icon_value, section_type, 
  filter_type, filter_value, display_limit, order_index, 
  is_active, is_draft, created_at, updated_at
)
SELECT 
  title, subtitle, icon_type, icon_value, section_type,
  filter_type, filter_value, display_limit, order_index,
  is_active, true as is_draft, now(), now()
FROM homepage_sections 
WHERE is_draft = false;

-- Add draft status to homepage section courses as well
ALTER TABLE homepage_section_courses 
ADD COLUMN is_draft BOOLEAN DEFAULT false;