-- Update existing categories and add new ones
-- First check what categories exist and update them
UPDATE categories SET 
  name = '무료강의',
  slug = 'free-courses',
  description = '누구나 무료로 수강할 수 있는 강의'
WHERE slug = 'programming' OR slug = 'design' OR name LIKE '%무료%' OR name LIKE '%free%'
LIMIT 1;

UPDATE categories SET 
  name = 'VOD 강의',
  slug = 'vod-courses', 
  description = '주문형 비디오 강의'
WHERE slug = 'business' OR slug = 'marketing' OR name LIKE '%VOD%' OR name LIKE '%vod%'
LIMIT 1;

UPDATE categories SET 
  name = '프리미엄 강의',
  slug = 'premium-courses',
  description = '프리미엄 회원 전용 강의'  
WHERE slug = 'photography' OR slug = 'music' OR name LIKE '%프리미엄%' OR name LIKE '%premium%'
LIMIT 1;

-- Insert any missing categories if they don't exist
INSERT INTO categories (name, slug, description)
SELECT '무료강의', 'free-courses', '누구나 무료로 수강할 수 있는 강의'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'free-courses');

INSERT INTO categories (name, slug, description)
SELECT 'VOD 강의', 'vod-courses', '주문형 비디오 강의'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vod-courses');

INSERT INTO categories (name, slug, description)
SELECT '프리미엄 강의', 'premium-courses', '프리미엄 회원 전용 강의'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'premium-courses');