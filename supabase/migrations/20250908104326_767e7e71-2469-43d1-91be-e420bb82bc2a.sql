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

-- Add sample data for the current course using proper level value
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
  'beginner',
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