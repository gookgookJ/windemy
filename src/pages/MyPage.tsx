import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Play, Calendar, ArrowRight, TrendingUp, Clock, Award, Star } from 'lucide-react';
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

const MyPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-8">
              {/* 환영 섹션 - 더 깔끔하고 모던하게 */}
              <div className="relative overflow-hidden">
                <Card className="border-0 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-xl">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                            {profile?.full_name ? profile.full_name[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                          반가워요, {profile?.full_name || '학습자'}님! 
                        </h1>
                        <p className="text-muted-foreground mb-4">
                          새로운 학습의 여정을 계속해보세요 ✨
                        </p>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-white/80 backdrop-blur text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 학습 통계 - 더 세련된 디자인 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">전체 강의</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalCourses}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">완료</p>
                        <p className="text-2xl font-bold mt-1">{stats.completedCourses}</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">진행 중</p>
                        <p className="text-2xl font-bold mt-1">{stats.inProgressCourses}</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">학습시간</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalHours}h</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 수강 중인 강의 - 더 깔끔한 카드 디자인 */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      내 강의 목록
                    </CardTitle>
                    {enrollments.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                        더 많은 강의 탐색
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">첫 번째 강의를 시작해보세요</h3>
                      <p className="text-muted-foreground mb-6">다양한 강의를 통해 새로운 지식을 습득해보세요.</p>
                      <Button onClick={() => navigate('/courses')} size="lg" className="rounded-full">
                        강의 둘러보기
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="group hover:shadow-md transition-all duration-300 cursor-pointer border border-border/50 hover:border-primary/30" onClick={() => handleCourseClick(enrollment.course.id)}>
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                                  alt={enrollment.course.title}
                                  className="w-24 h-16 object-cover rounded-lg"
                                />
                                <div className="absolute -top-1 -right-1">
                                  <Badge 
                                    variant={enrollment.progress >= 100 ? "default" : "secondary"}
                                    className={`text-xs ${enrollment.progress >= 100 ? "bg-green-600" : "bg-blue-600"}`}
                                  >
                                    {enrollment.progress >= 100 ? "완료" : "진행중"}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                    {enrollment.course.title}
                                  </h3>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                                </div>
                                
                                <p className="text-xs text-muted-foreground mb-3">
                                  강사: {enrollment.course.instructor?.full_name}
                                </p>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">학습 진도</span>
                                    <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                                  </div>
                                  <Progress value={enrollment.progress} className="h-1.5" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {enrollments.length > 3 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" onClick={() => navigate('/my-courses')}>
                            전체 강의 보기
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
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