import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlayCircle, CheckCircle, Clock, ArrowLeft, ArrowRight, File, BookOpen, X, ChevronDown } from 'lucide-react';
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
  attachment_url?: string;
  attachment_name?: string;
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
  const [showSidebar, setShowSidebar] = useState(true);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);

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
  }, [courseId, user?.id]); // 의존성 변경: user -> user?.id

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
      // A. 강의 자료를 먼저 로드
      await fetchCourseMaterials(currentSession.id);
      
      // B. 트래커 생성 및 데이터 로드
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

      // C. 플레이어 초기화
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
        // destroy()는 최종 저장과 리스너 정리를 포함합니다.
        trackerRef.current.destroy().catch(e => console.error('Error during tracker destroy:', e));
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
          await fetchCourseMaterials(targetSession.id);
        } else {
          const firstSession = allSessions[0] || null;
          setCurrentSession(firstSession);
          if (firstSession) await fetchCourseMaterials(firstSession.id);
        }
      } else {
        const firstSession = allSessions[0] || null;
        setCurrentSession(firstSession);
        if (firstSession) await fetchCourseMaterials(firstSession.id);
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

  // 다음 세션 이동 함수
  const goToNextSession = useCallback(() => {
    const currentIndex = getCurrentSessionIndex();
    if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
      navigateToSession(sessions[currentIndex + 1]);
    }
  }, [sessions, currentSession]);

  // 이전 세션 이동 함수
  const goToPreviousSession = useCallback(() => {
    const currentIndex = getCurrentSessionIndex();
    if (currentIndex > 0) {
      navigateToSession(sessions[currentIndex - 1]);
    }
  }, [sessions, currentSession]);

  // markSessionComplete 수정 (새로고침 제거 및 상태 업데이트)
  const markSessionComplete = async (sessionId: string) => {
    if (!user) return;
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
        body: { sessionId, userId: user.id, actualDuration: tracker.getVideoDuration() }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`서버 검증 실패: ${functionError.message}`);
      }

      console.log('Validation result:', validation);

      if (!validation || !validation.isValid) {
        const message = validation?.watchedPercentage < 80 
          ? `시청률이 부족합니다 (현재: ${validation?.watchedPercentage || 0}%, 필요: 80%)`
          : "완료 조건을 만족하지 않습니다.";
        
        toast({
          title: "완료 조건 미달",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // 3. 검증 성공 시 완료 처리
      const totalWatchedTime = Math.round(tracker.getTotalWatchedTime());
      const { error: updateError } = await supabase
        .from('session_progress')
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          completed: true,
          completed_at: new Date().toISOString(),
          watched_duration_seconds: totalWatchedTime,
          watched_ranges: tracker.getProgressData().watchedRanges,
        }, {
          onConflict: 'user_id,session_id'
        });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // 4. 로컬 상태 업데이트
      const updatedSessionProgress = [...progress];
      const index = updatedSessionProgress.findIndex(p => p.session_id === sessionId);
      if (index > -1) {
        updatedSessionProgress[index] = { ...updatedSessionProgress[index], completed: true, watched_duration_seconds: totalWatchedTime };
      } else {
        updatedSessionProgress.push({ session_id: sessionId, completed: true, watched_duration_seconds: totalWatchedTime });
      }
      setProgress(updatedSessionProgress);

      // 5. 전체 강의 진도율 계산 및 업데이트
      const completedSessions = updatedSessionProgress.filter(p => p.completed).length;
      const totalSessions = sessions.length;
      const newCourseProgress = totalSessions > 0 ? Math.min((completedSessions / totalSessions) * 100, 100) : 0;

      if (enrollment) {
        await supabase
          .from('enrollments')
          .update({ 
            progress: newCourseProgress,
            completed_at: newCourseProgress >= 100 ? new Date().toISOString() : null
          })
          .eq('id', enrollment.id);
        
        // 로컬 enrollment 상태 업데이트
        setEnrollment((prev: any) => ({ ...prev, progress: newCourseProgress }));
      }

      toast({
        title: "세션 완료! 🎉",
        description: `진도율 ${validation.watchedPercentage}%로 세션이 완료되었습니다.`,
        variant: "default",
      });

      // 6. 다음 세션으로 자동 이동
      if (newCourseProgress < 100) {
        setTimeout(() => {
          goToNextSession();
        }, 1500);
      }

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

  const navigateToSession = async (session: CourseSession) => {
    setCurrentSession(session);
    // URL 업데이트 (새로고침 없이)
    const url = new URL(window.location.href);
    url.searchParams.set('session', session.id);
    window.history.pushState({}, '', url.toString());
    
    // 강의 자료는 useEffect에서 자동으로 로드됩니다
  };

  const fetchCourseMaterials = async (sessionId: string) => {
    try {
      // DB에서 직접 세션의 section_id를 조회하여 안정성 확보
      const { data: sessionData, error: sessionError } = await supabase
        .from('course_sessions')
        .select('section_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData?.section_id) {
        console.error('Session not found or no section_id:', sessionError);
        setCourseMaterials([]);
        return;
      }
      
      // 해당 섹션의 모든 자료를 가져옵니다
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('section_id', sessionData.section_id)
        .order('order_index');

      if (error) throw error;
      setCourseMaterials(data || []);
    } catch (error) {
      console.error('Error fetching course materials:', error);
      setCourseMaterials([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadCourseMaterial = async (material: any) => {
    if (material.file_type === 'link') {
      // 외부 링크인 경우 새 창에서 열기
      window.open(material.file_url, '_blank');
      
      // 다운로드 로그 기록
      await supabase
        .from('session_file_downloads')
        .insert({
          user_id: user?.id,
          session_id: currentSession?.id,
          file_name: material.title
        });
      
      toast({
        title: "링크 열기",
        description: `${material.title} 링크를 새 창에서 열었습니다.`,
      });
      return;
    }

    // 파일 다운로드
    downloadFile(material.file_url, material.file_name, currentSession?.id || '', material.title);
  };

  const downloadFile = async (fileUrl: string, fileName: string, sessionId: string, materialTitle?: string) => {
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
        description: `${materialTitle || fileName} 파일이 다운로드되었습니다.`,
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

  const getCurrentSectionData = () => {
    if (!currentSession) return null;
    return sections.find(section => 
      section.sessions?.some((session: any) => session.id === currentSession.id)
    );
  };



  const extractVimeoId = (url: string | null | undefined) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\?.*)?/);
    return match ? match[1] : null;
  };

  const extractVimeoHash = (url: string | null | undefined) => {
    if (!url) return null;
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
      
      {/* 모바일 우선 반응형 레이아웃 */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* 상단 헤더 - 모든 화면 크기에서 표시 */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/my-page')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            내 강의실
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentIndex + 1}/{sessions.length}</span>
            <span>•</span>
            <span>{Math.round(videoProgress[currentSession.id] || 0)}%</span>
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
            {currentSession.title}
          </h1>
          <p className="text-sm text-muted-foreground">{course.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 메인 비디오 영역 */}
          <div className="lg:col-span-3 space-y-4">
            {/* 비디오 플레이어 */}
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="aspect-video bg-black">
                  {currentSession.video_url?.includes('vimeo.com') && vimeoId ? (
                    <iframe
                      key={currentSession.id}
                      id={`vimeo-player-${currentSession.id}`}
                      src={`https://player.vimeo.com/video/${vimeoId}?h=${hashParam || ''}&controls=1&playsinline=1`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>비디오를 불러올 수 없습니다</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 진도율 - 깔끔한 디자인 */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">학습 진도</span>
                  <span className="text-xl font-bold text-foreground">
                    {Math.round(videoProgress[currentSession.id] || 0)}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* 심플한 프로그레스바 */}
                  <div className="relative">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${Math.max(videoProgress[currentSession.id] || 0, 0)}%` }}
                      />
                    </div>
                    
                    {/* 80% 완료 기준 표시 */}
                    {(videoProgress[currentSession.id] || 0) < 80 && (
                      <div className="absolute top-0 left-[80%] transform -translate-x-1/2">
                        <div className="w-0.5 h-2 bg-border" />
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 mt-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">80%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 상태 정보 */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      80% 이상 시청 시 완료 처리
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (videoProgress[currentSession.id] || 0) >= 80 
                          ? 'bg-green-500' 
                          : 'bg-muted-foreground/50'
                      }`} />
                      <span className={`text-sm font-medium ${
                        (videoProgress[currentSession.id] || 0) >= 80 
                          ? 'text-green-600' 
                          : 'text-muted-foreground'
                      }`}>
                        {(videoProgress[currentSession.id] || 0) >= 80 ? '완료 가능' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 강의 자료 - 다중 자료 지원 */}
            <Card>
              <Collapsible open={isMaterialsOpen} onOpenChange={setIsMaterialsOpen}>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">강의 자료</h3>
                        {courseMaterials.length > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {courseMaterials.length}개
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        isMaterialsOpen ? 'transform rotate-180' : ''
                      }`} />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {courseMaterials.length > 0 ? (
                        courseMaterials.map((material, index) => (
                          <Button
                            key={material.id}
                            variant="outline"
                            onClick={() => downloadCourseMaterial(material)}
                            className="w-full justify-start h-auto p-4 border-primary/30 hover:bg-primary/5"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg text-xs font-medium text-primary">
                                {index + 1}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-xs text-muted-foreground truncate">
                                  {material.file_name}
                                  {material.file_size && (
                                    <span className="ml-2">
                                      ({formatFileSize(material.file_size)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {material.file_type === 'link' ? (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                ) : (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                )}
                              </div>
                            </div>
                          </Button>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                          <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">이 세션에는 강의 자료가 없습니다</p>
                        </div>
                      )}
                    </div>
                    
                    {courseMaterials.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />
                          파일 다운로드
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1 ml-3" />
                          외부 링크
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* 네비게이션 */}
            <div className="flex items-center justify-between gap-4">
              <Button 
                onClick={goToPreviousSession}
                disabled={currentIndex === 0}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              
              <div className="flex items-center justify-center">
                {isSessionCompleted(currentSession.id) ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium text-sm">완료</span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => markSessionComplete(currentSession.id)}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  >
                    완료 표시
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={goToNextSession}
                disabled={currentIndex === sessions.length - 1}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-none"
              >
                다음
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 우측 사이드바 - 데스크톱에서만 표시 */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">강의 목차</h3>
                
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between py-2">
                        <h4 className="font-medium text-sm text-foreground/90">
                          {section.title}
                        </h4>
                        {(section.attachment_url || section.sessions?.some((s: any) => s.attachment_url)) && (
                          <Badge variant="outline" className="text-xs">
                            자료
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {section.sessions?.map((session: any) => (
                          <div
                            key={session.id}
                            onClick={() => navigateToSession(session)}
                            className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${
                              currentSession?.id === session.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {isSessionCompleted(session.id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <PlayCircle className={`h-4 w-4 ${
                                    currentSession?.id === session.id 
                                      ? 'text-primary-foreground' 
                                      : 'text-muted-foreground'
                                  }`} />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium line-clamp-2 ${
                                  currentSession?.id === session.id ? 'text-primary-foreground' : ''
                                }`}>
                                  {session.title}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className={`text-xs flex items-center gap-1 ${
                                    currentSession?.id === session.id 
                                      ? 'text-primary-foreground/70' 
                                      : 'text-muted-foreground'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    {session.duration_minutes}분
                                  </div>
                                  
                                  {session.attachment_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(session.attachment_url!, session.attachment_name || '세션자료', session.id);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <File className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 모바일 목차 - 하단에 배치 */}
        <div className="lg:hidden mt-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">강의 목차</h3>
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <h4 className="font-medium text-sm text-foreground/90">
                        {section.title}
                      </h4>
                      {(section.attachment_url || section.sessions?.some((s: any) => s.attachment_url)) && (
                        <Badge variant="outline" className="text-xs">
                          자료
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {section.sessions?.map((session: any) => (
                        <div
                          key={session.id}
                          onClick={() => navigateToSession(session)}
                          className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${
                            currentSession?.id === session.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted/50 border border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isSessionCompleted(session.id) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <PlayCircle className={`h-4 w-4 ${
                                  currentSession?.id === session.id 
                                    ? 'text-primary-foreground' 
                                    : 'text-muted-foreground'
                                }`} />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${
                                currentSession?.id === session.id ? 'text-primary-foreground' : ''
                              }`}>
                                {session.title}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <div className={`text-xs flex items-center gap-1 ${
                                  currentSession?.id === session.id 
                                    ? 'text-primary-foreground/70' 
                                    : 'text-muted-foreground'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {session.duration_minutes}분
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {isSessionCompleted(session.id) && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                      완료
                                    </Badge>
                                  )}
                                  {session.attachment_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(session.attachment_url!, session.attachment_name || '세션자료', session.id);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <File className="h-3 w-3 text-primary" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Learn;