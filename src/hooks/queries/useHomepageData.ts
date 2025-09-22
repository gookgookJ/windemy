import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// --- 타입 정의 (기존과 동일) ---
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

// --- 데이터 패칭 함수 (수정된 부분) ---
const fetchHomepageData = async () => {
  try {
    // 1️⃣ Promise.all을 사용하여 데이터 동시 요청 (성능 향상)
    const [heroResult, sectionsResult, coursesResult] = await Promise.all([
      supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index'),
      supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('order_index'),
      supabase
        .from('courses')
        .select(`
          id, title, short_description, thumbnail_url, price, level, is_published, is_hot, is_new,
          profiles!courses_instructor_id_fkey(full_name),
          categories!courses_category_id_fkey(name)
        `)
        .eq('is_published', true)
        .limit(8)
    ]);

    // 에러 처리
    const { data: heroSlides, error: heroError } = heroResult;
    if (heroError) throw new Error(`Hero slides fetch failed: ${heroError.message}`);

    const { data: sections, error: sectionsError } = sectionsResult;
    if (sectionsError) throw new Error(`Homepage sections fetch failed: ${sectionsError.message}`);

    const { data: featuredCourses, error: coursesError } = coursesResult;
    if (coursesError) throw new Error(`Featured courses fetch failed: ${coursesError.message}`);

    // 2️⃣ ✨ 히어로 슬라이드 중복 제거 로직 추가 (핵심 수정)
    const uniqueHeroSlides = heroSlides 
      ? Array.from(new Map(heroSlides.map(slide => [slide.id, slide])).values()) 
      : [];

    // 데이터 변환
    const transformedCourses = featuredCourses?.map(course => ({
      ...course,
      instructor_name: course.profiles?.full_name || '운영진',
      category_name: course.categories?.name || '미분류'
    })) || [];

    // 3️⃣ 반환 데이터 이름 일관성 유지 (courses로 통일)
    return {
      heroSlides: uniqueHeroSlides,
      sections: sections || [],
      courses: transformedCourses 
    };
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    throw error;
  }
};

// --- React Query 훅 (기존과 동일, 변수명만 변경) ---
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

// --- 타입 export (기존과 동일) ---
export type { HeroSlide, HomepageSection, Course };