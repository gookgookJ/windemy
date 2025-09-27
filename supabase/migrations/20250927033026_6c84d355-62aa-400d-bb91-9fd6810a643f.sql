-- 함수의 search_path 보안 문제 수정
CREATE OR REPLACE FUNCTION public.reorder_section_courses_after_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;