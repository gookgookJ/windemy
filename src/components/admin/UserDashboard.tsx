import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, Crown } from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  adminUsers: number;
  instructorUsers: number;
  studentUsers: number;
}

interface UserDashboardProps {
  stats: UserStats | null;
  loading?: boolean;
}

export const UserDashboard = ({ stats, loading }: UserDashboardProps) => {
  // Return loading state if stats is null or loading is true
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "전체 사용자",
      value: stats.totalUsers,
      icon: Users,
      description: "등록된 모든 사용자",
      color: "text-blue-600"
    },
    {
      title: "활성 사용자",
      value: stats.activeUsers,
      icon: UserCheck,
      description: "최근 30일 내 활동",
      color: "text-green-600"
    },
    {
      title: "비활성 사용자",
      value: stats.inactiveUsers,
      icon: UserX,
      description: "30일 이상 비활동",
      color: "text-orange-600"
    },
    {
      title: "관리자",
      value: stats.adminUsers,
      icon: Crown,
      description: "관리자 권한 사용자",
      color: "text-red-600"
    }
  ];

  const roleStats = [
    { label: "학생", value: stats.studentUsers, color: "bg-blue-500" },
    { label: "강사", value: stats.instructorUsers, color: "bg-green-500" },
    { label: "관리자", value: stats.adminUsers, color: "bg-red-500" }
  ];


  return (
    <div className="space-y-6">
      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted/50 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 역할별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>역할별 사용자 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleStats.map((role, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${role.color}`}></div>
                    <span className="font-medium">{role.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {((role.value / stats.totalUsers) * 100).toFixed(1)}%
                    </span>
                    <span className="font-semibold">{role.value}명</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 신규 가입 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>신규 가입 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">이번 달</span>
                <span className="text-lg font-semibold text-green-600">
                  +{stats.newUsersThisMonth}명
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  이번 달 신규 가입자
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};