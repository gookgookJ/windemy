import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

interface FavoriteCourse {
  id: string;
  created_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    price: number;
    rating: number;
    instructor: {
      full_name: string;
    };
  };
}

const FavoriteCourses = () => {
  const [favorites, setFavorites] = useState<FavoriteCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "관심 강의 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "관심 있는 강의들을 모아서 확인하세요");
    
    if (!user) {
      navigate('/');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      // First get favorite course IDs
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('course_favorites')
        .select('id, course_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoriteError) throw favoriteError;

      if (!favoriteData || favoriteData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Then get course details
      const courseIds = favoriteData.map(f => f.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, price, rating, instructor_id')
        .in('id', courseIds);

      if (coursesError) throw coursesError;

      // Get instructor names
      const instructorIds = coursesData?.map(c => c.instructor_id).filter(Boolean) || [];
      const { data: instructorsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      // Combine the data
      const favorites = favoriteData.map(fav => {
        const course = coursesData?.find(c => c.id === fav.course_id);
        const instructor = instructorsData?.find(i => i.id === course?.instructor_id);
        
        return {
          id: fav.id,
          created_at: fav.created_at,
          course: {
            id: course?.id || '',
            title: course?.title || '',
            thumbnail_url: course?.thumbnail_url || '',
            price: course?.price || 0,
            rating: course?.rating || 0,
            instructor: {
              full_name: instructor?.full_name || '강사명'
            }
          }
        };
      });

      setFavorites(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 hidden lg:block">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-8">
              {/* Header */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/my-page')}
                    className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">내 강의실로 돌아가기</span>
                    <span className="sm:hidden">돌아가기</span>
                  </Button>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
                  <Heart className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
                  관심 강의
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">마음에 든 강의들을 모아서 확인하세요.</p>
              </div>

              {/* Favorites List */}
              {favorites.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">관심 강의가 없습니다</h3>
                    <p className="text-muted-foreground mb-4">마음에 드는 강의에 하트를 눌러보세요.</p>
                    <Button onClick={() => navigate('/courses')}>
                      강의 둘러보기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {favorites.map((favorite) => (
                    <Card key={favorite.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCourseClick(favorite.course.id)}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 md:gap-6">
                          <div className="relative flex-shrink-0 w-full sm:w-48 md:w-56">
                            <div className="aspect-video w-full">
                              <img
                                src={favorite.course.thumbnail_url || '/placeholder.svg'}
                                alt={favorite.course.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <h3 className="font-bold text-base sm:text-lg line-clamp-2 flex-1">
                                {favorite.course.title}
                              </h3>
                              <Heart className="h-5 w-5 text-red-500 fill-red-500 flex-shrink-0" />
                            </div>
                            
                            <p className="text-sm md:text-base text-muted-foreground mb-3">
                              강사: {favorite.course.instructor?.full_name}
                            </p>
                            
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3 md:gap-4">
                                <div className="text-lg sm:text-xl font-bold text-primary">
                                  {favorite.course.price === 0 ? '무료' : `${favorite.course.price.toLocaleString()}원`}
                                </div>
                                {favorite.course.rating > 0 && (
                                  <div className="text-xs sm:text-sm text-muted-foreground">
                                    ⭐ {favorite.course.rating.toFixed(1)}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                관심 등록: {new Date(favorite.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FavoriteCourses;