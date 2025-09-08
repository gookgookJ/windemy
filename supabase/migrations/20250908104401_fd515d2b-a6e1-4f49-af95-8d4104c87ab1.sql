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
) ON CONFLICT (course_id, name) DO NOTHING;

-- Add sample curriculum sections
INSERT INTO course_sessions (course_id, title, description, order_index, duration_minutes, is_preview) VALUES
('550e8400-e29b-41d4-a716-446655440000', '공동구매 중개 시장 분석', '공동구매 중개 시장의 현황과 기회 분석', 1, 45, true),
('550e8400-e29b-41d4-a716-446655440000', '수익성 상품군 발굴법', '고수익 상품군을 찾는 노하우', 2, 60, true),
('550e8400-e29b-41d4-a716-446655440000', '효과적인 마케팅 전략', '고객 유치를 위한 마케팅 방법', 3, 50, false),
('550e8400-e29b-41d4-a716-446655440000', '자동화 시스템 구축', '업무 자동화로 시간 효율성 극대화', 4, 75, false)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Add sample reviews
INSERT INTO course_reviews (course_id, user_id, rating, review_text) VALUES
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM profiles LIMIT 1), 5, '정말 체계적이고 실무에 도움이 되는 강의입니다. 특히 자동화 시스템 구축 부분이 좋았어요!'),
('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM profiles LIMIT 1), 5, '강사님의 설명이 정말 명확하고 이해하기 쉽게 되어있네요. 추천합니다!')
ON CONFLICT (course_id, user_id) DO NOTHING;