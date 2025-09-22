import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_type: string;
  link_url?: string;
  course_id?: string;
  background_color?: string;
  order_index: number;
  is_active: boolean;
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
  short_description?: string;
  thumbnail_url?: string;
  price: number;
  level?: string;
  is_published: boolean;
  is_hot?: boolean;
  is_new?: boolean;
  instructor_name?: string;
  category_name?: string;
  profiles?: {
    full_name: string;
  };
  categories?: {
    name: string;
  };
}

const fetchHomepageData = async () => {
  try {
    // Hero slides 가져오기
    const { data: heroSlides, error: heroError } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (heroError) {
      console.error('Error fetching hero slides:', heroError);
      throw new Error(`Hero slides fetch failed: ${heroError.message}`);
    }

    // Homepage sections 가져오기  
    const { data: sections, error: sectionsError } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (sectionsError) {
      console.error('Error fetching homepage sections:', sectionsError);
      throw new Error(`Homepage sections fetch failed: ${sectionsError.message}`);
    }

    // Featured courses 가져오기 (첫 번째 섹션용)
    const { data: featuredCourses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id, title, short_description, thumbnail_url, price, level, is_published, is_hot, is_new,
        profiles!courses_instructor_id_fkey(full_name),
        categories!courses_category_id_fkey(name)
      `)
      .eq('is_published', true)
      .limit(8);

    if (coursesError) {
      console.error('Error fetching featured courses:', coursesError);
      throw new Error(`Featured courses fetch failed: ${coursesError.message}`);
    }

    // 데이터 변환
    const transformedCourses = featuredCourses?.map(course => ({
      ...course,
      instructor_name: course.profiles?.full_name || '운영진',
      category_name: course.categories?.name || '미분류'
    })) || [];

    return {
      heroSlides: heroSlides || [],
      sections: sections || [],
      featuredCourses: transformedCourses
    };
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    throw error;
  }
};

export const useHomepageData = () => {
  return useQuery({
    queryKey: ['homepage-data'],
    queryFn: fetchHomepageData,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: '홈페이지 데이터를 불러오는데 실패했습니다.'
    }
  });
};

// 타입 export
export type { HeroSlide, HomepageSection, Course };