-- Remove unused course fields
ALTER TABLE courses DROP COLUMN IF EXISTS short_description;
ALTER TABLE courses DROP COLUMN IF EXISTS description;
ALTER TABLE courses DROP COLUMN IF EXISTS duration_hours;

-- Remove unused session fields  
ALTER TABLE course_sessions DROP COLUMN IF EXISTS description;
ALTER TABLE course_sessions DROP COLUMN IF EXISTS duration_minutes;
ALTER TABLE course_sessions DROP COLUMN IF EXISTS is_preview;