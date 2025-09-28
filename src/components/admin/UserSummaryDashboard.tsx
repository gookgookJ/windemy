import { Users, UserPlus, Activity, BookOpen, GraduationCap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalUsers: number;
  todayNewUsers: number;
  activeUsers: number;
  completionRate: number;
  avgLearningTime: number;
  expiringSoon: number;
}

const mockStats: DashboardStats = {
  totalUsers: 12548,
  todayNewUsers: 24,
  activeUsers: 8932,
  completionRate: 73.5,
  avgLearningTime: 3.2,
  expiringSoon: 156
};

export const UserSummaryDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 총 회원 수 */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">총 회원</CardTitle>
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{mockStats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">전체 가입 회원</p>
        </CardContent>
      </Card>

      {/* 오늘 신규 가입자 */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">오늘 신규</CardTitle>
          <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{mockStats.todayNewUsers}</div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">새로 가입한 회원</p>
        </CardContent>
      </Card>

      {/* 활성 사용자 */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">활성 회원</CardTitle>
          <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{mockStats.activeUsers.toLocaleString()}</div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">월간 학습 참여</p>
        </CardContent>
      </Card>

      {/* 강의 완주율 */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">완주율</CardTitle>
          <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{mockStats.completionRate}%</div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">평균 강의 완주율</p>
        </CardContent>
      </Card>

      {/* 평균 학습시간 */}
      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">학습시간</CardTitle>
          <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">{mockStats.avgLearningTime}h</div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">일평균 학습시간</p>
        </CardContent>
      </Card>

      {/* 만료 예정 */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">만료 예정</CardTitle>
          <BookOpen className="h-5 w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{mockStats.expiringSoon}</div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">7일 내 만료</p>
        </CardContent>
      </Card>
    </div>
  );
};