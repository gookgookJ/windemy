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
    let query = supabase.from('courses').select(`
      id,
      title,
      short_description,
      category_id,
      thumbnail_url,
      thumbnail_path,
      price,
      level,
      total_students,
      instructors (full_name),
      categories (name),
      course_reviews (rating)
    `).eq('is_published', true);

    // Apply filters based on section configuration
    if (section.filter_type === 'category' && section.filter_value) {
      if (section.filter_value === 'featured') {
        // Featured courses logic - you might want to add a featured flag
        query = query.order('total_students', { ascending: false });
      } else {
        query = query.eq('category_id', section.filter_value);
      }
    } else if (section.filter_type === 'level' && section.filter_value) {
      query = query.eq('level', section.filter_value);
    } else if (section.filter_type === 'popular') {
      query = query.order('total_students', { ascending: false });
    } else if (section.filter_type === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('total_students', { ascending: false });
    }

    const { data: coursesData, error: coursesError } = await query.limit(section.display_limit);

    if (coursesError) throw coursesError;

    // Transform the data
    const transformedCourses = (coursesData || []).map((course: any) => ({
      id: course.id,
      title: course.title,
      short_description: course.short_description,
      category_id: course.category_id,
      thumbnail_url: course.thumbnail_url,
      thumbnail_path: course.thumbnail_path,
      price: course.price,
      level: course.level,
      total_students: course.total_students,
      instructor_name: course.instructors?.full_name || '알 수 없음',
      category_name: course.categories?.name || '기타',
      rating: course.course_reviews?.length > 0 
        ? course.course_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / course.course_reviews.length 
        : 0,
      review_count: course.course_reviews?.length || 0,
    }));

    sectionCourses[section.id] = transformedCourses;
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