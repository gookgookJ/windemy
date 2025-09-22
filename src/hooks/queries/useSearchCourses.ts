import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface Course {
  id: string;
  title: string;
  short_description?: string;
  category_id?: string;
  thumbnail_url?: string;
  price: number;
  level?: string;
  is_published: boolean;
  instructor_name?: string;
  category_name?: string;
  relevance?: number;
}

interface SearchResult extends Course {
  relevance: number;
}

const searchCourses = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, title, short_description, category_id, thumbnail_url, price, level, is_published,
        profiles!courses_instructor_id_fkey(full_name),
        categories!courses_category_id_fkey(name)
      `)
      .eq('is_published', true);

    if (error) {
      console.error('Search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // 검색 결과 필터링 및 점수 계산
    const results = (data || [])
      .map((course: any) => {
        const normalizedQuery = query.toLowerCase();
        const title = course.title.toLowerCase();
        const description = course.short_description?.toLowerCase() || '';
        const instructorName = course.profiles?.full_name?.toLowerCase() || '';
        const categoryName = course.categories?.name?.toLowerCase() || '';
        
        let relevance = 0;
        
        // 제목 매칭 (가장 높은 점수)
        if (title.includes(normalizedQuery)) {
          relevance += 15;
          // 정확한 매칭은 추가 점수
          if (title === normalizedQuery) relevance += 20;
          // 시작 부분 매칭도 추가 점수
          if (title.startsWith(normalizedQuery)) relevance += 10;
        }
        
        // 강사명 매칭
        if (instructorName.includes(normalizedQuery)) {
          relevance += 12;
          if (instructorName === normalizedQuery) relevance += 18;
        }
        
        // 설명 매칭
        if (description.includes(normalizedQuery)) {
          relevance += 5;
        }
        
        // 카테고리 매칭
        if (categoryName.includes(normalizedQuery)) {
          relevance += 8;
        }

        return {
          ...course,
          instructor_name: course.profiles?.full_name || '운영진',
          category_name: course.categories?.name || '미분류',
          relevance
        };
      })
      .filter(course => course.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5); // 상위 5개만 반환

    return results;
  } catch (error) {
    console.error('Search courses error:', error);
    throw error;
  }
};

export const useSearchCourses = (query: string, enabled: boolean = true) => {
  // 검색어가 1글자 이상일 때만 검색 실행
  const shouldSearch = query.trim().length >= 1 && enabled;
  
  const queryResult = useQuery({
    queryKey: ['search-courses', query.trim()],
    queryFn: () => searchCourses(query.trim()),
    enabled: shouldSearch,
    staleTime: 30 * 1000, // 30초 (검색은 빠른 업데이트 필요)
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: '검색 중 오류가 발생했습니다.'
    }
  });

  // 검색 결과와 로딩 상태를 메모이제이션
  const result = useMemo(() => ({
    data: shouldSearch ? (queryResult.data || []) : [],
    isLoading: shouldSearch ? queryResult.isLoading : false,
    error: queryResult.error,
    isError: queryResult.isError
  }), [shouldSearch, queryResult.data, queryResult.isLoading, queryResult.error, queryResult.isError]);

  return result;
};

// 타입 export
export type { Course, SearchResult };