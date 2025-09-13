-- Remove old categories (design and marketing)
-- First, move any courses using these categories to a default category

-- Get the ID of the free courses category to use as default
DO $$
DECLARE
    free_category_id uuid;
    design_category_id uuid;
    marketing_category_id uuid;
BEGIN
    -- Get free category ID
    SELECT id INTO free_category_id FROM categories WHERE slug = 'free-courses' LIMIT 1;
    
    -- Get design and marketing category IDs
    SELECT id INTO design_category_id FROM categories WHERE name ILIKE '%design%' OR name ILIKE '%디자인%' LIMIT 1;
    SELECT id INTO marketing_category_id FROM categories WHERE name ILIKE '%marketing%' OR name ILIKE '%마케팅%' LIMIT 1;
    
    -- Move courses from design category to free category
    IF design_category_id IS NOT NULL AND free_category_id IS NOT NULL THEN
        UPDATE courses SET category_id = free_category_id WHERE category_id = design_category_id;
    END IF;
    
    -- Move courses from marketing category to free category  
    IF marketing_category_id IS NOT NULL AND free_category_id IS NOT NULL THEN
        UPDATE courses SET category_id = free_category_id WHERE category_id = marketing_category_id;
    END IF;
END $$;

-- Delete the old categories
DELETE FROM categories WHERE name ILIKE '%design%' OR name ILIKE '%디자인%';
DELETE FROM categories WHERE name ILIKE '%marketing%' OR name ILIKE '%마케팅%';