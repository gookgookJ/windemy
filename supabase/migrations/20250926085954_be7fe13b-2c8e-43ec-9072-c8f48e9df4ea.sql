-- First, set all course category_id to NULL to remove foreign key references
UPDATE courses SET category_id = NULL;

-- Delete current wrong categories
DELETE FROM categories;

-- Insert original categories
INSERT INTO categories (id, name, slug, description) VALUES 
  ('11111111-1111-1111-1111-111111111111', '전체', 'all', '모든 강의'),
  ('22222222-2222-2222-2222-222222222222', '무료', 'free', '무료로 제공되는 강의'),
  ('33333333-3333-3333-3333-333333333333', '프리미엄', 'premium', '프리미엄 강의'),
  ('44444444-4444-4444-4444-444444444444', 'VOD', 'vod', 'Video On Demand 강의');

-- Update existing courses to use VOD category by default
UPDATE courses SET category_id = '44444444-4444-4444-4444-444444444444';