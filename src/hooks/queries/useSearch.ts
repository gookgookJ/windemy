import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  short_description: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  level: string;
  instructor: string;
  category: string;
  rating: number;
  review_count: number;
  total_students: number;
}

interface SearchResult extends Course {
  relevance: number;
}

const performSearch = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      short_description,
      thumbnail_url,
      thumbnail_path,
      price,
      level,
      total_students,
      instructors!inner(full_name),
      categories!inner(name),
      course_reviews(rating)
    `)
    .eq('is_published', true);

  if (error) throw error;

  const courses = (data || []).map((course: any) => ({
    id: course.id,
    title: course.title,
    short_description: course.short_description,
    thumbnail_url: course.thumbnail_url,
    thumbnail_path: course.thumbnail_path,
    price: course.price,
    level: course.level,
    total_students: course.total_students,
    instructor: course.instructors?.full_name || '알 수 없음',
    category: course.categories?.name || '기타',
    rating: course.course_reviews?.length > 0 
      ? course.course_reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / course.course_reviews.length 
      : 0,
    review_count: course.course_reviews?.length || 0,
  }));

  // Filter and rank by relevance
  const lowerQuery = query.toLowerCase();
  return courses
    .map((course: Course) => {
      let relevance = 0;
      
      if (course.title.toLowerCase().includes(lowerQuery)) relevance += 10;
      if (course.short_description.toLowerCase().includes(lowerQuery)) relevance += 5;
      if (course.instructor.toLowerCase().includes(lowerQuery)) relevance += 7;
      if (course.category.toLowerCase().includes(lowerQuery)) relevance += 3;
      
      return { ...course, relevance };
    })
    .filter((course: SearchResult) => course.relevance > 0)
    .sort((a: SearchResult, b: SearchResult) => b.relevance - a.relevance)
    .slice(0, 5);
};

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Live search query
  const { data: liveSearchResults = [], isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => performSearch(searchQuery),
    enabled: searchQuery.length > 0,
    staleTime: 30 * 1000, // 30초
  });

  const addToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const updatedSearches = [
      trimmedQuery,
      ...recentSearches.filter(s => s !== trimmedQuery)
    ].slice(0, 10);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const removeFromRecentSearches = (query: string) => {
    const updatedSearches = recentSearches.filter(s => s !== query);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return {
    searchQuery,
    setSearchQuery,
    liveSearchResults,
    isLoading,
    recentSearches,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
  };
};