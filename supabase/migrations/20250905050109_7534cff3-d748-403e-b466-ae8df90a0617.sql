-- Add sample courses and enrollments for testing
INSERT INTO public.courses (id, title, description, short_description, thumbnail_url, instructor_id, price, is_published, level) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '실무에 바로 적용하는 React.js 완전정복', '실무에서 바로 활용할 수 있는 React.js 기술을 체계적으로 학습합니다. 기초부터 고급 패턴까지 모든 것을 다룹니다.', 'React 기초부터 고급까지', '/placeholder.svg', (SELECT id FROM profiles WHERE email = 'jayce@windly.cc' LIMIT 1), 89000, true, 'intermediate');

-- Add course sessions for the sample course
INSERT INTO public.course_sessions (course_id, title, description, order_index, duration_minutes, video_url, is_free) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'React 소개와 환경 설정', 'React 기본 개념과 개발 환경을 설정하는 방법을 학습합니다.', 1, 25, 'https://vimeo.com/76979871', true),
('550e8400-e29b-41d4-a716-446655440000', '컴포넌트 기본 개념', 'React 컴포넌트의 기본 개념과 사용법을 익힙니다.', 2, 30, 'https://vimeo.com/76979871', true),
('550e8400-e29b-41d4-a716-446655440000', 'JSX 문법 완전 정복', 'JSX 문법을 상세히 학습하고 실습합니다.', 3, 35, 'https://vimeo.com/76979871', false),
('550e8400-e29b-41d4-a716-446655440000', 'Props와 State', 'Props와 State의 개념을 이해하고 활용법을 학습합니다.', 4, 40, 'https://vimeo.com/76979871', false);

-- Add sample enrollment
INSERT INTO public.enrollments (user_id, course_id, progress) VALUES
((SELECT id FROM profiles WHERE email = 'jayce@windly.cc' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 25);