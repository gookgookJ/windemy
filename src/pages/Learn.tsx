import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, Clock, ArrowLeft, ArrowRight, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import '@/types/vimeo.d.ts';
import { VideoProgressTracker } from '@/utils/VideoProgressTracker';

interface CourseSession {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  attachment_url?: string;
  attachment_name?: string;
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
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const [progressTracker, setProgressTracker] = useState<VideoProgressTracker | null>(null);
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

  // Vimeo Player API 초기화
  useEffect(() => {
    if (currentSession && currentSession.video_url?.includes('vimeo.com')) {
      loadVimeoAPI();
      
      // VideoProgressTracker 초기화
      if (user) {
        const tracker = new VideoProgressTracker(
          currentSession.id,
          user.id,
          currentSession.duration_minutes * 60
        );
        setProgressTracker(tracker);
      }
    }
  }, [currentSession, user]);

  const loadVimeoAPI = () => {
    if (window.Vimeo) {
      initializeVimeoPlayer();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.onload = () => initializeVimeoPlayer();
    document.head.appendChild(script);
  };

  const initializeVimeoPlayer = () => {
    if (!currentSession || !window.Vimeo || !progressTracker) return;

    const iframe = document.getElementById(`vimeo-player-${currentSession.id}`);
    if (!iframe) return;

    const player = new window.Vimeo.Player(iframe);
    
    // 재생/일시정지 이벤트
    player.on('play', (data: any) => {
      player.getCurrentTime().then(time => progressTracker.onPlay(time));
    });

    player.on('pause', (data: any) => {
      player.getCurrentTime().then(time => progressTracker.onPause(time));
    });

    // 시간 업데이트 이벤트
    player.on('timeupdate', (data: any) => {
      progressTracker.onTimeUpdate(data.seconds);
      
      // UI 업데이트
      setVideoProgress(prev => ({
        ...prev,
        [currentSession.id]: progressTracker.getWatchedPercentage()
      }));
    });

    // 점프 이벤트 감지
    let lastTime = 0;
    player.on('seeked', (data: any) => {
      progressTracker.onSeeked(lastTime, data.seconds);
      
      // 의심스러운 점프 감지시 경고
      if (data.seconds - lastTime > 30) {
        toast({
          title: "진도 조작 감지",
          description: "영상을 건너뛰면 학습 시간에 반영되지 않습니다.",
          variant: "destructive"
        });
      }
    });

    // 현재 시간 추적
    player.on('timeupdate', (data: any) => {
      lastTime = data.seconds;
    });

    // 영상 완료
    player.on('ended', async () => {
      await progressTracker.saveProgress();
      
      if (progressTracker.isValidForCompletion()) {
        markSessionComplete(currentSession.id);
      } else {
        toast({
          title: "학습 시간 부족",
          description: "영상을 충분히 시청하지 않았습니다. 다시 시청해주세요.",
          variant: "destructive"
        });
      }
    });
  };

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

  const handleVideoProgress = async (currentTime: number, duration: number) => {
    if (!currentSession || !user || duration === 0) return;

    const progressPercent = Math.min((currentTime / duration) * 100, 100);
    const watchedSeconds = Math.floor(currentTime);

    // 로컬 상태 업데이트
    setVideoProgress(prev => ({
      ...prev,
      [currentSession.id]: progressPercent
    }));

    // 80% 이상 시청하면 자동 완료 처리
    if (progressPercent >= 80) {
      const sessionProgress = getSessionProgress(currentSession.id);
      if (!sessionProgress?.completed) {
        markSessionComplete(currentSession.id);
      }
    }

    // 진도 저장 (5초마다만 업데이트)
    if (watchedSeconds % 5 === 0) {
      try {
        await supabase
          .from('session_progress')
          .upsert({
            user_id: user.id,
            session_id: currentSession.id,
            watched_duration_seconds: watchedSeconds,
            completed: progressPercent >= 80
          });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const markSessionComplete = async (sessionId: string) => {
    if (!progressTracker || !user) return;

    try {
      // 1. 백엔드 검증 수행
      const { data: validation } = await supabase.functions.invoke('validate-progress', {
        body: { sessionId, userId: user.id }
      });

      if (!validation.isValid) {
        toast({
          title: "학습 검증 실패",
          description: `시청률: ${validation.watchedPercentage}%, 체크포인트: ${validation.checkpointScore}%`,
          variant: "destructive"
        });
        return;
      }

      // 2. 세션 완료 처리
      const { error } = await supabase
        .from('session_progress')
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          completed: true,
          watched_duration_seconds: validation.totalWatchedTime,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // 3. 진행 상황 업데이트
      setProgress(prev => {
        const existing = prev.find(p => p.session_id === sessionId);
        if (existing) {
          return prev.map(p => 
            p.session_id === sessionId 
              ? { ...p, completed: true }
              : p
          );
        } else {
          return [...prev, { session_id: sessionId, completed: true, watched_duration_seconds: validation.totalWatchedTime }];
        }
      });

      // 4. 전체 진행률 계산 및 업데이트
      const updatedProgress = progress.map(p => 
        p.session_id === sessionId ? { ...p, completed: true } : p
      );
      if (!progress.find(p => p.session_id === sessionId)) {
        updatedProgress.push({ session_id: sessionId, completed: true, watched_duration_seconds: validation.totalWatchedTime });
      }
      
      const completedSessions = updatedProgress.filter(p => p.completed).length;
      const totalSessions = sessions.length;
      const newProgress = Math.min((completedSessions / totalSessions) * 100, 100);

      await supabase
        .from('enrollments')
        .update({ 
          progress: newProgress,
          completed_at: newProgress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);

      toast({
        title: "세션 완료! 🎉",
        description: `진정한 학습률: ${validation.watchedPercentage}%`,
      });

      // 5. 자동으로 다음 세션으로 이동
      if (newProgress < 100) {
        setTimeout(() => {
          goToNextSession();
        }, 1500);
      }
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

  const getVideoProgress = (sessionId: string) => {
    return videoProgress[sessionId] || 0;
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
                          ) : isCurrent && getVideoProgress(session.id) > 0 ? (
                            <div className="relative w-4 h-4">
                              <div className="absolute inset-0 bg-muted rounded-full" />
                              <div 
                                className="absolute inset-0 bg-primary rounded-full origin-center"
                                style={{
                                  clipPath: `inset(0 ${100 - getVideoProgress(session.id)}% 0 0)`
                                }}
                              />
                            </div>
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
                          {isCurrent && getVideoProgress(session.id) > 0 && (
                            <span className="ml-2 text-primary">
                              • {Math.round(getVideoProgress(session.id))}% 시청
                            </span>
                          )}
                        </div>
                        {isCurrent && getVideoProgress(session.id) > 0 && (
                          <div className="mt-2">
                            <Progress value={getVideoProgress(session.id)} className="h-1" />
                          </div>
                        )}
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
                        <div className="w-full h-full relative">
                          <iframe
                            id={`vimeo-player-${currentSession.id}`}
                            src={`https://player.vimeo.com/video/${currentSession.video_url.split('/').pop()}?title=0&byline=0&portrait=0&autoplay=0`}
                            width="100%"
                            height="100%"
                            className="rounded-lg"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video
                          controls
                          className="w-full h-full rounded-lg"
                          src={currentSession.video_url}
                          onTimeUpdate={(e) => handleVideoProgress(e.currentTarget.currentTime, e.currentTarget.duration)}
                        />
                      )
                    ) : (
                      <div className="text-white text-center">
                        <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>비디오를 준비 중입니다</p>
                      </div>
                    )}
                  </div>

                  {/* 세션 첨부파일 영역 */}
                  {currentSession.attachment_url && currentSession.attachment_name && (
                    <Card className="mb-6">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <File className="h-5 w-5" />
                          세션 자료
                        </h3>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="h-6 w-6 text-blue-600" />
                            <div>
                              <p className="font-medium">{currentSession.attachment_name}</p>
                              <p className="text-sm text-muted-foreground">첨부파일</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = currentSession.attachment_url;
                              link.download = currentSession.attachment_name;
                              link.click();
                            }}
                          >
                            다운로드
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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