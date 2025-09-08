-- Add missing columns to courses table for detailed course information
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS what_you_will_learn TEXT[],
ADD COLUMN IF NOT EXISTS requirements TEXT[],
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
ADD COLUMN IF NOT EXISTS detail_image_path TEXT;

-- Create course_options table for different pricing tiers
CREATE TABLE IF NOT EXISTS course_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course_options
ALTER TABLE course_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_options
CREATE POLICY "Course options viewable by everyone" ON course_options FOR SELECT USING (true);
CREATE POLICY "Instructors can manage own course options" ON course_options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_options.course_id 
    AND courses.instructor_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all course options" ON course_options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update course_sessions to include more detailed information
ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;

-- Add sample data for the current course
INSERT INTO courses (
  id,
  title,
  description,
  short_description,
  price,
  instructor_id,
  category_id,
  level,
  duration_hours,
  rating,
  total_students,
  is_published,
  what_you_will_learn,
  requirements,
  thumbnail_path,
  detail_image_path
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '핸드폰 하나로 하루 3시간 일하며 월 순익 천만원 벌어가는 공동구매 중개의 정석',
  '핸드폰 하나로 하루 3시간만 투자하여 월 순익 천만원을 만드는 공동구매 중개의 모든 노하우를 전수합니다.',
  '공동구매 중개로 월 천만원 수익 창출하는 완벽 가이드',
  1950000,
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM categories LIMIT 1),
  '초급',
  120,
  4.9,
  5420,
  true,
  ARRAY[
    '공동구매 중개 시장 분석 및 진입 전략',
    '수익성 높은 상품군 발굴 및 소싱 방법',
    '효과적인 마케팅 및 고객 관리 시스템',
    '리스크 관리 및 법적 이슈 대응',
    '자동화 시스템 구축으로 시간 효율성 극대화'
  ],
  ARRAY[
    '스마트폰 사용 가능',
    '기본적인 온라인 업무 처리 능력',
    '성실한 학습 의지'
  ],
  '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png',
  '/assets/course-detail-long.jpg'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  duration_hours = EXCLUDED.duration_hours,
  rating = EXCLUDED.rating,
  total_students = EXCLUDED.total_students,
  what_you_will_learn = EXCLUDED.what_you_will_learn,
  requirements = EXCLUDED.requirements,
  thumbnail_path = EXCLUDED.thumbnail_path,
  detail_image_path = EXCLUDED.detail_image_path;

-- Add course options for the sample course
INSERT INTO course_options (course_id, name, price, original_price, benefits) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '온라인 강의',
  1950000,
  2650000,
  ARRAY[
    '💰 수료 후 매출 천만원 보장',
    '🎁 신청만 해도 300만원 상당 혜택 제공',
    '💪 1:1로 케어하는 스파르타 학습 시스템',
    '📱 핸드폰 하나로 완전 자동화 시스템',
    '⚡ 하루 3시간 투자로 월 천만원 수익 보장',
    '🔒 평생 A/S 및 업데이트 지원'
  ]
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '오프라인 (소수정예 30명)',
  3250000,
  4200000,
  ARRAY[
    '💰 수료 후 매출 천만원 보장',
    '🎁 신청만 해도 300만원 상당 혜택 제공',
    '💪 1:1로 케어하는 스파르타 학습 시스템',
    '📱 핸드폰 하나로 완전 자동화 시스템',
    '⚡ 하루 3시간 투자로 월 천만원 수익 보장',
    '🔒 평생 A/S 및 업데이트 지원',
    '👥 오프라인 네트워킹 및 실습',
    '🏆 현장 멘토링 및 즉석 피드백'
  ]
);

-- Add sample curriculum sections
INSERT INTO course_sessions (course_id, title, description, order_index, duration_minutes, is_preview) VALUES
('550e8400-e29b-41d4-a716-446655440000', '공동구매 중개 시장 분석', '공동구매 중개 시장의 현황과 기회 분석', 1, 45, true),
('550e8400-e29b-41d4-a716-446655440000', '수익성 상품군 발굴법', '고수익 상품군을 찾는 노하우', 2, 60, true),
('550e8400-e29b-41d4-a716-446655440000', '효과적인 마케팅 전략', '고객 유치를 위한 마케팅 방법', 3, 50, false),
('550e8400-e29b-41d4-a716-446655440000', '자동화 시스템 구축', '업무 자동화로 시간 효율성 극대화', 4, 75, false);

-- Add sample reviews
INSERT INTO course_reviews (course_id, user_id, rating, review_text) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM profiles LIMIT 1), 5, '정말 체계적이고 실무에 도움이 되는 강의입니다. 특히 자동화 시스템 구축 부분이 좋았어요!'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM profiles LIMIT 1), 5, '강사님의 설명이 정말 명확하고 이해하기 쉽게 되어있네요. 추천합니다!');