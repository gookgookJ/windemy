import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  category_id?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  price: number;
  level?: string;
  is_published: boolean;
  instructor_name?: string;
  relevance?: number;
}

interface SearchResult extends Course {
  relevance: number;
}

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [liveSearchResults, setLiveSearchResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Live search when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      performLiveSearch(searchQuery.trim());
    } else {
      setLiveSearchResults([]);
    }
  }, [searchQuery]);

  const performLiveSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id, title, category_id, thumbnail_url, thumbnail_path, price, level, is_published,
          profiles:instructor_id(full_name),
          categories:category_id(name)
        `)
        .eq('is_published', true);

      if (error) throw error;

      // Filter and rank results
      const results = (data || [])
        .map((course: any) => {
          const titleMatch = course.title.toLowerCase().includes(query.toLowerCase());
          const instructorMatch = course.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) || false;
          
          let relevance = 0;
          if (titleMatch) relevance += 15;
          if (instructorMatch) relevance += 12;
          
          // Exact matches get higher scores
          if (course.title.toLowerCase() === query.toLowerCase()) relevance += 20;
          if (course.profiles?.full_name?.toLowerCase() === query.toLowerCase()) relevance += 18;
          
          return {
            ...course,
            instructor_name: course.profiles?.full_name || '운영진',
            relevance
          };
        })
        .filter(course => course.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5); // 최대 5개만 표시

      setLiveSearchResults(results);
    } catch (error) {
      console.error('Error performing live search:', error);
      setLiveSearchResults([]);
    } finally {
      setIsLoading(false);
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

  return {
    searchQuery,
    setSearchQuery,
    recentSearches,
    liveSearchResults,
    isLoading,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
  };
};