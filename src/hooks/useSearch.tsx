import { useState, useEffect, useMemo } from 'react';
import { useSearchCourses } from '@/hooks/queries/useSearchCourses';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // React Query를 사용한 검색
  const { data: liveSearchResults = [], isLoading } = useSearchCourses(searchQuery);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // 메모이제이션된 검색 결과
  const searchResults = useMemo(() => {
    return liveSearchResults || [];
  }, [liveSearchResults]);

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

  return {
    searchQuery,
    setSearchQuery,
    recentSearches,
    liveSearchResults: searchResults,
    isLoading,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
  };
};