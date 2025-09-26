import { useState, useEffect } from 'react';
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
  category_id: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  level: string;
  is_published: boolean;
}

export const useHomepageData = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
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
            .select('id, title, category_id, thumbnail_url, thumbnail_path, price, level, is_published')
            .eq('is_published', true)
            .order('total_students', { ascending: false })
            .limit(6)
        ]);

        if (slidesResult.data) setSlides(slidesResult.data);
        if (sectionsResult.data) setSections(sectionsResult.data);
        if (coursesResult.data) setFeaturedCourses(coursesResult.data);
        
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    slides,
    sections,
    featuredCourses,
    isLoading
  };
};