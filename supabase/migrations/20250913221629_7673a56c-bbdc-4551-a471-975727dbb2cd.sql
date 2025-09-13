-- Update existing categories and add new ones
-- First, delete all existing categories and recreate them
-- We need to temporarily remove foreign key constraints or update courses first

-- Update any existing courses to use one of the new category IDs
-- Get the first category ID to use as default
DO $$
DECLARE
    default_category_id uuid;
BEGIN
    -- Get first existing category ID
    SELECT id INTO default_category_id FROM categories LIMIT 1;
    
    -- Update all courses to use this category temporarily
    UPDATE courses SET category_id = default_category_id WHERE category_id IS NOT NULL;
END $$;

-- Now delete all categories and insert the new ones
DELETE FROM categories;

-- Insert the three new categories
INSERT INTO categories (name, slug, description) VALUES 
('무료강의', 'free-courses', '누구나 무료로 수강할 수 있는 강의'),
('VOD 강의', 'vod-courses', '주문형 비디오 강의'),
('프리미엄 강의', 'premium-courses', '프리미엄 회원 전용 강의');