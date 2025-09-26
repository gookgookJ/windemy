import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Play, Calendar, ArrowRight, ChevronLeft, ChevronRight, Star, MessageSquare, MoreHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

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
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLastWatchedSession = async (courseId: string) => {
    try {
      // 1. 해당 강의의 모든 진도를 가져와서 가장 마지막에 시청한 세션을 찾음
      const { data: sessionsProgress } = await supabase
        .from('session_progress')
        .select(`
          session_id,
          watched_duration_seconds,
          completed,
          completed_at,
          created_at,
          session:course_sessions!inner(
            id,
            course_id,
            order_index,
            section:course_sections!inner(order_index)
          )
        `)
        .eq('user_id', user?.id)
        .eq('session.course_id', courseId)
        .gt('watched_duration_seconds', 30); // 30초 이상 시청한 세션만

      if (sessionsProgress && sessionsProgress.length > 0) {
        // 완료된 세션과 미완료 세션을 분리
        const completedSessions = sessionsProgress.filter(sp => sp.completed);
        const incompleteSessions = sessionsProgress.filter(sp => !sp.completed);
        
        // 미완료 세션이 있으면 그 중에서 가장 많이 시청한 것 반환
        if (incompleteSessions.length > 0) {
          incompleteSessions.sort((a, b) => b.watched_duration_seconds - a.watched_duration_seconds);
          return incompleteSessions[0].session_id;
        }
        
        // 모든 세션이 완료된 경우, 가장 최근에 완료된 세션 반환
        if (completedSessions.length > 0) {
          completedSessions.sort((a, b) => 
            new Date(b.completed_at || b.created_at).getTime() - 
            new Date(a.completed_at || a.created_at).getTime()
          );
          return completedSessions[0].session_id;
        }
      }
    } catch (error) {
      console.error('Error getting last watched session:', error);
    }
    return null;
  };

  const handleCourseClick = async (courseId: string) => {
    const lastSessionId = await getLastWatchedSession(courseId);
    if (lastSessionId) {
      navigate(`/learn/${courseId}?session=${lastSessionId}`);
    } else {
      navigate(`/learn/${courseId}`);
    }
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
            {/* Hide sidebar on mobile/tablet since hamburger menu contains the items */}
            <div className="lg:col-span-1 hidden lg:block">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-8">{/* Main content now spans full width on mobile/tablet */}
              {/* 환영 섹션 */}
              <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {profile?.full_name ? profile.full_name[0] : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                        안녕하세요, {profile?.full_name || '학습자'}님 👋
                      </h1>
                      <p className="text-sm md:text-base text-muted-foreground mb-2">
                        오늘도 새로운 것을 배워보세요
                      </p>
                      <div className="flex items-center gap-1 md:gap-2">
                        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">가입일: </span>
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* 수강 중인 강의 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Play className="h-5 w-5 md:h-6 md:w-6" />
                    내 강의실
                  </h2>
                  {enrollments.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
                      <span className="hidden sm:inline">강의 더보기</span>
                      <span className="sm:hidden">더보기</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>

                {enrollments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 md:p-12">
                      <div className="text-center">
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
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* 필터 및 정렬 옵션 */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          학습중
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          완료
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          수강평 작성 가능
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          만료 제한
                        </Badge>
                      </div>
                      <select className="px-3 py-1.5 text-sm border rounded-md bg-background">
                        <option value="latest">최근 학습순</option>
                        <option value="progress">진도순</option>
                        <option value="title">제목순</option>
                      </select>
                    </div>

                    {/* 강의 카드 그리드 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden">
                          <div className="relative" onClick={() => handleCourseClick(enrollment.course.id)}>
                            <div className="aspect-video w-full bg-muted">
                              <img
                                src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                                alt={enrollment.course.title}
                                className="w-full h-full object-cover"
                              />
                              {/* 재생 버튼 오버레이 */}
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="h-6 w-6 md:h-8 md:w-8 text-primary ml-1" fill="currentColor" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <h3 className="font-semibold text-sm md:text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                {enrollment.course.title}
                              </h3>
                              
                              {/* 진도율 표시 */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                  <span className="text-muted-foreground">
                                    {Math.round(enrollment.progress) === 100 ? '완료' : '진행중'}
                                  </span>
                                  <span className="font-medium text-primary">
                                    {Math.round(enrollment.progress)}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                                    style={{ width: `${enrollment.progress}%` }}
                                  />
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                강사: {enrollment.course.instructor?.full_name}
                              </div>

                              {/* 액션 버튼들 */}
                              <div className="flex items-center justify-between pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: 수강평 작성 기능
                                  }}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  수강평 작성
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: 더보기 메뉴
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">이전</span>
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="hidden sm:inline mr-1">다음</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
      </div>
    </div>
  </div>
</main>
</div>
);
};

export default MyPage;