import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
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
      toast({
        title: "로그인 필요",
        description: "관심 강의를 추가하려면 로그인해주세요.",
        variant: "destructive"
      });
      return;
    }

    const isFavorite = favorites.has(courseId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('course_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.delete(courseId);
        setFavorites(newFavorites);

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

        const newFavorites = new Set(favorites);
        newFavorites.add(courseId);
        setFavorites(newFavorites);

        toast({
          title: "관심 강의 추가",
          description: "관심 강의에 추가되었습니다.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "오류",
        description: "관심 강의 설정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const isFavorite = (courseId: string) => favorites.has(courseId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};