import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  short_description?: string;
  category_id?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  level?: string;
  is_published: boolean;
}

interface SearchResult extends Course {
  relevance: number;
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Load recommended courses on mount
  useEffect(() => {
    loadRecommendedCourses();
  }, []);

  const loadRecommendedCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, short_description, category_id, thumbnail_url, thumbnail_path, price, level, is_published')
        .eq('is_published', true)
        .order('total_students', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecommendedCourses(data || []);
    } catch (error) {
      console.error('Error loading recommended courses:', error);
    }
  };

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const removeFromRecentSearches = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const searchCourses = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search in course titles and descriptions
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, short_description, category_id, thumbnail_url, thumbnail_path, price, level, is_published')
        .eq('is_published', true);

      if (error) throw error;

      // Calculate relevance scores
      const results: SearchResult[] = (data || [])
        .map((course: Course) => {
          const titleMatch = course.title.toLowerCase().includes(query.toLowerCase());
          const descMatch = course.short_description?.toLowerCase().includes(query.toLowerCase()) || false;
          
          let relevance = 0;
          if (titleMatch) relevance += 10;
          if (descMatch) relevance += 5;
          
          return { ...course, relevance };
        })
        .filter(course => course.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);

      setSearchResults(results);
      // 검색 결과가 있을 때만 최근 검색어에 추가
      if (results.length > 0) {
        addToRecentSearches(query);
      }
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPopularSearchTerms = () => {
    // Generate popular search terms from course titles - more relevant keywords
    const keywords = [
      '이커머스', '쇼핑몰', '온라인사업', '창업', 
      '마케팅', '광고', '브랜딩', '콘텐츠',
      '소셜미디어', 'SNS', '인플루언서', '유튜브',
      '데이터분석', '트렌드', '고객관리', '판매전략'
    ];
    
    // Also include terms from actual course titles
    const courseTerms = recommendedCourses
      .map(course => course.title.split(/[\s,\-\(\)]+/))
      .flat()
      .filter(word => word.length > 2 && !['강의', '패키지', '모든', '것은', '위한'].includes(word))
      .slice(0, 4);
    
    return [...keywords.slice(0, 6), ...Array.from(new Set(courseTerms)).slice(0, 2)].slice(0, 8);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    recentSearches,
    recommendedCourses,
    isSearching,
    setIsSearching,
    isLoading,
    searchCourses,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
    getPopularSearchTerms,
  };
};