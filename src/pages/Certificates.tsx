import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Eye } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

interface CompletedCourse {
  id: string;
  completed_at: string;
  course: {
    id: string;
    title: string;
    thumbnail_url: string;
    instructor: {
      full_name: string;
    };
  };
}

const Certificates = () => {
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "수료증 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "완료한 강의의 수료증을 확인하고 다운로드하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCompletedCourses();
  }, [user, navigate]);

  const fetchCompletedCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          completed_at,
          course:courses(
            id,
            title,
            thumbnail_url,
            instructor:profiles(full_name)
          )
        `)
        .eq('user_id', user.id)
        .gte('progress', 100)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletedCourses(data || []);
    } catch (error) {
      console.error('Error fetching completed courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">수료증</h1>
                <p className="text-muted-foreground">완료한 강의의 수료증을 확인하고 다운로드하세요.</p>
              </div>

              {completedCourses.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">수료한 강의가 없습니다</h3>
                    <p className="text-muted-foreground mb-4">강의를 완료하면 수료증을 받을 수 있습니다.</p>
                    <Button onClick={() => navigate('/courses')}>
                      강의 둘러보기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {completedCourses.map((enrollment) => (
                    <Card key={enrollment.id} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-600 text-white">
                            <Award className="h-3 w-3 mr-1" />
                            수료 완료
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(enrollment.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex gap-4 mb-4">
                          <img
                            src={enrollment.course.thumbnail_url || '/placeholder.svg'}
                            alt={enrollment.course.title}
                            className="w-20 h-16 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-2 mb-1">
                              {enrollment.course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              강사: {enrollment.course.instructor?.full_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            미리보기
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Download className="h-4 w-4 mr-1" />
                            다운로드
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Certificates;