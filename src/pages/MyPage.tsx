import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, Settings, User, Play, ChevronRight, Calendar, FileText, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Enrollment {
  id: string;
  progress: number;
  enrolled_at: string;
  completed_at?: string;
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
          completed_at,
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

      // 각 강의의 세션 진행률도 가져오기
      if (data && data.length > 0) {
        const courseIds = data.map(enrollment => enrollment.course.id);
        
        const { data: sessionProgressData } = await supabase
          .from('session_progress')
          .select(`
            session_id,
            completed,
            watched_duration_seconds,
            course_sessions!inner(course_id, title, duration_minutes)
          `)
          .eq('user_id', user?.id)
          .in('course_sessions.course_id', courseIds);

        console.log('Session progress:', sessionProgressData);
      }
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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">{profile?.full_name || '사용자'}</h2>
                    <p className="text-muted-foreground text-sm">
                      {profile?.role === 'student' ? '학생' : 
                       profile?.role === 'instructor' ? '강사' : 
                       profile?.role === 'admin' ? '관리자' : '사용자'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start text-left bg-primary/10 text-primary">
                      <BookOpen className="w-4 h-4 mr-3" />
                      내 강의실
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left" onClick={() => navigate('/purchase-history')}>
                      <CreditCard className="w-4 h-4 mr-3" />
                      구매 내역
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <Settings className="w-4 h-4 mr-3" />
                      관심 클래스
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <User className="w-4 h-4 mr-3" />
                      강의 상담
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      아너스 혜택
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <Award className="w-4 h-4 mr-3" />
                      수료증
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <Settings className="w-4 h-4 mr-3" />
                      후기 관리
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      구매 내역
                    </Button>
                    <div className="pt-4 border-t">
                      <Button variant="ghost" className="w-full justify-start text-left">
                        <Clock className="w-4 h-4 mr-3" />
                        1:1 문의
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-left">
                        <FileText className="w-4 h-4 mr-3" />
                        자주 묻는 질문
                      </Button>
                      <div className="pt-4 border-t">
                        <Button variant="ghost" className="w-full justify-start text-left">
                          <Settings className="w-4 h-4 mr-3" />
                          계정 관리
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-left">
                          <Settings className="w-4 h-4 mr-3" />
                          회원정보관리
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-left" onClick={handleSignOut}>
                          <Settings className="w-4 h-4 mr-3" />
                          로그아웃
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">강의</h1>
                <p className="text-muted-foreground">수강 중인 강의의 진도율을 한 눈에 확인해 보세요.</p>
              </div>

              <Tabs defaultValue="studying" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="studying">내 강의실</TabsTrigger>
                  <TabsTrigger value="completed">완료한 강의</TabsTrigger>
                  <TabsTrigger value="profile">프로필</TabsTrigger>
                </TabsList>

                <TabsContent value="studying" className="space-y-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-16">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">관심 클래스가 없습니다.</h3>
                      <Button onClick={() => navigate('/courses')} className="mt-4">
                        클래스 둘러보기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {enrollments.filter(e => e.progress < 100).map((enrollment) => (
                        <Card key={enrollment.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex gap-6 items-center">
                              <div className="relative w-64 h-36 bg-muted/20 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={enrollment.course.thumbnail_url || "/placeholder.svg"}
                                  alt={enrollment.course.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0 py-2">
                                <div className="space-y-3">
                                  <div>
                                    <Badge variant="outline" className="mb-3 text-xs">온라인 강의</Badge>
                                    <h3 className="text-xl font-bold mb-2 line-clamp-2 leading-snug">{enrollment.course.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      수강기간: {new Date(enrollment.enrolled_at).toLocaleDateString()} - 2025.01.21
                                    </p>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-medium">학습 진도</span>
                                      <span className="text-lg font-bold text-primary">{Math.round(enrollment.progress)}% 완료</span>
                                    </div>
                                    <div className="relative">
                                      <Progress value={enrollment.progress} className="h-3" />
                                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                        <span>시작</span>
                                        <span>완료</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-3 min-w-fit">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/learn/${enrollment.course.id}?from=mypage`)}
                                  className="px-4 py-2 h-9 text-sm whitespace-nowrap hover:bg-muted transition-colors duration-200"
                                >
                                  강의 자료
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/learn/${enrollment.course.id}?from=mypage`)}
                                  className="px-4 py-2 h-9 text-sm whitespace-nowrap transition-colors duration-200"
                                >
                                  학습하기
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-6">
                  <div className="space-y-4">
                    {enrollments.filter(e => e.progress >= 100).length === 0 ? (
                      <div className="text-center py-16">
                        <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">완료한 강의가 없습니다.</h3>
                        <p className="text-muted-foreground">강의를 완료하면 여기에 표시됩니다.</p>
                      </div>
                    ) : (
                      enrollments.filter(e => e.progress >= 100).map((enrollment) => (
                        <Card key={enrollment.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex gap-6 items-center">
                              <div className="relative w-56 h-32 bg-muted/20 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={enrollment.course.thumbnail_url || "/placeholder.svg"}
                                  alt={enrollment.course.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-green-600 text-white text-xs">완료</Badge>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 py-2">
                                <div className="space-y-2">
                                  <h3 className="text-xl font-bold line-clamp-2 leading-snug">{enrollment.course.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    강사: {enrollment.course.instructor?.full_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    완료일: {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : '완료됨'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-3 min-w-fit">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="px-4 py-2 h-9 text-sm whitespace-nowrap hover:bg-muted transition-colors duration-200"
                                >
                                  수료증
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/learn/${enrollment.course.id}?from=mypage`)} 
                                  className="px-4 py-2 h-9 text-sm whitespace-nowrap transition-colors duration-200"
                                >
                                  다시 보기
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>프로필 정보</CardTitle>
                      <CardDescription>개인 정보를 관리하세요</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">이름</label>
                          <p className="text-lg font-medium">{profile?.full_name || '설정되지 않음'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">이메일</label>
                          <p className="text-lg font-medium">{user?.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">전화번호</label>
                          <p className="text-lg font-medium">{profile?.phone || '설정되지 않음'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">계정 유형</label>
                          <p className="text-lg font-medium">
                            {profile?.role === 'student' ? '학생' : 
                             profile?.role === 'instructor' ? '강사' : 
                             profile?.role === 'admin' ? '관리자' : '사용자'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{enrollments.length}</div>
                          <div className="text-sm text-muted-foreground">학습등급</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{enrollments.length}</div>
                          <div className="text-sm text-muted-foreground">내 쿠폰</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{enrollments.filter(e => e.progress >= 100).length}</div>
                          <div className="text-sm text-muted-foreground">상품권</div>
                        </div>
                      </div>
                      
                      <div className="text-center pt-6 border-t">
                        <Button variant="outline" className="mr-3">
                          프로필 수정
                        </Button>
                        <Button variant="destructive" onClick={handleSignOut}>
                          로그아웃
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyPage;