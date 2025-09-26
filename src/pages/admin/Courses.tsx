import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, MoreHorizontal, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  price: number;
  is_published: boolean;
  total_students: number;
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
          level,
          created_at,
          instructor:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Override instructor name with data from instructors table (source of truth)
      const emails = Array.from(new Set((data || []).map((d: any) => d.instructor?.email).filter(Boolean)));
      let instructorsByEmail = new Map<string, string>();
      if (emails.length > 0) {
        const { data: insRows } = await supabase
          .from('instructors')
          .select('email, full_name')
          .in('email', emails as string[]);
        instructorsByEmail = new Map((insRows || []).map((r: any) => [r.email, r.full_name]));
      }

      const normalized = (data || []).map((d: any) => ({
        ...d,
        instructor: { full_name: instructorsByEmail.get(d.instructor?.email) || d.instructor?.full_name || '' }
      }));

      setCourses(normalized as any);
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
          <Button onClick={() => navigate('/admin/course-create')} className="hover-scale">
            <Plus className="h-4 w-4 mr-2" />
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

        {/* 강의 목록 테이블 */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">강의 목록</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{filteredCourses.length}개의 강의</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">강의명</TableHead>
                  <TableHead className="w-[18%]">강사</TableHead>
                  <TableHead className="w-[12%]">상태</TableHead>
                  <TableHead className="w-[10%]">레벨</TableHead>
                  <TableHead className="w-[12%]">생성일</TableHead>
                  <TableHead className="w-[13%] text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-base max-w-[280px] truncate" title={course.title}>
                        {course.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-muted-foreground">
                        {course.instructor?.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={course.is_published ? "default" : "secondary"}
                        className={`transition-all ${course.is_published ? 
                          "bg-primary text-primary-foreground" : 
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {course.is_published ? "공개" : "비공개"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelBadgeVariant(course.level)} className="text-xs">
                        {getLevelLabel(course.level)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(course.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(`/course/${course.id}`, '_blank')}
                          className="h-8 px-3 hover-scale"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          미리보기
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                          className="h-8 px-3 hover-scale"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          편집
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover-scale">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              onClick={() => toggleCoursePublication(course.id, course.is_published)}
                              className="cursor-pointer"
                            >
                              {course.is_published ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  비공개 전환
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  공개 전환
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteCourse(course.id, course.title)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">검색 결과가 없습니다</p>
                  <p className="text-sm">다른 검색어를 입력하거나 필터를 조정해보세요</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCourses;