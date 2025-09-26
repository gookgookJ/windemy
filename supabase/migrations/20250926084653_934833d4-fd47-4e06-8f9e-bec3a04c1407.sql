-- 먼저 기존 강의들의 category_id를 NULL로 설정
UPDATE courses SET category_id = NULL;

-- 기존 카테고리 삭제
DELETE FROM categories;

-- 새로운 카테고리 추가
INSERT INTO categories (id, name, slug, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'VOD', 'vod', 'Video On Demand 온라인 강의'),
('550e8400-e29b-41d4-a716-446655440002', '오프라인', 'offline', '오프라인 현장 강의'),
('550e8400-e29b-41d4-a716-446655440003', '1:1 컨설팅', 'consulting', '개인 맞춤형 1:1 컨설팅'),
('550e8400-e29b-41d4-a716-446655440004', '챌린지·스터디', 'challenge', '그룹 챌린지 및 스터디');

-- 기존 강의들을 모두 VOD 카테고리로 설정
UPDATE courses 
SET category_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE category_id IS NULL;