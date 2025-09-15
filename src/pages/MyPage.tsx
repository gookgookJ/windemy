import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Clock, Award, TrendingUp, Play, Calendar, Users } from 'lucide-react';
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
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-8">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {profile?.full_name ? profile.full_name[0] : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">
                        안녕하세요, {profile?.full_name || '학습자'}님! 👋
                      </h1>
                      <p className="text-lg text-muted-foreground mb-4">
                        오늘도 새로운 것을 배워보세요.
                      </p>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          가입일: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 학습 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">전체 강의</p>
                        <p className="text-2xl font-bold">{stats.totalCourses}개</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">완료한 강의</p>
                        <p className="text-2xl font-bold">{stats.completedCourses}개</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">진행 중</p>
                        <p className="text-2xl font-bold">{stats.inProgressCourses}개</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">총 학습 시간</p>
                        <p className="text-2xl font-bold">{stats.totalHours}시간</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 수강 중인 강의 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    내 강의 목록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">아직 수강 중인 강의가 없습니다</h3>
                      <p className="text-muted-foreground mb-6">새로운 강의를 찾아보세요!</p>
                      <Button onClick={() => navigate('/courses')} size="lg">
                        강의 둘러보기
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => handleCourseClick(enrollment.course.id)}>
                          <div className="relative">
                            <img
                              src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                              alt={enrollment.course.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-4 right-4">
                              <Badge className={enrollment.progress >= 100 ? "bg-green-600" : "bg-blue-600"}>
                                {enrollment.progress >= 100 ? "완료" : "진행중"}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {enrollment.course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              강사: {enrollment.course.instructor?.full_name}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>진도율</span>
                                <span className="font-semibold">{enrollment.progress}%</span>
                              </div>
                              <Progress value={enrollment.progress} className="h-2" />
                            </div>
                            
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                              <span className="text-sm text-muted-foreground">
                                수강 시작: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                              </span>
                              <Button size="sm" className="ml-auto">
                                <Play className="h-3 w-3 mr-1" />
                                {enrollment.progress >= 100 ? "복습하기" : "계속 학습"}
                              </Button>
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