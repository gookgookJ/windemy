import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  link_url?: string;
  order_index: number;
}

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: string;
  icon_value: string;
  section_type: string;
  filter_type: string;
  filter_value?: string;
  display_limit: number;
  order_index: number;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  short_description: string;
  category_id: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  level: string;
  is_published: boolean;
}

const fetchHomepageData = async () => {
  const [slidesResult, sectionsResult, coursesResult] = await Promise.all([
    supabase
      .from('hero_slides')
      .select('id, title, subtitle, description, image_url, course_id, link_url, order_index')
      .eq('is_active', true)
      .eq('is_draft', false)
      .order('order_index')
      .limit(5),
    
    supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .eq('is_draft', false)
      .order('order_index')
      .limit(4),
    
    supabase
      .from('courses')
      .select('id, title, short_description, category_id, thumbnail_url, thumbnail_path, price, level, is_published')
      .eq('is_published', true)
      .order('total_students', { ascending: false })
      .limit(6)
  ]);

  if (slidesResult.error) throw slidesResult.error;
  if (sectionsResult.error) throw sectionsResult.error;
  if (coursesResult.error) throw coursesResult.error;

  return {
    slides: slidesResult.data as HeroSlide[],
    sections: sectionsResult.data as HomepageSection[],
    featuredCourses: coursesResult.data as Course[],
  };
};

export const useHomepageData = () => {
  return useQuery({
    queryKey: ['homepage-data'],
    queryFn: fetchHomepageData,
  });
};