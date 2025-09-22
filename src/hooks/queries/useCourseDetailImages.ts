import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DetailImage {
  id: string;
  image_url: string;
  image_name: string;
  section_title: string;
  order_index: number;
}

const fetchCourseDetailImages = async (courseId: string): Promise<DetailImage[]> => {
  const { data, error } = await supabase
    .from('course_detail_images')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const useCourseDetailImages = (courseId: string) => {
  return useQuery({
    queryKey: ['course-detail-images', courseId],
    queryFn: () => fetchCourseDetailImages(courseId),
    enabled: !!courseId,
  });
};