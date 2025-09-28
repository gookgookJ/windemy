import { Users, UserPlus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalUsers: number;
  todayNewUsers: number;
  activeUsers: number;
}

const mockStats: DashboardStats = {
  totalUsers: 12548,
  todayNewUsers: 24,
  activeUsers: 8932
};

export const UserSummaryDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 총 회원 수 */}
      <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-primary">총 회원 수</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground tracking-tight">{mockStats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-2">전체 가입 회원</p>
        </CardContent>
      </Card>

      {/* 오늘 신규 가입자 */}
      <Card className="bg-success/5 border-success/20 hover:bg-success/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-success">오늘 신규 가입</CardTitle>
          <UserPlus className="h-5 w-5 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground tracking-tight">{mockStats.todayNewUsers}</div>
          <p className="text-xs text-muted-foreground mt-2">새로 가입한 회원</p>
        </CardContent>
      </Card>

      {/* 활성 사용자 */}
      <Card className="bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-secondary">활성 회원</CardTitle>
          <Activity className="h-5 w-5 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground tracking-tight">{mockStats.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-2">이번 달 접속한 회원</p>
        </CardContent>
      </Card>
    </div>
  );
};