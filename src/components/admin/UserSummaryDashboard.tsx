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
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">총 회원 수</CardTitle>
          <Users className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">{mockStats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">전체 가입 회원</p>
        </CardContent>
      </Card>

      {/* 오늘 신규 가입자 */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">오늘 신규 가입</CardTitle>
          <UserPlus className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900">{mockStats.todayNewUsers}</div>
          <p className="text-xs text-green-600 mt-1">새로 가입한 회원</p>
        </CardContent>
      </Card>

      {/* 활성 사용자 */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">활성 회원</CardTitle>
          <Activity className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900">{mockStats.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-purple-600 mt-1">이번 달 접속한 회원</p>
        </CardContent>
      </Card>
    </div>
  );
};