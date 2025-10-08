import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Mail, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  instructors: number;
  admins: number;
  marketingConsent: number;
  newUsersThisMonth: number;
}

export const UserSummaryDashboard = () => {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    instructors: 0,
    admins: 0,
    marketingConsent: 0,
    newUsersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // 전체 사용자 수
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 강사 수 (user_roles 테이블 사용)
      const { count: instructors } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor');

      // 관리자 수 (user_roles 테이블 사용)
      const { count: admins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // 마케팅 수신 동의 사용자 수
      const { count: marketingConsent } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('marketing_consent', true);

      // 이번 달 신규 가입자 수
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // 현재는 모든 사용자를 활성으로 간주
        instructors: instructors || 0,
        admins: admins || 0,
        marketingConsent: marketingConsent || 0,
        newUsersThisMonth: newUsersThisMonth || 0
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "전체 회원",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `+${stats.newUsersThisMonth} 이번 달`
    },
    {
      title: "활성 회원",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "정상 상태"
    },
    {
      title: "강사",
      value: stats.instructors,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "강의 진행 중"
    },
    {
      title: "마케팅 수신",
      value: stats.marketingConsent,
      icon: Mail,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: `${stats.totalUsers > 0 ? Math.round((stats.marketingConsent / stats.totalUsers) * 100) : 0}% 동의율`
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm border-border/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};