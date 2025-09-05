import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, ShoppingCart, DollarSign, Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Course {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  total_students: number;
  instructor: {
    full_name: string;
  };
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const Admin = () => {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalCourses: 0, totalOrders: 0, totalRevenue: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      toast({
        title: "접근 권한 없음",
        description: "관리자 권한이 필요합니다.",
        variant: "destructive"
      });
      return;
    }
    fetchAdminData();
  }, [user, isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      // 통계 데이터
      const [usersResponse, coursesResponse, ordersResponse] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }),
        supabase.from('orders').select('total_amount').eq('status', 'completed')
      ]);

      setStats({
        totalUsers: usersResponse.count || 0,
        totalCourses: coursesResponse.count || 0,
        totalOrders: ordersResponse.data?.length || 0,
        totalRevenue: ordersResponse.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      });

      // 강의 목록
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          is_published,
          total_students,
          instructor:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setCourses(coursesData || []);

      // 사용자 목록
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setUsers(usersData || []);
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

  const toggleCoursePublication = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, is_published: !currentStatus }
          : course
      ));

      toast({
        title: "성공",
        description: `강의가 ${!currentStatus ? '공개' : '비공개'}되었습니다.`
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "오류",
        description: "강의 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">시스템 현황과 데이터를 관리하세요</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">총 사용자</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
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
                    <p className="text-2xl font-bold">{stats.totalCourses}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">총 주문</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">총 매출</p>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}원</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses">강의 관리</TabsTrigger>
              <TabsTrigger value="users">사용자 관리</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>강의 관리</CardTitle>
                  <CardDescription>등록된 강의들을 관리하고 공개/비공개 상태를 변경하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            강사: {course.instructor?.full_name} | 
                            학생 수: {course.total_students} | 
                            가격: {course.price.toLocaleString()}원
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.is_published ? "default" : "secondary"}>
                            {course.is_published ? "공개" : "비공개"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/course/${course.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCoursePublication(course.id, course.is_published)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>사용자 관리</CardTitle>
                  <CardDescription>등록된 사용자들의 정보를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.full_name || '이름 없음'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {user.email} | 
                            가입일: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          user.role === 'admin' ? "destructive" : 
                          user.role === 'instructor' ? "default" : 
                          "secondary"
                        }>
                          {user.role === 'admin' ? '관리자' : 
                           user.role === 'instructor' ? '강사' : '학생'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;