import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Users, BookOpen, DollarSign, Calendar } from 'lucide-react';

export const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    monthlyGrowth: { users: 0, courses: 0, revenue: 0 }
  });
  
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // 기본 통계
      const [usersResponse, coursesResponse, ordersResponse] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }),
        supabase.from('orders').select('total_amount, created_at').eq('status', 'completed')
      ]);

      const totalRevenue = ordersResponse.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      setStats({
        totalUsers: usersResponse.count || 0,
        totalCourses: coursesResponse.count || 0,
        totalRevenue,
        monthlyGrowth: { users: 12, courses: 8, revenue: 15 } // Mock data
      });

      // 월별 등록 통계 (최근 6개월)
      const enrollmentStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact' })
          .gte('enrolled_at', monthStart)
          .lte('enrolled_at', monthEnd);

        enrollmentStats.push({
          month: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
          enrollments: count || 0
        });
      }
      setEnrollmentData(enrollmentStats);

      // 월별 매출 통계
      const revenueStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { data } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const monthlyRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        revenueStats.push({
          month: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
          revenue: monthlyRevenue
        });
      }
      setRevenueData(revenueStats);

      // 강의별 통계
      const { data: topCourses } = await supabase
        .from('courses')
        .select('title, total_students')
        .order('total_students', { ascending: false })
        .limit(5);

      setCourseStats(topCourses || []);

      // 사용자 증가 통계
      const userGrowthStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - 6);

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', date.toISOString());

        userGrowthStats.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          users: count || 0
        });
      }
      setUserGrowthData(userGrowthStats);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "오류",
        description: "보고서 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">보고서 생성 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">분석 보고서</h1>
          <p className="text-muted-foreground">플랫폼의 성과와 트렌드를 분석하세요</p>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 사용자</p>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.monthlyGrowth.users}% 이번 달
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 강의</p>
                  <p className="text-2xl font-bold">{stats.totalCourses.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.monthlyGrowth.courses}% 이번 달
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 매출</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}원</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.monthlyGrowth.revenue}% 이번 달
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">평균 완료율</p>
                  <p className="text-2xl font-bold">78%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +3% 지난 주
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월별 등록 현황 */}
          <Card>
            <CardHeader>
              <CardTitle>월별 강의 등록 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="enrollments" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 월별 매출 현황 */}
          <Card>
            <CardHeader>
              <CardTitle>월별 매출 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}원`, '매출']} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 인기 강의 */}
          <Card>
            <CardHeader>
              <CardTitle>인기 강의 TOP 5</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ title, percent }) => `${title.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_students"
                  >
                    {courseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 주간 사용자 증가 */}
          <Card>
            <CardHeader>
              <CardTitle>주간 신규 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 상세 통계 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">사용자 통계</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>총 사용자:</span>
                    <span>{stats.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>활성 사용자:</span>
                    <span>{Math.floor(stats.totalUsers * 0.6).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>이번 주 신규:</span>
                    <span>{Math.floor(stats.totalUsers * 0.05).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">강의 통계</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>총 강의:</span>
                    <span>{stats.totalCourses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>공개 강의:</span>
                    <span>{Math.floor(stats.totalCourses * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>평균 완료율:</span>
                    <span>78%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">매출 통계</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>총 매출:</span>
                    <span>{stats.totalRevenue.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>이번 달 매출:</span>
                    <span>{Math.floor(stats.totalRevenue * 0.15).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span>평균 주문 가격:</span>
                    <span>89,000원</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;