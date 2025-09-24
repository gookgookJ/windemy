import { useState, useEffect } from 'react';
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
  const [progressTracker, setProgressTracker] = useState<VideoProgressTracker | null>(null);
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

      // Fetch course sections with sessions
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(`
          *,
          course_sessions(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      const { data: sessionsData, error: sessionsFetchError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError || sessionsFetchError) throw sectionsError || sessionsFetchError;

      // Transform sections data
      const transformedSections: CourseSection[] = (sectionsData || []).map(section => ({
        id: section.id,
        title: section.title,
        order_index: section.order_index,
        attachment_url: section.attachment_url,
        attachment_name: section.attachment_name,
        sessions: (section.course_sessions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((session: any) => ({
            ...session,
            section_id: section.id
          }))
      }));

      setSections(transformedSections);
      setSessions(sessionsData || []);
      
      // Debug: 섹션 데이터 확인
      console.log('Sections with attachments:', transformedSections.filter(s => s.attachment_url));
      
      if (sessionsData && sessionsData.length > 0) {
        const initial = initialSessionId ? sessionsData.find(s => s.id === initialSessionId) : null;
        setCurrentSession(initial || sessionsData[0]);
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

    // 진도 저장 (10초마다 업데이트)
    if (watchedSeconds > 0 && watchedSeconds % 10 === 0) {
      try {
        await supabase
          .from('session_progress')
          .upsert({
            user_id: user.id,
            session_id: currentSession.id,
            watched_duration_seconds: watchedSeconds,
            completed: progressPercent >= 80,
            completed_at: progressPercent >= 80 ? new Date().toISOString() : null
          }, {
            onConflict: 'user_id,session_id'
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
      const updatedProgress = [...progress];
      const existingIndex = updatedProgress.findIndex(p => p.session_id === sessionId);
      
      if (existingIndex >= 0) {
        updatedProgress[existingIndex] = { ...updatedProgress[existingIndex], completed: true };
      } else {
        updatedProgress.push({ 
          session_id: sessionId, 
          completed: true, 
          watched_duration_seconds: validation.totalWatchedTime
        });
      }
      
      const completedSessions = updatedProgress.filter(p => p.completed).length;
      const totalSessions = sessions.length;
      const newProgress = totalSessions > 0 ? Math.min((completedSessions / totalSessions) * 100, 100) : 0;

      // 강의 전체 진도율 업데이트
      await supabase
        .from('enrollments')
        .update({ 
          progress: newProgress,
          completed_at: newProgress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id);

      // 로컬 enrollment 상태도 업데이트
      setEnrollment(prev => prev ? { ...prev, progress: newProgress } : prev);

      toast({
        title: "세션 완료! 🎉",
        description: `전체 진도율: ${newProgress.toFixed(1)}% (${completedSessions}/${totalSessions})`,
      });

      console.log('Progress updated:', {
        completedSessions,
        totalSessions,
        newProgress,
        enrollmentId: enrollment.id
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

  const downloadSectionAttachment = async (section: CourseSection) => {
    if (!section.attachment_url || !user) return;
    
    try {
      // URL이 http로 시작하면 외부 링크로 처리
      if (section.attachment_url.startsWith('http') && !section.attachment_url.includes('supabase.co')) {
        window.open(section.attachment_url, '_blank');
        
        toast({
          title: "링크 열기",
          description: "새 탭에서 자료 링크가 열렸습니다."
        });
        return;
      }

      // Supabase Storage 파일 처리
      let path = section.attachment_url;
      if (path.startsWith('http')) {
        const marker = '/course-files/';
        const idx = path.indexOf(marker);
        if (idx !== -1) {
          path = path.substring(idx + marker.length);
        }
      }

      // Signed URL 생성
      const { data, error } = await supabase.storage
        .from('course-files')
        .createSignedUrl(path, 60);
      
      if (error || !data?.signedUrl) {
        throw error || new Error('Signed URL 생성 실패');
      }

      // fetch로 파일을 다운로드해서 blob으로 변환
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error(`파일 다운로드 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Blob URL을 생성해서 다운로드
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = section.attachment_name || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Blob URL 정리
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast({
        title: "다운로드 완료",
        description: "파일이 성공적으로 다운로드되었습니다."
      });

    } catch (err) {
      console.error('download error', err);
      toast({ 
        title: '다운로드 실패', 
        description: '파일 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.', 
        variant: 'destructive' 
      });
    }
  };
  const goToNextSession = () => {
    // 모든 세션을 순서대로 정렬하여 다음 세션 찾기
    const allSessions = sections
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(section => 
        section.sessions.sort((a, b) => a.order_index - b.order_index)
      );
    
    const currentIndex = allSessions.findIndex(s => s.id === currentSession?.id);
    if (currentIndex >= 0 && currentIndex < allSessions.length - 1) {
      setCurrentSession(allSessions[currentIndex + 1]);
    }
  };

  const goToPreviousSession = () => {
    // 모든 세션을 순서대로 정렬하여 이전 세션 찾기
    const allSessions = sections
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(section => 
        section.sessions.sort((a, b) => a.order_index - b.order_index)
      );
    
    const currentIndex = allSessions.findIndex(s => s.id === currentSession?.id);
    if (currentIndex > 0) {
      setCurrentSession(allSessions[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="bg-background flex items-center justify-center py-20">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  const completedSessions = progress.filter(p => p.completed).length;
  const totalSessions = sessions.length;
  const courseProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <div className="bg-background">
      <Header />
      
      {/* 헤더 섹션 - 반응형 개선 */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* 좌측: 돌아가기 버튼과 강의 정보 */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/my-page')}
                className="flex-shrink-0 p-2 sm:px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline ml-2">내 강의실로 돌아가기</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">{course?.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  강사: {course?.instructor?.full_name}
                </p>
              </div>
            </div>
            
            {/* 우측: 진행률 표시 - 개선된 디자인 */}
            <div className="flex-shrink-0">
              <div className="text-right">
                <div className="text-xs sm:text-sm font-medium text-foreground">
                  {Math.round(courseProgress)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedSessions}/{totalSessions}
                </div>
              </div>
              <Progress 
                value={courseProgress} 
                className="w-16 sm:w-24 md:w-32 h-2 mt-2" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 모바일/태블릿: 비디오 우선, 데스크톱: 사이드바 레이아웃 */}
        <div className="space-y-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0 lg:items-start">
          
          {/* 비디오 플레이어 - 모바일에서 최상단, PC에서 정렬 맞춤 */}
          <div className="order-1 lg:order-2 lg:col-span-3">
            {currentSession ? (
              <Card>
                <CardContent className="p-3 sm:p-6">
                  {/* 세션 제목과 설명 */}
                  <div className="mb-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 leading-tight">
                      {currentSession.title}
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                      {currentSession.description}
                    </p>
                  </div>
                  
                  {/* 비디오 플레이어 영역 */}
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center mb-4 sm:mb-6">
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
                        <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">비디오를 준비 중입니다</p>
                      </div>
                    )}
                  </div>

                  {/* 컨트롤 버튼 - 반응형 개선 */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousSession}
                      disabled={sessions.findIndex(s => s.id === currentSession.id) === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">이전</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => markSessionComplete(currentSession.id)}
                      disabled={getSessionProgress(currentSession.id)?.completed || false}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none px-3 sm:px-6"
                    >
                      {getSessionProgress(currentSession.id)?.completed ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">완료됨</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm">완료 표시</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextSession}
                      disabled={sessions.findIndex(s => s.id === currentSession.id) === sessions.length - 1}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline mr-2">다음</span>
                      <ArrowRight className="h-4 w-4" />
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

          {/* 강의 목차 - 모바일에서 비디오 아래 */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">강의 목차</h3>
                <div className="space-y-4 sm:space-y-6">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-2 sm:space-y-3">
                      {/* 섹션 헤더 - 모바일 최적화 */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/8 to-transparent rounded-lg sm:rounded-xl" />
                        <div className="relative px-3 py-2 sm:px-4 sm:py-3 bg-card/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-primary/20 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-1 h-4 sm:h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full flex-shrink-0" />
                              <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                                {section.title}
                              </h3>
                            </div>
                            {/* 섹션 자료 다운로드 버튼 */}
                            {section.attachment_url && section.attachment_name ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadSectionAttachment(section)}
                                className="flex items-center gap-1 hover:bg-primary/10 transition-colors flex-shrink-0 px-2 py-1 h-auto"
                              >
                                <File className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs">자료</span>
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded flex-shrink-0">
                                자료 없음
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 세션 목록 - 모바일 최적화 */}
                      <div className="ml-3 sm:ml-6 space-y-2">
                        {section.sessions.map((session) => {
                          const sessionProgress = getSessionProgress(session.id);
                          const isCompleted = sessionProgress?.completed || false;
                          const isCurrent = currentSession?.id === session.id;
                          
                          return (
                            <div
                              key={session.id}
                              className={`group p-2 sm:p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                                isCurrent 
                                  ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20' 
                                  : 'hover:bg-muted/50 hover:border-muted-foreground/30'
                              }`}
                              onClick={() => setCurrentSession(session)}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                {isCompleted ? (
                                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex-shrink-0 mt-0.5">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                  </div>
                                ) : isCurrent && getVideoProgress(session.id) > 0 ? (
                                  <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5">
                                    <div className="absolute inset-0 bg-muted rounded-full" />
                                    <div 
                                      className="absolute inset-0 bg-primary rounded-full origin-center transition-all"
                                      style={{
                                        clipPath: `inset(0 ${100 - getVideoProgress(session.id)}% 0 0)`
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-muted/50 rounded-full group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                                    <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
                                      {session.order_index}. {session.title}
                                    </span>
                                    {session.is_free && (
                                      <Badge variant="secondary" className="text-xs flex-shrink-0">무료</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>{session.duration_minutes}분</span>
                                    {isCurrent && getVideoProgress(session.id) > 0 && (
                                      <span className="ml-2 text-primary font-medium">
                                        • {Math.round(getVideoProgress(session.id))}%
                                      </span>
                                    )}
                                  </div>
                                  {isCurrent && getVideoProgress(session.id) > 0 && (
                                    <div className="mt-2">
                                      <Progress value={getVideoProgress(session.id)} className="h-1" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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