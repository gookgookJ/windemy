import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Users, PlayCircle, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalWatchTime: number;
  averageCompletion: number;
  popularCourses: Array<{
    course_title: string;
    student_count: number;
    avg_progress: number;
  }>;
  recentActivity: Array<{
    user_name: string;
    course_title: string;
    session_title: string;
    progress: number;
    last_activity: string;
  }>;
  watchTimeStats: Array<{
    course_title: string;
    total_watch_time: number;
    avg_session_time: number;
  }>;
}

export const LearningAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 총 수강생 수
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id', { count: 'exact' });

      if (enrollmentsError) throw enrollmentsError;

      // 활성 수강생 수 (최근 7일 내 활동)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: activeStudentsData, error: activeError } = await supabase
        .from('session_progress')
        .select('user_id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (activeError) throw activeError;

      // 인기 강의
      const { data: popularCoursesData, error: popularError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          progress,
          course:courses(title)
        `)
        .order('progress', { ascending: false });

      if (popularError) throw popularError;

      // 최근 활동
      const { data: recentActivityData, error: recentError } = await supabase
        .from('session_progress')
        .select(`
          user_id,
          completed,
          created_at,
          session:course_sessions(
            title,
            course:courses(title)
          ),
          user:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // 시청 시간 통계
      const { data: watchSegmentsData, error: watchError } = await supabase
        .from('video_watch_segments')
        .select(`
          duration,
          session:course_sessions(
            title,
            course:courses(title)
          )
        `);

      if (watchError) throw watchError;

      // 데이터 가공
      const totalStudents = enrollmentsData?.length || 0;
      const activeStudents = new Set(activeStudentsData?.map(item => item.user_id)).size || 0;

      // 인기 강의 가공
      const courseStats = popularCoursesData?.reduce((acc, enrollment) => {
        const courseTitle = enrollment.course?.title || 'Unknown';
        if (!acc[courseTitle]) {
          acc[courseTitle] = { student_count: 0, total_progress: 0 };
        }
        acc[courseTitle].student_count++;
        acc[courseTitle].total_progress += enrollment.progress || 0;
        return acc;
      }, {} as Record<string, { student_count: number; total_progress: number }>);

      const popularCourses = Object.entries(courseStats || {}).map(([title, stats]) => ({
        course_title: title,
        student_count: stats.student_count,
        avg_progress: stats.total_progress / stats.student_count
      })).sort((a, b) => b.student_count - a.student_count).slice(0, 5);

      // 최근 활동 가공
      const recentActivity = recentActivityData?.map(activity => ({
        user_name: activity.user?.full_name || 'Unknown',
        course_title: activity.session?.course?.title || 'Unknown',
        session_title: activity.session?.title || 'Unknown',
        progress: activity.completed ? 100 : 0,
        last_activity: activity.created_at
      })) || [];

      // 시청 시간 통계 가공
      const watchStats = watchSegmentsData?.reduce((acc, segment) => {
        const courseTitle = segment.session?.course?.title || 'Unknown';
        if (!acc[courseTitle]) {
          acc[courseTitle] = { total_time: 0, session_count: 0 };
        }
        acc[courseTitle].total_time += segment.duration || 0;
        acc[courseTitle].session_count++;
        return acc;
      }, {} as Record<string, { total_time: number; session_count: number }>);

      const watchTimeStats = Object.entries(watchStats || {}).map(([title, stats]) => ({
        course_title: title,
        total_watch_time: stats.total_time,
        avg_session_time: stats.total_time / stats.session_count
      })).sort((a, b) => b.total_watch_time - a.total_watch_time).slice(0, 5);

      const totalWatchTime = watchSegmentsData?.reduce((sum, segment) => sum + (segment.duration || 0), 0) || 0;
      const averageCompletion = popularCourses.reduce((sum, course) => sum + course.avg_progress, 0) / popularCourses.length || 0;

      setAnalytics({
        totalStudents,
        activeStudents,
        totalWatchTime: Math.round(totalWatchTime / 60), // 분 단위로 변환
        averageCompletion: Math.round(averageCompletion),
        popularCourses,
        recentActivity,
        watchTimeStats
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "오류",
        description: "분석 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-3xl font-bold text-foreground mb-2">학습 분석</h1>
            <p className="text-muted-foreground">수강생들의 학습 패턴과 진도를 분석하세요</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">최근 7일</SelectItem>
              <SelectItem value="30days">최근 30일</SelectItem>
              <SelectItem value="90days">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 수강생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                전체 등록된 수강생 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 학습자</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.activeStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                최근 7일간 활동한 수강생
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 시청 시간</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics?.totalWatchTime || 0)}</div>
              <p className="text-xs text-muted-foreground">
                누적 동영상 시청 시간
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 완료율</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageCompletion || 0}%</div>
              <p className="text-xs text-muted-foreground">
                강의 평균 진도율
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 인기 강의 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                인기 강의 TOP 5
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.popularCourses.map((course, index) => (
                  <div key={course.course_title} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{course.course_title}</div>
                        <div className="text-xs text-muted-foreground">
                          {course.student_count}명 수강
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {Math.round(course.avg_progress)}% 완료
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 시청 시간 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                시청 시간 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.watchTimeStats.map((stat, index) => (
                  <div key={stat.course_title} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{stat.course_title}</div>
                        <div className="text-xs text-muted-foreground">
                          평균 {formatTime(Math.round(stat.avg_session_time / 60))} / 세션
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatTime(Math.round(stat.total_watch_time / 60))}
                      </div>
                      <div className="text-xs text-muted-foreground">총 시청</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 학습 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              최근 학습 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>수강생</TableHead>
                  <TableHead>강의</TableHead>
                  <TableHead>세션</TableHead>
                  <TableHead>진도</TableHead>
                  <TableHead>활동 시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.recentActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {activity.user_name}
                    </TableCell>
                    <TableCell>{activity.course_title}</TableCell>
                    <TableCell>{activity.session_title}</TableCell>
                    <TableCell>
                      <Badge variant={activity.progress === 100 ? "default" : "secondary"}>
                        {activity.progress === 100 ? "완료" : "진행중"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(activity.last_activity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LearningAnalytics;