import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
// Avatar 및 불필요한 아이콘 제거됨
import { BookOpen, Play, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

// ★ 인터페이스 수정 및 추가
interface NextSessionInfo {
    id: string;
    title: string;
}

interface EnrollmentWithCourse {
  id: string;
  progress: number;
  enrolled_at: string;
  updated_at: string; // 최근 활동 시간
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration_hours: number;
    // 강사 정보는 목록에서 사용하지 않으므로 제거
  };
  nextSessionInfo?: NextSessionInfo; // ★ 다음 세션 정보
}

const MyPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // ★ 통계 State 간소화 (총 학습시간 제거)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const itemsPerPage = 5;

  useEffect(() => {
    document.title = "내 강의실 | 윈들리아카데미";
    // ... (기존 useEffect 유지)
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
      
      // 실시간 업데이트 구독 설정
      const channel = supabase
        .channel('enrollment-progress-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'enrollments', filter: `user_id=eq.${user.id}` },
          () => fetchEnrollments()
        )
        // session_progress 감지는 제거하여 성능 최적화
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentPage, user]);

  // ★ 데이터 조회 로직 최적화 및 기능 강화
  const fetchEnrollments = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. 전체 등록 정보 조회 (통계 및 페이징용)
      const { data: allEnrollmentsData, count } = await supabase
            .from('enrollments')
            .select('progress, completed_at', { count: 'exact' })
            .eq('user_id', user.id);

      const totalCount = count || 0;
      setTotalPages(Math.ceil(totalCount / itemsPerPage));

      // 통계 계산 (최적화됨: 총 학습시간 계산 제거)
      const completedCourses = allEnrollmentsData?.filter(e => e.completed_at || e.progress >= 100).length || 0;
      const inProgressCourses = allEnrollmentsData?.filter(e => 
        !e.completed_at && e.progress > 0 && e.progress < 100
      ).length || 0;
      setStats({ totalCourses: totalCount, completedCourses, inProgressCourses });

      // 2. 페이징된 데이터 조회 (최근 활동 순 정렬)
      const { data: pagedData, error } = await supabase
        .from('enrollments')
        .select(`
          id, progress, enrolled_at, completed_at, updated_at,
          course:courses(id, title, thumbnail_url, duration_hours)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }) // ★ 최근 활동 순 정렬
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      const enrollmentsData = pagedData || [];
      const courseIds = enrollmentsData.map(e => e.course.id);

      // 3. 다음 세션 정보 조회 (N+1 쿼리 방지를 위한 최적화된 배치 조회)
      if (courseIds.length > 0) {
        // 3a. 해당 강의들의 모든 세션 메타데이터 조회
        const { data: sessionsMetadata } = await supabase
            .from('course_sessions')
            .select('id, title, order_index, course_id')
            .in('course_id', courseIds)
            .order('order_index', { ascending: true });

        // 3b. 사용자가 완료한 세션 ID 목록 조회
        const { data: userProgress } = await supabase
            .from('session_progress')
            .select('session_id')
            .eq('user_id', user.id)
            .eq('completed', true);

        const completedSessionIds = new Set(userProgress?.map(p => p.session_id) || []);

        // 3c. 로컬에서 다음 세션 결정 및 병합
        const enrollmentsWithNextStep = enrollmentsData.map(enrollment => {
            const courseSessions = sessionsMetadata?.filter(s => s.course_id === enrollment.course.id) || [];
            
            // 완료하지 않은 첫 번째 세션 찾기
            let nextSession = courseSessions.find(s => !completedSessionIds.has(s.id));

            // 모두 완료했거나 세션이 없으면 첫 번째 세션으로 설정 (복습용)
            if (!nextSession && courseSessions.length > 0) {
                nextSession = courseSessions[0];
            }

            return {
                ...enrollment,
                nextSessionInfo: nextSession ? { id: nextSession.id, title: nextSession.title } : undefined
            } as EnrollmentWithCourse;
        });

        setEnrollments(enrollmentsWithNextStep);
      } else {
        setEnrollments([]);
      }

    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ★ getLastWatchedSession 함수 제거됨 (fetchEnrollments에서 처리)

  // ★ 핸들러 함수 단순화
  const handleCourseClick = (courseId: string, sessionId?: string) => {
    const baseUrl = `/learn/${courseId}?from=mypage`;
    if (sessionId) {
      navigate(`${baseUrl}&session=${sessionId}`);
    } else {
      navigate(baseUrl);
    }
  };

  // ★ 헬퍼 함수: 상태 및 CTA 텍스트 결정
  const getStatusAndCta = (progress: number, completed_at: string | null) => {
    if (completed_at || progress >= 100) return { status: 'completed', cta: '복습하기' };
    if (progress > 0) return { status: 'in-progress', cta: '이어 학습하기' };
    return { status: 'not-started', cta: '학습 시작하기' };
  };

  // ★ 헬퍼 컴포넌트: 상태 배지
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">완료</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300" variant="outline">학습 중</Badge>;
      default:
        return <Badge variant="secondary">미시작</Badge>;
    }
  };

  if (loading) {
    // ... (로딩 화면 유지)
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
              {/* ★ A. 환영 섹션 수정: 디자인 간소화 및 학습 현황 통합 */}
              <div className="p-4 md:p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                    안녕하세요, {profile?.full_name || '학습자'}님 👋
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    현재 <span className="font-semibold text-primary">{stats.inProgressCourses}개</span>의 강의를 진행 중이며, 총 <span className="font-semibold">{stats.completedCourses}개</span>를 완료했습니다.
                </p>
              </div>

              {/* ★ B. 기존 학습 통계 섹션 (4개 카드) 제거됨 */}

              {/* 수강 중인 강의 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    내 강의 목록
                  </CardTitle>
                  {/* '더보기' 버튼 제거 (페이지네이션이 역할 대체) */}
                </CardHeader>
                <CardContent className="p-6">
                  {enrollments.length === 0 ? (
                    // ... (강의 없음 화면 유지)
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {/* ★ C. 강의 카드 디자인 및 정보 구조 변경 */}
                        {enrollments.map((enrollment) => {
                          const { status, cta } = getStatusAndCta(enrollment.progress, enrollment.completed_at);
                          const nextSession = enrollment.nextSessionInfo;

                          return (
                        <Card key={enrollment.id} className="hover:shadow-md transition-shadow border-0 shadow-sm group">
                          <CardContent className="p-3 md:p-4">
                            <div className="flex gap-4 md:gap-6">
                              
                              {/* 1. 썸네일 (클릭 가능 영역) */}
                              <div className="relative flex-shrink-0 w-28 md:w-40 aspect-video cursor-pointer" onClick={() => handleCourseClick(enrollment.course.id, nextSession?.id)}>
                                <img
                                  src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                                  alt={enrollment.course.title}
                                  // object-cover 및 aspect-video 적용
                                  className="w-full h-full object-cover rounded-lg bg-muted"
                                />
                              </div>
                              
                              {/* 2. 정보 및 액션 */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                {/* 상단: 상태 및 제목 (클릭 가능 영역) */}
                                <div className="cursor-pointer" onClick={() => handleCourseClick(enrollment.course.id, nextSession?.id)}>
                                    <div className="flex items-center justify-between mb-1 gap-2">
                                        <StatusBadge status={status} />
                                        {/* 호버 시 나타나는 화살표 */}
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  <h3 className="font-semibold text-sm md:text-lg line-clamp-2 leading-tight mb-3">
                                    {enrollment.course.title}
                                  </h3>
                                </div>

                                {/* 하단: 진도율 및 다음 단계 */}
                                <div className="mt-auto pt-2">
                                  {/* 진도율 표시 간소화 */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <Progress value={enrollment.progress} className="h-1.5 md:h-2 flex-1" />
                                    <span className="text-xs md:text-sm font-medium text-foreground w-10 text-right">
                                      {Math.round(enrollment.progress)}%
                                    </span>
                                  </div>

                                    {/* CTA 버튼 및 다음 강의 제목 */}
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            size="sm" 
                                            className="flex-shrink-0"
                                            variant={status === 'completed' ? "outline" : "default"}
                                            onClick={() => handleCourseClick(enrollment.course.id, nextSession?.id)}
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            {cta}
                                        </Button>
                                        {nextSession && (
                                            <p className="text-xs md:text-sm text-muted-foreground truncate" title={nextSession.title}>
                                                다음: {nextSession.title}
                                            </p>
                                        )}
                                    </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        )})}
                      </div>
                    
                    {/* Pagination Controls (유지) */}
                    {totalPages > 1 && (
                        // ... (페이지네이션 UI 유지)
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