import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  toggleFavorite: (courseId: string) => Promise<void>;
  isFavorite: (courseId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_favorites')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = new Set(data?.map(item => item.course_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (courseId: string) => {
    if (!user) {
      // Dispatch event to show auth modal instead of toast
      window.dispatchEvent(new CustomEvent('auth-required'));
      return;
    }

    const isFavorite = favorites.has(courseId);

    // 즉시 UI 업데이트 (낙관적 업데이트)
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.delete(courseId);
    } else {
      newFavorites.add(courseId);
    }
    setFavorites(newFavorites);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('course_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        if (error) throw error;

        toast({
          title: "관심 강의 제거",
          description: "관심 강의에서 제거되었습니다.",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('course_favorites')
          .insert({
            user_id: user.id,
            course_id: courseId
          });

        if (error) throw error;

        toast({
          title: "관심 강의 추가",
          description: "관심 강의에 추가되었습니다.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // 실패시 상태 롤백
      setFavorites(favorites);
      
      toast({
        title: "오류",
        description: "관심 강의 설정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const isFavorite = (courseId: string) => favorites.has(courseId);

  const value: FavoritesContextType = {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};