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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
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

  return {
    searchQuery,
    setSearchQuery,
    recentSearches,
    recommendedCourses,
    isLoading,
    addToRecentSearches,
    removeFromRecentSearches,
    clearRecentSearches,
  };
};