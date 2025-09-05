import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseSession {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
}

interface SessionProgress {
  session_id: string;
  completed: boolean;
  watched_duration_seconds: number;
}

const Learn = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CourseSession | null>(null);
  const [progress, setProgress] = useState<SessionProgress[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      // 강의 정보
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // 등록 확인
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!enrollmentData) {
        navigate(`/course/${courseId}`);
        toast({
          title: "접근 권한 없음",
          description: "이 강의를 수강하려면 먼저 등록해주세요.",
          variant: "destructive"
        });
        return;
      }
      setEnrollment(enrollmentData);

      // 세션 목록
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
      
      if (sessionsData && sessionsData.length > 0) {
        setCurrentSession(sessionsData[0]);
      }

      // 진행 상황
      const { data: progressData } = await supabase
        .from('session_progress')
        .select('*')
        .eq('user_id', user?.id)
        .in('session_id', sessionsData?.map(s => s.id) || []);

      setProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "오류",
        description: "강의 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markSessionComplete = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('session_progress')
        .upsert({
          user_id: user?.id,
          session_id: sessionId,
          completed: true,
          watched_duration_seconds: 0,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // 진행 상황 업데이트
      setProgress(prev => {
        const existing = prev.find(p => p.session_id === sessionId);
        if (existing) {
          return prev.map(p => 
            p.session_id === sessionId 
              ? { ...p, completed: true }
              : p
          );
        } else {
          return [...prev, { session_id: sessionId, completed: true, watched_duration_seconds: 0 }];
        }
      });

      // 전체 진행률 계산 및 업데이트
      const completedSessions = progress.filter(p => p.completed).length + 1;
      const totalSessions = sessions.length;
      const newProgress = (completedSessions / totalSessions) * 100;

      await supabase
        .from('enrollments')
        .update({ 
          progress: newProgress,
          completed_at: newProgress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);

      toast({
        title: "완료",
        description: "세션이 완료되었습니다!"
      });
    } catch (error) {
      console.error('Error marking session complete:', error);
      toast({
        title: "오류",
        description: "진행 상황 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getSessionProgress = (sessionId: string) => {
    return progress.find(p => p.session_id === sessionId);
  };

  const goToNextSession = () => {
    const currentIndex = sessions.findIndex(s => s.id === currentSession?.id);
    if (currentIndex < sessions.length - 1) {
      setCurrentSession(sessions[currentIndex + 1]);
    }
  };

  const goToPreviousSession = () => {
    const currentIndex = sessions.findIndex(s => s.id === currentSession?.id);
    if (currentIndex > 0) {
      setCurrentSession(sessions[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  const completedSessions = progress.filter(p => p.completed).length;
  const totalSessions = sessions.length;
  const courseProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/course/${courseId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                강의로 돌아가기
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{course?.title}</h1>
                <p className="text-sm text-muted-foreground">
                  강사: {course?.instructor?.full_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                진행률: {Math.round(courseProgress)}% ({completedSessions}/{totalSessions})
              </div>
              <Progress value={courseProgress} className="w-32 h-2 mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 세션 목록 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">강의 목차</h3>
                <div className="space-y-2">
                  {sessions.map((session) => {
                    const sessionProgress = getSessionProgress(session.id);
                    const isCompleted = sessionProgress?.completed || false;
                    const isCurrent = currentSession?.id === session.id;
                    
                    return (
                      <div
                        key={session.id}
                        onClick={() => setCurrentSession(session)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          isCurrent ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium flex-1">
                            {session.order_index}. {session.title}
                          </span>
                          {session.is_free && (
                            <Badge variant="secondary" className="text-xs">무료</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{session.duration_minutes}분</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 비디오 플레이어 */}
          <div className="lg:col-span-3">
            {currentSession ? (
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">{currentSession.title}</h2>
                    <p className="text-muted-foreground">{currentSession.description}</p>
                  </div>
                  
                  {/* 비디오 플레이어 영역 */}
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-6">
                    {currentSession.video_url ? (
                      currentSession.video_url.includes('vimeo.com') ? (
                        <iframe
                          src={`https://player.vimeo.com/video/${currentSession.video_url.split('/').pop()}?title=0&byline=0&portrait=0`}
                          width="100%"
                          height="100%"
                          className="rounded-lg"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          controls
                          className="w-full h-full rounded-lg"
                          src={currentSession.video_url}
                        />
                      )
                    ) : (
                      <div className="text-white text-center">
                        <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>비디오를 준비 중입니다</p>
                      </div>
                    )}
                  </div>

                  {/* 컨트롤 버튼 */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={goToPreviousSession}
                      disabled={sessions.findIndex(s => s.id === currentSession.id) === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      이전 세션
                    </Button>

                    <Button
                      onClick={() => markSessionComplete(currentSession.id)}
                      disabled={getSessionProgress(currentSession.id)?.completed || false}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {getSessionProgress(currentSession.id)?.completed ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          완료됨
                        </>
                      ) : (
                        '완료 표시'
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={goToNextSession}
                      disabled={sessions.findIndex(s => s.id === currentSession.id) === sessions.length - 1}
                    >
                      다음 세션
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p>세션을 선택해주세요</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;