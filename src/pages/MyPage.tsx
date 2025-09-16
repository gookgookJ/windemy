import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Play, Calendar, ArrowRight, TrendingUp, Clock, Award, Heart } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

interface EnrollmentWithCourse {
  id: string;
  progress: number;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    instructor: {
      full_name: string;
    };
  };
}

interface FavoriteCourse {
  id: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    price: number;
    instructor: {
      full_name: string;
    };
  };
}

const MyPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [favorites, setFavorites] = useState<FavoriteCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "내 강의실 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "수강 중인 강의와 학습 진도를 확인하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchEnrollments();
    fetchFavorites();
  }, [user, navigate]);

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          course:courses(
            id,
            title,
            thumbnail_url,
            instructor:profiles(full_name)
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      setEnrollments(data || []);
      
      // 통계 계산
      const totalCourses = data?.length || 0;
      const completedCourses = data?.filter(e => e.progress >= 100).length || 0;
      const inProgressCourses = data?.filter(e => e.progress < 100 && e.progress > 0).length || 0;
      
      setStats({
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalHours: totalCourses * 10 // 예시 계산
      });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

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
        return;
      }

      // Then get course details
      const courseIds = favoriteData.map(f => f.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, price, instructor_id')
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
          course: {
            id: course?.id || '',
            title: course?.title || '',
            thumbnail_url: course?.thumbnail_url || '',
            price: course?.price || 0,
            instructor: {
              full_name: instructor?.full_name || '강사명'
            }
          }
        };
      });

      setFavorites(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/learn/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-8">
              {/* 환영 섹션 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {profile?.full_name ? profile.full_name[0] : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-1">
                        안녕하세요, {profile?.full_name || '학습자'}님
                      </h1>
                      <p className="text-muted-foreground">
                        오늘도 새로운 것을 배워보세요
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      가입일: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 학습 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">전체 강의</p>
                        <p className="text-2xl font-bold">{stats.totalCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">완료</p>
                        <p className="text-2xl font-bold">{stats.completedCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">진행 중</p>
                        <p className="text-2xl font-bold">{stats.inProgressCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">학습시간</p>
                        <p className="text-2xl font-bold">{stats.totalHours}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 수강 중인 강의 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    내 강의 목록
                  </CardTitle>
                  {enrollments.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
                      더 보기
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">첫 번째 강의를 시작해보세요</h3>
                      <p className="text-muted-foreground mb-6">다양한 강의를 통해 새로운 지식을 습득해보세요</p>
                      <Button onClick={() => navigate('/courses')}>
                        강의 둘러보기
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="cursor-pointer" onClick={() => handleCourseClick(enrollment.course.id)}>
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                                  alt={enrollment.course.title}
                                  className="w-24 h-16 object-cover rounded-lg"
                                />
                                <Badge 
                                  variant={enrollment.progress >= 100 ? "default" : "secondary"}
                                  className={`absolute -top-1 -right-1 text-xs ${enrollment.progress >= 100 ? "bg-green-600" : "bg-blue-600"}`}
                                >
                                  {enrollment.progress >= 100 ? "완료" : "진행중"}
                                </Badge>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-base line-clamp-2">
                                    {enrollment.course.title}
                                  </h3>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3">
                                  강사: {enrollment.course.instructor?.full_name}
                                </p>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">학습 진도</span>
                                    <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                                  </div>
                                  <Progress value={enrollment.progress} className="h-2" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 관심 강의 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    관심 강의
                  </CardTitle>
                  {favorites.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/favorite-courses')}>
                      더 보기
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">관심 강의가 없습니다</h3>
                      <p className="text-muted-foreground mb-4">마음에 드는 강의에 하트를 눌러보세요</p>
                      <Button onClick={() => navigate('/courses')}>
                        강의 둘러보기
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.slice(0, 4).map((favorite) => (
                        <Card key={favorite.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/course/${favorite.course.id}`)}>
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={favorite.course.thumbnail_url || '/placeholder.svg'}
                                  alt={favorite.course.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  {favorite.course.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {favorite.course.instructor?.full_name}
                                </p>
                                <p className="text-xs font-semibold text-primary">
                                  {favorite.course.price === 0 ? '무료' : `${favorite.course.price.toLocaleString()}원`}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyPage;