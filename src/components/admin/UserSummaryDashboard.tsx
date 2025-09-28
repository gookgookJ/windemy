import { Users, UserPlus, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalUsers: number;
  todayNewUsers: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  activeUsers: number;
  suspendedUsers: number;
}

const mockStats: DashboardStats = {
  totalUsers: 12548,
  todayNewUsers: 24,
  weeklyGrowth: 8.5,
  monthlyGrowth: 15.3,
  activeUsers: 8932,
  suspendedUsers: 12
};

export const UserSummaryDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 총 회원 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 회원 수</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">전체 가입 회원</p>
        </CardContent>
      </Card>

      {/* 오늘 신규 가입자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">오늘 신규 가입</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.todayNewUsers}</div>
          <p className="text-xs text-muted-foreground">신규 가입자</p>
        </CardContent>
      </Card>

      {/* 주간 성장률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">주간 성장률</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{mockStats.weeklyGrowth}%</div>
          <p className="text-xs text-muted-foreground">지난 주 대비</p>
        </CardContent>
      </Card>

      {/* 월간 성장률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">월간 성장률</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{mockStats.monthlyGrowth}%</div>
          <p className="text-xs text-muted-foreground">지난 달 대비</p>
        </CardContent>
      </Card>

      {/* 활성 사용자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">월간 활성 사용자</p>
        </CardContent>
      </Card>

      {/* 이용 정지 계정 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">이용 정지</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{mockStats.suspendedUsers}</div>
          <p className="text-xs text-muted-foreground">정지된 계정</p>
        </CardContent>
      </Card>
    </div>
  );
};