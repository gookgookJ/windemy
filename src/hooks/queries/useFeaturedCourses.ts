import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: 'emoji' | 'lucide' | 'custom';
  icon_value: string;
  section_type: string;
  filter_type: 'manual' | 'category' | 'tag' | 'hot_new';
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
  instructor_name?: string;
  rating?: number;
  review_count?: number;
  total_students?: number;
  category_name?: string;
}

const fetchFeaturedCoursesData = async () => {
  // Fetch homepage sections
  const { data: sections, error: sectionsError } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('is_active', true)
    .eq('is_draft', false)
    .order('order_index')
    .limit(4);

  if (sectionsError) throw sectionsError;

  const sectionCourses: Record<string, Course[]> = {};

  // Fetch courses for each section
  for (const section of sections || []) {
    if (section.filter_type === 'manual') {
      // Fetch manually selected courses
      const { data: manualCourses, error: manualError } = await supabase
        .from('homepage_section_courses')
        .select(`
          order_index,
          courses:course_id(
            *,
            instructors!inner(full_name),
            categories!inner(name),
            course_reviews(rating)
          )
        `)
        .eq('section_id', section.id)
        .eq('is_draft', false)
        .order('order_index');

      if (manualError) throw manualError;

      // Transform the data
      const transformedCourses = (manualCourses || [])
        .filter((mc: any) => mc.courses && mc.courses.is_published)
        .map((mc: any) => ({
          ...mc.courses,
          instructor_name: mc.courses?.instructors?.full_name || '운영진',
          category_name: mc.courses?.categories?.name || '기타',
          rating: mc.courses?.course_reviews?.length > 0 
            ? mc.courses.course_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / mc.courses.course_reviews.length 
            : 0,
          review_count: mc.courses?.course_reviews?.length || 0,
        }))
        .slice(0, section.display_limit);

      sectionCourses[section.id] = transformedCourses;

    } else if (section.filter_type === 'category' && section.filter_value) {
      // Fetch courses by category  
      const { data: categoryCourses, error: categoryError } = await supabase
        .from('courses')
        .select(`
          *,
          instructors!inner(full_name),
          categories!inner(name),
          course_reviews(rating)
        `)
        .eq('is_published', true)
        .eq('categories.name', section.filter_value)
        .order('created_at', { ascending: false })
        .limit(section.display_limit);

      if (categoryError) throw categoryError;

      const transformedCategoryCourses = (categoryCourses || []).map((course: any) => ({
        ...course,
        instructor_name: course.instructors?.full_name || '운영진',
        category_name: course.categories?.name || '기타',
        rating: course.course_reviews?.length > 0 
          ? course.course_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / course.course_reviews.length 
          : 0,
        review_count: course.course_reviews?.length || 0,
      }));

      sectionCourses[section.id] = transformedCategoryCourses;

    } else {
      // Default: popular courses
      const { data: popularCourses, error: popularError } = await supabase
        .from('courses')
        .select(`
          *,
          instructors!inner(full_name),
          categories!inner(name),
          course_reviews(rating)
        `)
        .eq('is_published', true)
        .order('total_students', { ascending: false })
        .limit(section.display_limit);

      if (popularError) throw popularError;

      const transformedPopularCourses = (popularCourses || []).map((course: any) => ({
        ...course,
        instructor_name: course.instructors?.full_name || '운영진',
        category_name: course.categories?.name || '기타',
        rating: course.course_reviews?.length > 0 
          ? course.course_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / course.course_reviews.length 
          : 0,
        review_count: course.course_reviews?.length || 0,
      }));

      sectionCourses[section.id] = transformedPopularCourses;
    }
  }

  return {
    sections: (sections || []).map(section => ({
      ...section,
      icon_type: section.icon_type as 'emoji' | 'lucide' | 'custom',
      filter_type: section.filter_type as 'manual' | 'category' | 'tag' | 'hot_new'
    })),
    sectionCourses,
  };
};

export const useFeaturedCourses = () => {
  return useQuery({
    queryKey: ['featured-courses'],
    queryFn: fetchFeaturedCoursesData,
  });
};