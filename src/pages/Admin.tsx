import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, ShoppingCart, DollarSign, TrendingUp, Activity, Star, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { QuickActions } from '@/components/admin/QuickActions';
import { RecentActivity } from '@/components/admin/RecentActivity';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  todayStats: {
    newUsers: number;
    newEnrollments: number;
    completedSessions: number;
  };
}

const Admin = () => {
  const [stats, setStats] = useState<AdminStats>({ 
    totalUsers: 0, 
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    averageRating: 0,
    todayStats: { newUsers: 0, newEnrollments: 0, completedSessions: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 병렬로 모든 데이터 가져오기
      const [
        usersResponse,
        coursesResponse,
        publishedCoursesResponse,
        enrollmentsResponse,
        ordersResponse,
        newUsersResponse,
        newEnrollmentsResponse,
        completedSessionsResponse,
        ratingsResponse
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }).eq('is_published', true),
        supabase.from('enrollments').select('*', { count: 'exact' }),
        supabase.from('orders').select('total_amount').eq('status', 'completed'),
        supabase.from('profiles').select('*', { count: 'exact' }).gte('created_at', today),
        supabase.from('enrollments').select('*', { count: 'exact' }).gte('enrolled_at', today),
        supabase.from('session_progress').select('*', { count: 'exact' }).eq('completed', true).gte('completed_at', today),
        supabase.from('course_reviews').select('rating')
      ]);

      // 평균 평점 계산
      const averageRating = ratingsResponse.data && ratingsResponse.data.length > 0
        ? Math.round(ratingsResponse.data.reduce((sum, review) => sum + (review.rating || 0), 0) / ratingsResponse.data.length * 10) / 10
        : 0;

      setStats({
        totalUsers: usersResponse.count || 0,
        totalCourses: coursesResponse.count || 0,
        publishedCourses: publishedCoursesResponse.count || 0,
        totalEnrollments: enrollmentsResponse.count || 0,
        totalRevenue: ordersResponse.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        averageRating,
        todayStats: {
          newUsers: newUsersResponse.count || 0,
          newEnrollments: newEnrollmentsResponse.count || 0,
          completedSessions: completedSessionsResponse.count || 0
        }
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "관리자 데이터를 불러올 수 없습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">운영 관리</h1>
            <p className="text-muted-foreground">플랫폼 운영 현황을 실시간으로 확인하세요</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">마지막 업데이트</p>
            <p className="text-sm font-medium">{new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="전체 회원"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="운영 중인 강의"
            value={stats.publishedCourses.toLocaleString()}
            icon={Eye}
            color="green"
          />
          <StatsCard
            title="총 수강 등록"
            value={stats.totalEnrollments.toLocaleString()}
            icon={BookOpen}
            color="orange"
          />
          <StatsCard
            title="누적 매출"
            value={`${(stats.totalRevenue / 10000).toFixed(0)}만원`}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* 오늘의 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="오늘 신규 가입"
            value={stats.todayStats.newUsers.toLocaleString()}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="오늘 신규 등록"
            value={stats.todayStats.newEnrollments.toLocaleString()}
            icon={Activity}
            color="green"
          />
          <StatsCard
            title="오늘 완료 세션"
            value={stats.todayStats.completedSessions.toLocaleString()}
            icon={BookOpen}
            color="orange"
          />
          <StatsCard
            title="평균 강의 평점"
            value={stats.averageRating > 0 ? `${stats.averageRating}★` : '-'}
            icon={Star}
            color="purple"
          />
        </div>

        {/* 전체 강의 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatsCard
            title="전체 강의 수"
            value={`${stats.totalCourses.toLocaleString()}개`}
            icon={BookOpen}
            color="blue"
          />
          <StatsCard
            title="미공개 강의"
            value={`${(stats.totalCourses - stats.publishedCourses).toLocaleString()}개`}
            icon={BookOpen}
            color="red"
          />
        </div>

        {/* 관리 도구 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Admin;