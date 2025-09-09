import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { QuickActions } from '@/components/admin/QuickActions';
import { RecentActivity } from '@/components/admin/RecentActivity';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: string;
    courses: string; 
    revenue: string;
  };
  recentStats: {
    newUsersToday: number;
    activeLearners: number;
    completionRate: number;
  };
}

const Admin = () => {
  const [stats, setStats] = useState<AdminStats>({ 
    totalUsers: 0, 
    totalCourses: 0, 
    totalOrders: 0, 
    totalRevenue: 0,
    monthlyGrowth: { users: '+0%', courses: '+0%', revenue: '+0%' },
    recentStats: { newUsersToday: 0, activeLearners: 0, completionRate: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 기본 통계 데이터
      const [usersResponse, coursesResponse, ordersResponse] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }),
        supabase.from('orders').select('total_amount').eq('status', 'completed')
      ]);

      // 오늘 가입한 사용자 수
      const today = new Date().toISOString().split('T')[0];
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', today);

      // 활성 학습자 수 (최근 7일간 활동한 사용자)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: activeLearners } = await supabase
        .from('session_progress')
        .select('user_id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo);

      // 전체 완료율 계산
      const { data: totalSessions } = await supabase
        .from('session_progress')
        .select('completed', { count: 'exact' });
      
      const { count: completedSessions } = await supabase
        .from('session_progress')
        .select('*', { count: 'exact' })
        .eq('completed', true);

      const completionRate = totalSessions && totalSessions.length > 0 
        ? Math.round((completedSessions || 0) / totalSessions.length * 100)
        : 0;

      setStats({
        totalUsers: usersResponse.count || 0,
        totalCourses: coursesResponse.count || 0,
        totalOrders: ordersResponse.data?.length || 0,
        totalRevenue: ordersResponse.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
        monthlyGrowth: {
          users: '+12%', // Mock data - 실제로는 지난달과 비교 계산
          courses: '+8%',
          revenue: '+15%'
        },
        recentStats: {
          newUsersToday: newUsersToday || 0,
          activeLearners: activeLearners || 0,
          completionRate
        }
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "오류",
        description: "관리자 데이터를 불러오는데 실패했습니다.",
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">시스템 현황과 데이터를 한눈에 확인하세요</p>
        </div>

        {/* 메인 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="총 사용자"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={{ value: stats.monthlyGrowth.users, isPositive: true }}
            color="blue"
          />
          <StatsCard
            title="총 강의"
            value={stats.totalCourses.toLocaleString()}
            icon={BookOpen}
            trend={{ value: stats.monthlyGrowth.courses, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="완료된 주문"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            color="orange"
          />
          <StatsCard
            title="총 매출"
            value={`${stats.totalRevenue.toLocaleString()}원`}
            icon={DollarSign}
            trend={{ value: stats.monthlyGrowth.revenue, isPositive: true }}
            color="purple"
          />
        </div>

        {/* 추가 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="오늘 신규 가입"
            value={stats.recentStats.newUsersToday.toLocaleString()}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="활성 학습자"
            value={stats.recentStats.activeLearners.toLocaleString()}
            icon={Activity}
            color="green"
          />
          <StatsCard
            title="평균 완료율"
            value={`${stats.recentStats.completionRate}%`}
            icon={BookOpen}
            color="purple"
          />
        </div>

        {/* 빠른 액션 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Admin;