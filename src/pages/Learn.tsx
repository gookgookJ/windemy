import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import Header from '@/components/Header';

interface CourseSession {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  section_id?: string;
}

interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  attachment_url?: string;
  attachment_name?: string;
  sessions: CourseSession[];
}

interface SessionProgress {
  session_id: string;
  completed: boolean;
  watched_duration_seconds: number;
}

const Learn = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const fromPage = searchParams.get('from');
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [currentSession, setCurrentSession] = useState<CourseSession | null>(null);
  const [progress, setProgress] = useState<SessionProgress[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});

  // 인스턴스 관리를 위해 useRef 사용
  const playerRef = useRef<any>(null);
  const trackerRef = useRef<VideoProgressTracker | null>(null);
  const lastSavedTimeRef = useRef(Date.now());

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialSessionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session') : null;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  // 1. Vimeo API 스크립트 로드 (전역에서 한 번만 실행)
  useEffect(() => {
    if (!window.Vimeo) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onerror = () => console.error('Failed to load Vimeo API');
      document.head.appendChild(script);
    }
  }, []);

  // 2. 세션 변경 시 초기화/정리 (핵심 로직 통합)
  useEffect(() => {
    if (!currentSession || !user || !currentSession.video_url?.includes('vimeo.com')) {
      return;
    }

    console.log('Initializing session:', currentSession.id);
    let initializationTimer: NodeJS.Timeout;

    const initializeSession = async () => {
      // A. 트래커 생성 및 데이터 로드
      const tracker = new VideoProgressTracker(
        currentSession.id,
        user.id,
        currentSession.duration_minutes * 60
      );
      await tracker.initialize(); // 기존 데이터 로드 대기
      trackerRef.current = tracker;
      
      // 초기 진도율 UI 반영
      setVideoProgress(prev => ({
        ...prev,
        [currentSession.id]: tracker.getWatchedPercentage()
      }));

      // B. 플레이어 초기화
      const initializePlayer = () => {
        // API 및 Iframe 준비 상태 확인 (렌더링 지연 대비)
        if (!window.Vimeo || !document.getElementById(`vimeo-player-${currentSession.id}`)) {
          console.log('Vimeo API or Iframe not ready, waiting...');
          initializationTimer = setTimeout(initializePlayer, 200);
          return;
        }

        const iframe = document.getElementById(`vimeo-player-${currentSession.id}`);
        const player = new window.Vimeo.Player(iframe);
        playerRef.current = player;
        setupPlayerEventListeners(player, tracker);
      };

      initializePlayer();
    };

    initializeSession();

    // ★ Cleanup 함수: 세션 변경(useEffect 재실행) 또는 언마운트 전에 실행
    return () => {
      console.log('Cleaning up session...');
      clearTimeout(initializationTimer);
      
      if (trackerRef.current) {
        // 마지막 진행 상황 저장
        trackerRef.current.saveProgress().catch(e => console.error('Final save error:', e));
        trackerRef.current = null;
      }
      if (playerRef.current) {
        // 플레이어 리소스 해제 (destroy 사용 권장)
        try {
          playerRef.current.destroy().catch(e => console.error("Error destroying player:", e));
        } catch (e) {
          console.error("Error during player cleanup:", e);
        }
        playerRef.current = null;
      }
    };
  }, [currentSession?.id, user?.id]); // 의존성 명확화

  // 이벤트 리스너 설정 함수 분리 (기존 initializeVimeoPlayer 내용 이동)
  const setupPlayerEventListeners = (player: any, tracker: VideoProgressTracker) => {
    let lastTime = 0;

    player.ready().then(() => {
      // 실제 영상 길이 동기화
      player.getDuration().then((dur: number) => {
        if (dur && tracker) {
          tracker.updateVideoDuration(Math.round(dur));
          console.log('Synced video duration from player:', dur);
        }
      });
    });

    player.on('play', () => {
      player.getCurrentTime().then(time => {
        tracker.onPlay(time);
        lastTime = time;
      });
    });

    player.on('pause', () => {
      player.getCurrentTime().then(time => {
        tracker.onPause(time);
        lastTime = time;
      });
    });

    player.on('timeupdate', (data: any) => {
      if (!currentSession) return;

      tracker.onTimeUpdate(data.seconds);
      lastTime = data.seconds;

      // UI 업데이트
      setVideoProgress(prev => ({
        ...prev,
        [currentSession.id]: tracker.getWatchedPercentage()
      }));

      // 주기적 서버 저장 (10초 간격)
      const now = Date.now();
      if (now - lastSavedTimeRef.current > 10000) {
        tracker.saveProgress().catch(e => console.error('Auto save error:', e));
        lastSavedTimeRef.current = now;
      }
    });

    player.on('seeked', (data: any) => {
      tracker.onSeeked(lastTime, data.seconds);
      const jumpAmount = data.seconds - lastTime;
      
      if (jumpAmount > 10) {
        toast({
          title: "진도 확인",
          description: "비디오를 건너뛴 것이 감지되었습니다.",
          variant: "destructive",
        });
      }
      lastTime = data.seconds;
    });

    player.on('ended', async () => {
      // 영상 종료 시 최종 저장 후 서버 검증 요청
      if (currentSession) {
        markSessionComplete(currentSession.id);
      }
    });
  };

  const fetchCourseData = async () => {
    if (!courseId || !user) return;

    try {
      setLoading(true);

      // 강의 정보 조회
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // 수강 등록 확인
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError) {
        console.error('Enrollment check error:', enrollmentError);
        toast({
          title: "수강 등록 필요",
          description: "이 강의에 수강 등록하지 않았습니다.",
          variant: "destructive",
        });
        navigate(`/course/${courseId}`);
        return;
      }

      // 섹션 및 세션 데이터 조회
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
          *,
          sessions:course_sessions(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      // 진도 데이터 조회
      const { data: progressData, error: progressError } = await supabase
        .from('session_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) console.error('Progress fetch error:', progressError);

      setCourse(courseData);
      setEnrollment(enrollmentData);
      setSections(sectionsData || []);
      setProgress(progressData || []);

      // 모든 세션을 평면화
      const allSessions = sectionsData?.flatMap(section => 
        section.sessions?.map((session: any) => ({
          ...session,
          section_id: section.id
        })) || []
      ) || [];

      setSessions(allSessions);

      // 초기 세션 설정
      if (initialSessionId) {
        const targetSession = allSessions.find(s => s.id === initialSessionId);
        if (targetSession) {
          setCurrentSession(targetSession);
        } else {
          setCurrentSession(allSessions[0] || null);
        }
      } else {
        setCurrentSession(allSessions[0] || null);
      }

    } catch (error: any) {
      console.error('Error fetching course data:', error);
      toast({
        title: "데이터 로드 오류",
        description: error.message || "강의 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // markSessionComplete 수정 (trackerRef 사용)
  const markSessionComplete = async (sessionId: string) => {
    if (!user) return;
    // progressTracker 대신 trackerRef.current 사용
    const tracker = trackerRef.current;

    if (!tracker) {
      console.error('Tracker not initialized.');
      toast({
        title: "오류",
        description: "진도 추적기가 초기화되지 않았습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. 최종 저장 확인
      await tracker.saveProgress();

      // 2. 백엔드 검증 수행
      const { data: validation, error: functionError } = await supabase.functions.invoke('validate-progress', {
        // tracker에서 실제 영상 길이 전달
        body: { sessionId, userId: user.id, actualDuration: tracker.getVideoDuration() }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`서버 검증 실패: ${functionError.message}`);
      }

      console.log('Validation result:', validation);

      if (!validation || !validation.isValid) {
        toast({
          title: "학습 검증 실패",
          description: `진도율: ${validation?.watchedPercentage || 0}% (80% 이상 필요)`,
          variant: "destructive",
        });
        return;
      }

      // 3. 검증 성공 시 완료 처리
      const { error: updateError } = await supabase
        .from('session_progress')
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          completed: true,
          completed_at: new Date().toISOString(),
          watched_duration_seconds: Math.round(tracker.getTotalWatchedTime())
        }, {
          onConflict: 'user_id,session_id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: "세션 완료",
        description: `진도율 ${validation.watchedPercentage}%로 세션이 완료되었습니다.`,
        variant: "default",
      });

      // 페이지 새로고침으로 진도 반영
      window.location.reload();

    } catch (error: any) {
      console.error('Error marking session complete:', error);
      toast({
        title: "완료 처리 오류",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const isSessionCompleted = (sessionId: string) => {
    return progress.some(p => p.session_id === sessionId && p.completed);
  };

  const getSessionProgress = (sessionId: string) => {
    const sessionProgress = progress.find(p => p.session_id === sessionId);
    return sessionProgress?.watched_duration_seconds || 0;
  };

  const navigateToSession = (session: CourseSession) => {
    setCurrentSession(session);
    // URL 업데이트 (새로고침 없이)
    const url = new URL(window.location.href);
    url.searchParams.set('session', session.id);
    window.history.pushState({}, '', url.toString());
  };

  const downloadFile = async (fileUrl: string, fileName: string, sessionId: string) => {
    try {
      // 다운로드 로그 기록
      await supabase
        .from('session_file_downloads')
        .insert({
          user_id: user?.id,
          session_id: sessionId,
          file_name: fileName
        });

      // 파일 다운로드
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "다운로드 완료",
        description: `${fileName} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('File download error:', error);
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getCurrentSessionIndex = () => {
    return sessions.findIndex(s => s.id === currentSession?.id);
  };

  const goToPreviousSession = () => {
    const currentIndex = getCurrentSessionIndex();
    if (currentIndex > 0) {
      navigateToSession(sessions[currentIndex - 1]);
    }
  };

  const goToNextSession = () => {
    const currentIndex = getCurrentSessionIndex();
    if (currentIndex < sessions.length - 1) {
      navigateToSession(sessions[currentIndex + 1]);
    }
  };

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\?.*)?/);
    return match ? match[1] : null;
  };

  const extractVimeoHash = (url: string) => {
    const match = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">강의 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !currentSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">강의를 찾을 수 없습니다</h1>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const vimeoId = extractVimeoId(currentSession.video_url);
  const hashParam = extractVimeoHash(currentSession.video_url);
  const currentIndex = getCurrentSessionIndex();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(fromPage === 'mypage' ? '/mypage' : `/course/${courseId}`)}
              className="p-0 h-auto"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {fromPage === 'mypage' ? '마이페이지로' : '강의 상세로'} 돌아가기
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-1">
            세션 {currentIndex + 1} / {sessions.length}: {currentSession.title}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 영상 영역 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  {currentSession.video_url?.includes('vimeo.com') && vimeoId ? (
                    <div className="w-full h-full relative">
                      <iframe
                        // ★ 중요: 세션 변경 시 iframe이 확실히 새로 로드되도록 key 설정
                        key={currentSession.id}
                        id={`vimeo-player-${currentSession.id}`}
                        src={`https://player.vimeo.com/video/${vimeoId}?h=${hashParam || ''}&controls=1&playsinline=1`}
                        className="w-full h-full rounded-lg"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white">비디오를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                
                {/* 진도율 및 완료 버튼 */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">진도율</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(videoProgress[currentSession.id] || 0)}%
                        </span>
                      </div>
                      <Progress 
                        value={videoProgress[currentSession.id] || 0} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      {isSessionCompleted(currentSession.id) ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          완료
                        </Badge>
                      ) : (
                        <Button 
                          onClick={() => markSessionComplete(currentSession.id)}
                          size="sm"
                          variant="default"
                        >
                          완료 표시
                        </Button>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold mb-2">{currentSession.title}</h2>
                  {currentSession.description && (
                    <p className="text-muted-foreground mb-4">{currentSession.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentSession.duration_minutes}분
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-4">
              <Button 
                onClick={goToPreviousSession}
                disabled={currentIndex === 0}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전 세션
              </Button>
              
              <Button 
                onClick={goToNextSession}
                disabled={currentIndex === sessions.length - 1}
                variant="outline"
              >
                다음 세션
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 사이드바 - 세션 목록 */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">강의 목차</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{section.title}</h4>
                        {section.attachment_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(section.attachment_url!, section.attachment_name || '첨부파일', section.id)}
                            className="h-6 w-6 p-0"
                          >
                            <File className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {section.sessions?.map((session: any) => (
                        <div key={session.id} className="ml-2">
                          <Button
                            variant={currentSession?.id === session.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => navigateToSession(session)}
                            className="w-full justify-start text-left h-auto py-2 px-3"
                          >
                            <div className="flex items-center gap-2 w-full">
                              {isSessionCompleted(session.id) ? (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <PlayCircle className="h-4 w-4 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {session.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {session.duration_minutes}분
                                </div>
                              </div>
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;