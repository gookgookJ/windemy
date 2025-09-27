-- 홈페이지 섹션 강의 순서 관리를 위한 함수 생성
CREATE OR REPLACE FUNCTION public.reorder_section_courses_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 추가된 강의가 order_index 0인 경우, 기존 강의들의 order_index를 1씩 증가
  IF NEW.order_index = 0 THEN
    UPDATE public.homepage_section_courses 
    SET order_index = order_index + 1
    WHERE section_id = NEW.section_id 
      AND id != NEW.id 
      AND order_index >= 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER reorder_section_courses_trigger
  AFTER INSERT ON public.homepage_section_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.reorder_section_courses_after_insert();