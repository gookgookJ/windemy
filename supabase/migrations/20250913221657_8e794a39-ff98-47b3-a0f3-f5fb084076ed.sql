-- Update existing categories in place, then add missing ones
-- First, get existing categories and update them one by one
WITH category_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM categories
)
UPDATE categories 
SET 
  name = CASE 
    WHEN cu.rn = 1 THEN '무료강의'
    WHEN cu.rn = 2 THEN 'VOD 강의'  
    WHEN cu.rn = 3 THEN '프리미엄 강의'
    ELSE name
  END,
  slug = CASE 
    WHEN cu.rn = 1 THEN 'free-courses'
    WHEN cu.rn = 2 THEN 'vod-courses'
    WHEN cu.rn = 3 THEN 'premium-courses' 
    ELSE slug
  END,
  description = CASE 
    WHEN cu.rn = 1 THEN '누구나 무료로 수강할 수 있는 강의'
    WHEN cu.rn = 2 THEN '주문형 비디오 강의'
    WHEN cu.rn = 3 THEN '프리미엄 회원 전용 강의'
    ELSE description
  END
FROM category_updates cu
WHERE categories.id = cu.id;

-- Insert missing categories if we have less than 3
INSERT INTO categories (name, slug, description)
SELECT '무료강의', 'free-courses', '누구나 무료로 수강할 수 있는 강의'
WHERE (SELECT COUNT(*) FROM categories WHERE slug = 'free-courses') = 0;

INSERT INTO categories (name, slug, description)  
SELECT 'VOD 강의', 'vod-courses', '주문형 비디오 강의'
WHERE (SELECT COUNT(*) FROM categories WHERE slug = 'vod-courses') = 0;

INSERT INTO categories (name, slug, description)
SELECT '프리미엄 강의', 'premium-courses', '프리미엄 회원 전용 강의'  
WHERE (SELECT COUNT(*) FROM categories WHERE slug = 'premium-courses') = 0;