import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Crown, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserSummaryStats {
  totalUsers: number;
  activeUsers: number;
  dormantUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalRevenue: number;
  averageRevenue: number;
}

interface UserSummaryDashboardProps {
  stats: UserSummaryStats | null;
  loading?: boolean;
}

export const UserSummaryDashboard = ({ stats, loading }: UserSummaryDashboardProps) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "전체 사용자",
      value: stats.totalUsers.toLocaleString(),
      subtitle: "총 가입 회원 수",
      icon: Users,
      trend: `+${stats.newUsersToday}명 (오늘)`
    },
    {
      title: "활성 사용자",
      value: stats.activeUsers.toLocaleString(),
      subtitle: "정상 상태 회원",
      icon: UserCheck,
      trend: `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`
    },
    {
      title: "휴면 사용자",
      value: stats.dormantUsers.toLocaleString(),
      subtitle: "장기 미접속 회원",
      icon: Clock,
      trend: `${((stats.dormantUsers / stats.totalUsers) * 100).toFixed(1)}%`
    },
    {
      title: "정지 사용자",
      value: stats.suspendedUsers.toLocaleString(),
      subtitle: "이용 제한 회원",
      icon: UserX,
      trend: `${((stats.suspendedUsers / stats.totalUsers) * 100).toFixed(1)}%`
    },
    {
      title: "이번 주 신규",
      value: stats.newUsersThisWeek.toLocaleString(),
      subtitle: "주간 신규 가입",
      icon: TrendingUp,
      trend: `일평균 ${Math.round(stats.newUsersThisWeek / 7)}명`
    },
    {
      title: "총 매출",
      value: `${(stats.totalRevenue / 100000000).toFixed(1)}억원`,
      subtitle: "누적 결제 금액",
      icon: Crown,
      trend: "전체 기간"
    },
    {
      title: "ARPU",
      value: `${stats.averageRevenue.toLocaleString()}원`,
      subtitle: "회원당 평균 매출",
      icon: TrendingUp,
      trend: "사용자별 평균"
    },
    {
      title: "오늘 신규",
      value: stats.newUsersToday.toLocaleString(),
      subtitle: "당일 신규 가입",
      icon: Users,
      trend: "24시간 기준"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">사용자 현황 요약</h2>
        <p className="text-sm text-muted-foreground">전체 회원의 상태와 주요 지표를 한눈에 확인하세요</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {card.subtitle}
                </p>
                <p className="text-xs text-primary font-medium">
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};