import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Eye, AlertTriangle, CheckCircle, Clock, Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StudentProgress {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  overall_progress: number;
  enrolled_at: string;
  last_activity: string;
  completed_sessions: number;
  total_sessions: number;
  total_watch_time: number;
  suspicious_activity: boolean;
  completion_rate: number;
}

interface DetailedProgress {
  session_title: string;
  watched_duration: number;
  total_duration: number;
  completion_percentage: number;
  last_watched: string;
  is_completed: boolean;
  watch_segments: number;
  seek_events: number;
  suspicious_behavior: boolean;
}

export const ProgressMonitoring = () => {
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [detailedProgress, setDetailedProgress] = useState<DetailedProgress[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [courses, setCourses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgressData();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // 수강 등록 데이터와 진도 정보 가져오기
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          user_id,
          course_id,
          progress,
          enrolled_at,
          user:profiles(full_name, email),
          course:courses(title)
        `);

      if (enrollmentsError) throw enrollmentsError;

      // 세션 진도 데이터 가져오기
      const { data: sessionProgressData, error: sessionError } = await supabase
        .from('session_progress')
        .select(`
          user_id,
          session_id,
          completed,
          watched_duration_seconds,
          created_at,
          session:course_sessions(course_id, duration_minutes)
        `);

      if (sessionError) throw sessionError;

      // 비디오 시청 데이터 가져오기
      const { data: watchSegmentsData, error: watchError } = await supabase
        .from('video_watch_segments')
        .select(`
          user_id,
          session_id,
          duration,
          weight,
          created_at,
          session:course_sessions(course_id)
        `);

      if (watchError) throw watchError;

      // 의심스러운 활동 데이터 가져오기 (많은 점프)
      const { data: seekEventsData, error: seekError } = await supabase
        .from('video_seek_events')
        .select(`
          user_id,
          session_id,
          jump_amount,
          session:course_sessions(course_id)
        `);

      if (seekError) throw seekError;

      // 데이터 가공
      const progressMap = new Map<string, StudentProgress>();

      enrollmentsData?.forEach(enrollment => {
        const key = `${enrollment.user_id}_${enrollment.course_id}`;
        
        // 해당 강의의 총 세션 수 계산
        const courseSessions = sessionProgressData?.filter(sp => 
          sp.session?.course_id === enrollment.course_id
        ) || [];
        
        const userSessions = sessionProgressData?.filter(sp => 
          sp.user_id === enrollment.user_id && sp.session?.course_id === enrollment.course_id
        ) || [];

        const completedSessions = userSessions.filter(s => s.completed).length;
        const totalSessions = new Set(courseSessions.map(s => s.session_id)).size;

        // 총 시청 시간 계산
        const userWatchTime = watchSegmentsData?.filter(ws => 
          ws.user_id === enrollment.user_id && ws.session?.course_id === enrollment.course_id
        ).reduce((sum, ws) => sum + (ws.duration || 0), 0) || 0;

        // 의심스러운 활동 탐지 (큰 점프가 많은 경우)
        const userSeekEvents = seekEventsData?.filter(se => 
          se.user_id === enrollment.user_id && se.session?.course_id === enrollment.course_id
        ) || [];
        const suspiciousJumps = userSeekEvents.filter(se => Math.abs(se.jump_amount) > 60).length;
        const suspiciousActivity = suspiciousJumps > 5;

        // 마지막 활동 시간
        const lastActivity = Math.max(
          ...userSessions.map(s => new Date(s.created_at).getTime()),
          ...watchSegmentsData?.filter(ws => 
            ws.user_id === enrollment.user_id && ws.session?.course_id === enrollment.course_id
          ).map(ws => new Date(ws.created_at).getTime()) || [0]
        );

        progressMap.set(key, {
          id: key,
          user_id: enrollment.user_id,
          user_name: enrollment.user?.full_name || 'Unknown',
          user_email: enrollment.user?.email || 'Unknown',
          course_id: enrollment.course_id,
          course_title: enrollment.course?.title || 'Unknown',
          overall_progress: enrollment.progress || 0,
          enrolled_at: enrollment.enrolled_at,
          last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : enrollment.enrolled_at,
          completed_sessions: completedSessions,
          total_sessions: totalSessions,
          total_watch_time: Math.round(userWatchTime / 60), // 분 단위
          suspicious_activity: suspiciousActivity,
          completion_rate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
        });
      });

      setProgressData(Array.from(progressMap.values()));
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: "오류",
        description: "진도 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedProgress = async (userId: string, courseId: string) => {
    try {
      setDetailLoading(true);

      // 해당 강의의 모든 세션 가져오기
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select(`
          id,
          title,
          duration_minutes
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (sessionsError) throw sessionsError;

      // 사용자의 세션별 진도 가져오기
      const { data: progressData, error: progressError } = await supabase
        .from('session_progress')
        .select('*')
        .eq('user_id', userId)
        .in('session_id', sessionsData?.map(s => s.id) || []);

      if (progressError) throw progressError;

      // 시청 세그먼트 데이터
      const { data: watchData, error: watchError } = await supabase
        .from('video_watch_segments')
        .select('*')
        .eq('user_id', userId)
        .in('session_id', sessionsData?.map(s => s.id) || []);

      if (watchError) throw watchError;

      // Seek 이벤트 데이터
      const { data: seekData, error: seekError } = await supabase
        .from('video_seek_events')
        .select('*')
        .eq('user_id', userId)
        .in('session_id', sessionsData?.map(s => s.id) || []);

      if (seekError) throw seekError;

      // 상세 진도 정보 구성
      const detailedData = sessionsData?.map(session => {
        const sessionProgress = progressData?.find(p => p.session_id === session.id);
        const sessionWatchSegments = watchData?.filter(w => w.session_id === session.id) || [];
        const sessionSeekEvents = seekData?.filter(s => s.session_id === session.id) || [];

        const totalWatchTime = sessionWatchSegments.reduce((sum, w) => sum + (w.duration || 0), 0);
        const totalDuration = (session.duration_minutes || 0) * 60; // 초 단위
        const completionPercentage = totalDuration > 0 ? Math.min((totalWatchTime / totalDuration) * 100, 100) : 0;

        // 의심스러운 행동 탐지
        const suspiciousJumps = sessionSeekEvents.filter(se => Math.abs(se.jump_amount) > 30).length;
        const suspiciousBehavior = suspiciousJumps > 3 || (sessionWatchSegments.length > 0 && completionPercentage > 95 && totalWatchTime < totalDuration * 0.5);

        return {
          session_title: session.title,
          watched_duration: totalWatchTime,
          total_duration: totalDuration,
          completion_percentage: Math.round(completionPercentage),
          last_watched: sessionProgress?.created_at || '',
          is_completed: sessionProgress?.completed || false,
          watch_segments: sessionWatchSegments.length,
          seek_events: sessionSeekEvents.length,
          suspicious_behavior: suspiciousBehavior
        };
      }) || [];

      setDetailedProgress(detailedData);
    } catch (error) {
      console.error('Error fetching detailed progress:', error);
      toast({
        title: "오류",
        description: "상세 진도 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = (studentProgress: StudentProgress) => {
    setSelectedStudent(studentProgress.id);
    fetchDetailedProgress(studentProgress.user_id, studentProgress.course_id);
  };

  const filteredProgress = progressData.filter(progress => {
    const matchesSearch = 
      progress.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.course_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = courseFilter === 'all' || progress.course_id === courseFilter;
    
    const matchesProgress = 
      progressFilter === 'all' ||
      (progressFilter === 'completed' && progress.completion_rate >= 90) ||
      (progressFilter === 'in_progress' && progress.completion_rate > 0 && progress.completion_rate < 90) ||
      (progressFilter === 'not_started' && progress.completion_rate === 0) ||
      (progressFilter === 'suspicious' && progress.suspicious_activity);
    
    return matchesSearch && matchesCourse && matchesProgress;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBadge = (progress: StudentProgress) => {
    if (progress.suspicious_activity) {
      return <Badge variant="destructive" className="text-xs">의심</Badge>;
    }
    if (progress.completion_rate >= 90) {
      return <Badge variant="default" className="text-xs bg-green-500">완료</Badge>;
    }
    if (progress.completion_rate > 0) {
      return <Badge variant="secondary" className="text-xs">진행중</Badge>;
    }
    return <Badge variant="outline" className="text-xs">미시작</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">진도 모니터링</h1>
            <p className="text-muted-foreground">수강생들의 학습 진도를 실시간으로 모니터링하고 의심스러운 활동을 탐지하세요</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="수강생 이름, 이메일 또는 강의명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="강의 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 강의</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="진도 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="not_started">미시작</SelectItem>
                  <SelectItem value="suspicious">의심스러운 활동</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 진도 목록 */}
          <div className="lg:col-span-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl">수강생 진도 현황</CardTitle>
                <p className="text-sm text-muted-foreground">{filteredProgress.length}명의 수강생</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">수강생</TableHead>
                      <TableHead className="w-[25%]">강의</TableHead>
                      <TableHead className="w-[15%]">진도율</TableHead>
                      <TableHead className="w-[15%]">상태</TableHead>
                      <TableHead className="w-[20%] text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProgress.map((progress) => (
                      <TableRow key={progress.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{progress.user_name}</div>
                            <div className="text-xs text-muted-foreground">{progress.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{progress.course_title}</div>
                          <div className="text-xs text-muted-foreground">
                            {progress.completed_sessions}/{progress.total_sessions} 세션
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={`text-sm font-medium ${getProgressColor(progress.completion_rate)}`}>
                              {Math.round(progress.completion_rate)}%
                            </div>
                            <Progress value={progress.completion_rate} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getProgressBadge(progress)}
                            {progress.suspicious_activity && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                의심
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetails(progress)}
                            className="h-8 px-3 hover-scale"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            상세보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredProgress.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-muted-foreground mb-4">
                      <Search className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">검색 결과가 없습니다</p>
                      <p className="text-sm">다른 검색어를 입력하거나 필터를 조정해보세요</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 상세 진도 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">세션별 상세 진도</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStudent ? (
                  detailLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm">로딩 중...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detailedProgress.map((detail, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{detail.session_title}</div>
                            {detail.suspicious_behavior && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>진도율</span>
                              <span className={getProgressColor(detail.completion_percentage)}>
                                {detail.completion_percentage}%
                              </span>
                            </div>
                            <Progress value={detail.completion_percentage} className="h-1" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>시청: {Math.round(detail.watched_duration / 60)}분</div>
                            <div>총 길이: {Math.round(detail.total_duration / 60)}분</div>
                            <div>세그먼트: {detail.watch_segments}</div>
                            <div>점프: {detail.seek_events}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            {detail.is_completed ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                완료
                              </Badge>
                            ) : detail.completion_percentage > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                진행중
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Pause className="h-3 w-3 mr-1" />
                                미시작
                              </Badge>
                            )}
                            
                            {detail.suspicious_behavior && (
                              <Badge variant="destructive" className="text-xs">
                                의심
                              </Badge>
                            )}
                          </div>

                          {detail.last_watched && (
                            <div className="text-xs text-muted-foreground">
                              마지막 시청: {formatDate(detail.last_watched)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">수강생을 선택하여 상세 진도를 확인하세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProgressMonitoring;