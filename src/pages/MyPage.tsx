import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, Settings, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Enrollment {
  id: string;
  progress: number;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    instructor: {
      full_name: string;
    };
  };
}

const MyPage = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchEnrollments();
  }, [user, navigate]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          course:courses(
            id,
            title,
            thumbnail_url,
            instructor:profiles(full_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">마이페이지</h1>
            <p className="text-muted-foreground">학습 현황과 프로필을 관리하세요</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{enrollments.length}</div>
                <div className="text-sm text-muted-foreground">수강 중인 강의</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">평균 진행률</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {enrollments.filter(e => e.progress >= 100).length}
                </div>
                <div className="text-sm text-muted-foreground">완료한 강의</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-sm font-semibold capitalize">
                  {profile?.role === 'student' ? '학생' : 
                   profile?.role === 'instructor' ? '강사' : 
                   profile?.role === 'admin' ? '관리자' : '사용자'}
                </div>
                <div className="text-sm text-muted-foreground">계정 유형</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses">내 강의</TabsTrigger>
              <TabsTrigger value="profile">프로필 설정</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>수강 중인 강의</CardTitle>
                  <CardDescription>
                    현재 수강 중인 강의들의 진행 상황을 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">수강 중인 강의가 없습니다</h3>
                      <p className="text-muted-foreground mb-4">새로운 강의를 시작해보세요</p>
                      <Button onClick={() => navigate('/courses')}>
                        강의 둘러보기
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="flex gap-4 p-4 border rounded-lg">
                          <img
                            src={enrollment.course.thumbnail_url || "/placeholder.svg"}
                            alt={enrollment.course.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{enrollment.course.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              강사: {enrollment.course.instructor?.full_name}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>진행률</span>
                                  <span>{Math.round(enrollment.progress)}%</span>
                                </div>
                                <Progress value={enrollment.progress} className="h-2" />
                              </div>
                              <Badge variant={enrollment.progress >= 100 ? "default" : "secondary"}>
                                {enrollment.progress >= 100 ? "완료" : "진행 중"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/course/${enrollment.course.id}`)}
                            variant="outline"
                          >
                            계속 보기
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 정보</CardTitle>
                  <CardDescription>
                    개인 정보를 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">이름</label>
                      <p className="text-lg">{profile?.full_name || '설정되지 않음'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">이메일</label>
                      <p className="text-lg">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">전화번호</label>
                      <p className="text-lg">{profile?.phone || '설정되지 않음'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">계정 유형</label>
                      <p className="text-lg capitalize">
                        {profile?.role === 'student' ? '학생' : 
                         profile?.role === 'instructor' ? '강사' : 
                         profile?.role === 'admin' ? '관리자' : '사용자'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="destructive" onClick={handleSignOut}>
                      로그아웃
                    </Button>
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

export default MyPage;