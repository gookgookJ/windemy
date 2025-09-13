-- Update categories table with the three course types
-- First, delete existing categories to start fresh
DELETE FROM categories;

-- Insert the three new categories
INSERT INTO categories (name, slug, description) VALUES 
('무료강의', 'free-courses', '누구나 무료로 수강할 수 있는 강의'),
('VOD 강의', 'vod-courses', '주문형 비디오 강의'),
('프리미엄 강의', 'premium-courses', '프리미엄 회원 전용 강의');