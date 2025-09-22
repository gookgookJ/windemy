import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Categories fetch failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Fetch categories error:', error);
    throw error;
  }
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10분 (카테고리는 자주 변경되지 않음)
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: '카테고리 데이터를 불러오는데 실패했습니다.'
    }
  });
};

// 타입 export
export type { Category };