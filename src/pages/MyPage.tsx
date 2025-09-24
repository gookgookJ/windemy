import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Play, Calendar, ArrowRight, TrendingUp, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import MobileUserMenu from '@/components/MobileUserMenu';
import ResponsiveCourseCard from '@/components/ResponsiveCourseCard';

interface EnrollmentWithCourse {
  id: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration_hours: number;
    instructor: {
      full_name: string;
    };
  };
}

const MyPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const itemsPerPage = 5;

  useEffect(() => {
    document.title = "내 강의실 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "수강 중인 강의와 학습 진도를 확인하세요");
    
    if (!user) {
      navigate('/');
      return;
    }
    fetchEnrollments();
  }, [user, navigate]);

  // Refetch when page changes and set up real-time updates
  useEffect(() => {
    if (user) {
      fetchEnrollments();
      
      // Set up real-time subscription for enrollment progress updates
      const channel = supabase
        .channel('enrollment-progress-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'enrollments',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchEnrollments(); // Refresh data when progress updates
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_progress',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchEnrollments(); // Refresh when session progress updates
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentPage, user]);

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      // First get total count for pagination
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalCount = count || 0;
      setTotalPages(Math.ceil(totalCount / itemsPerPage));

      // Then get paginated data
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          completed_at,
          course:courses(
            id,
            title,
            thumbnail_url,
            duration_hours,
            instructor:profiles(full_name)
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      setEnrollments(data || []);
      
      // Calculate comprehensive stats
      const { data: allEnrollments } = await supabase
        .from('enrollments')
        .select(`
          progress,
          completed_at,
          course:courses(duration_hours)
        `)
        .eq('user_id', user.id);

      // Get actual watched time from session progress
      const { data: sessionProgress } = await supabase
        .from('session_progress')
        .select('watched_duration_seconds')
        .eq('user_id', user.id);
      
      const totalCourses = allEnrollments?.length || 0;
      const completedCourses = allEnrollments?.filter(e => e.completed_at || e.progress >= 100).length || 0;
      
      // 진행 중: 실제로 학습이 시작된 강의 (progress > 5% 이상)
      const inProgressCourses = allEnrollments?.filter(e => 
        !e.completed_at && 
        e.progress >= 5 && 
        e.progress < 100
      ).length || 0;
      
      // 실제 학습시간 계산 (초 단위를 시간으로 변환)
      const totalWatchedSeconds = sessionProgress?.reduce((sum, sp) => 
        sum + (sp.watched_duration_seconds || 0), 0
      ) || 0;
      const totalHours = Math.round(totalWatchedSeconds / 3600 * 10) / 10; // 소수점 1자리
      
      setStats({
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalHours
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
      <div className="bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <MobileUserMenu />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* 사이드바 - 데스크톱에서만 표시 */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <UserSidebar />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="flex-1 space-y-6 lg:space-y-8 lg:pl-6">
              {/* 환영 섹션 - 반응형 개선 */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto sm:mx-0">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-lg">
                        {profile?.full_name ? profile.full_name[0] : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-xl sm:text-2xl font-bold mb-1">
                        안녕하세요, {profile?.full_name || '학습자'}님
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        오늘도 새로운 것을 배워보세요
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3" />
                      <span className="hidden sm:inline">가입일: </span>
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 학습 통계 - 반응형 그리드 개선 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">전체 강의</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.totalCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">완료</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.completedCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">진행 중</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.inProgressCourses}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">학습시간</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.totalHours}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 수강 중인 강의 */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    내 강의 목록
                  </CardTitle>
                  {enrollments.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/courses')} className="text-xs sm:text-sm">
                      더 보기
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">첫 번째 강의를 시작해보세요</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">다양한 강의를 통해 새로운 지식을 습득해보세요</p>
                      <Button onClick={() => navigate('/courses')} className="text-sm sm:text-base">
                        강의 둘러보기
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {enrollments.map((enrollment) => (
                          <ResponsiveCourseCard 
                            key={enrollment.id}
                            enrollment={enrollment}
                            onClick={() => handleCourseClick(enrollment.course.id)}
                          />
                        ))}
                      </div>
                      
                      {/* Pagination Controls - 반응형 개선 */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="text-xs sm:text-sm"
                            >
                              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">이전</span>
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNumber;
                                if (totalPages <= 5) {
                                  pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNumber = totalPages - 4 + i;
                                } else {
                                  pageNumber = currentPage - 2 + i;
                                }
                                
                                return (
                                  <Button
                                    key={pageNumber}
                                    variant={pageNumber === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className="w-8 h-8 text-xs sm:text-sm"
                                  >
                                    {pageNumber}
                                  </Button>
                                );
                              })}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="text-xs sm:text-sm"
                            >
                              <span className="hidden sm:inline">다음</span>
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          
                          {/* 페이지 정보 표시 */}
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {currentPage} / {totalPages} 페이지
                          </div>
                        </div>
                      )}
                    </>
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