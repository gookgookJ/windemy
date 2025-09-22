import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  short_description?: string;
  thumbnail_url?: string;
  thumbnail_path?: string; // fallback for legacy data
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

interface SectionWithCourses extends HomepageSection {
  courses: Course[];
}

const fetchCoursesForSection = async (section: HomepageSection): Promise<Course[]> => {
  try {
    let query = supabase
      .from('courses')
      .select(`
        id, title, short_description, thumbnail_url, thumbnail_path, price, level, is_published, is_hot, is_new,
        profiles!courses_instructor_id_fkey(full_name),
        categories!courses_category_id_fkey(name)
      `)
      .eq('is_published', true);

    // 필터 타입별 처리
    switch (section.filter_type) {
      case 'category':
        if (section.filter_value) {
          query = query.eq('category_id', section.filter_value);
        }
        break;
      case 'hot_new':
        query = query.or('is_hot.eq.true,is_new.eq.true');
        break;
      case 'new':
        query = query.eq('is_new', true);
        break;
      case 'hot':
        query = query.eq('is_hot', true);
        break;
      case 'manual':
        // 수동 선택의 경우 homepage_section_courses 테이블에서 가져오기
        const { data: sectionCourses, error: sectionError } = await supabase
          .from('homepage_section_courses')
          .select(`
            course_id,
            courses!inner(
              id, title, short_description, thumbnail_url, thumbnail_path, price, level, is_published, is_hot, is_new,
              profiles!courses_instructor_id_fkey(full_name),
              categories!courses_category_id_fkey(name)
            )
          `)
          .eq('section_id', section.id)
          .eq('courses.is_published', true)
          .order('order_index');

        if (sectionError) {
          console.error('Manual section courses error:', sectionError);
          return [];
        }

        const mapped = (sectionCourses || []).map((item: any) => ({
          ...item.courses,
          thumbnail_url: item.courses.thumbnail_url || item.courses.thumbnail_path,
          instructor_name: item.courses.profiles?.full_name || '운영진',
          category_name: item.courses.categories?.name || '미분류'
        }));
        // Deduplicate by course id
        return Array.from(new Map(mapped.map((c: any) => [c.id, c])).values());
    }

    // 표시 제한 적용
    query = query.limit(section.display_limit);

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching courses for section ${section.id}:`, error);
      return [];
    }

    // 데이터 변환 및 중복 제거
    const mapped = (data || []).map((course: any) => ({
      ...course,
      thumbnail_url: course.thumbnail_url || course.thumbnail_path,
      instructor_name: course.profiles?.full_name || '운영진',
      category_name: course.categories?.name || '미분류'
    }));
    return Array.from(new Map(mapped.map((c: any) => [c.id, c])).values());
  } catch (error) {
    console.error(`Fetch courses for section ${section.id} error:`, error);
    return [];
  }
};

const fetchHomepageSections = async (): Promise<SectionWithCourses[]> => {
  try {
    // 활성화된 섹션들 가져오기
    const { data: sections, error: sectionsError } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (sectionsError) {
      console.error('Error fetching homepage sections:', sectionsError);
      throw new Error(`Homepage sections fetch failed: ${sectionsError.message}`);
    }

    if (!sections || sections.length === 0) {
      return [];
    }

    // 각 섹션별로 강의 데이터 병렬 처리
    const sectionsWithCourses = await Promise.all(
      sections.map(async (section) => {
        const courses = await fetchCoursesForSection(section);
        return {
          ...section,
          courses
        };
      })
    );

    return sectionsWithCourses;
  } catch (error) {
    console.error('Fetch homepage sections error:', error);
    throw error;
  }
};

export const useFeaturedCourses = () => {
  return useQuery({
    queryKey: ['featured-courses'],
    queryFn: fetchHomepageSections,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 15 * 60 * 1000, // 15분
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: '추천 강의 데이터를 불러오는데 실패했습니다.'
    }
  });
};

// 타입 export
export type { Course, HomepageSection, SectionWithCourses };