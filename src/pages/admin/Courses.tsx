import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Users, DollarSign, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  total_students: number;
  duration_hours: number;
  level: string;
  created_at: string;
  instructor: {
    full_name: string;
  };
}

export const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          is_published,
          total_students,
          duration_hours,
          level,
          created_at,
          instructor:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "오류",
        description: "강의 데이터를 불러오는데 실패했습니다.",
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

  const deleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`정말로 "${courseTitle}" 강의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(course => course.id !== courseId));

      toast({
        title: "성공",
        description: "강의가 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "오류",
        description: "강의 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && course.is_published) ||
                         (statusFilter === 'draft' && !course.is_published);
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'default';
      case 'intermediate':
        return 'secondary';
      case 'advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">강의 관리</h1>
            <p className="text-muted-foreground">등록된 강의들을 관리하고 승인/거부하세요</p>
          </div>
          <Button onClick={() => navigate('/admin/course-create')}>
            새 강의 만들기
          </Button>
        </div>

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="강의명 또는 강사명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="published">공개</SelectItem>
                  <SelectItem value="draft">비공개</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="레벨 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 레벨</SelectItem>
                  <SelectItem value="beginner">초급</SelectItem>
                  <SelectItem value="intermediate">중급</SelectItem>
                  <SelectItem value="advanced">고급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 강의 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>강의 목록 ({filteredCourses.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{course.title}</h3>
                        <Badge 
                          variant={course.is_published ? "default" : "secondary"}
                          className={course.is_published ? 
                            "bg-green-500 text-white hover:bg-green-600" : 
                            "bg-gray-400 text-white hover:bg-gray-500"
                          }
                        >
                          {course.is_published ? "🟢 공개중" : "🔒 비공개"}
                        </Badge>
                        <Badge variant={getLevelBadgeVariant(course.level)}>
                          {getLevelLabel(course.level)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium">강사: {course.instructor?.full_name}</span>
                        <span>생성일: {new Date(course.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{course.total_students}명 수강</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{course.price.toLocaleString()}원</span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{course.duration_hours}시간</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        미리보기
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        편집
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant={course.is_published ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleCoursePublication(course.id, course.is_published)}
                        className={course.is_published ? 
                          "bg-orange-500 text-white hover:bg-orange-600 border-0" : 
                          "bg-green-500 text-white hover:bg-green-600 border-0"
                        }
                      >
                        {course.is_published ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            비공개로 변경
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            공개로 변경
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCourse(course.id, course.title)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  검색 조건에 맞는 강의가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;