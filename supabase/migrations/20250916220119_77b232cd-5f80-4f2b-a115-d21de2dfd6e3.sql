-- Update display_limit for existing homepage sections to 15
UPDATE homepage_sections 
SET display_limit = 15 
WHERE display_limit = 8;