import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Settings, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CoursePermissionModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
  category?: {
    name: string;
  } | null;
  hasAccess: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string | null;
  course: {
    title: string;
  };
}

export const CoursePermissionModal = ({ open, onClose, userId }: CoursePermissionModalProps) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCourses();
      if (userId) {
        fetchUserEnrollments();
      }
    }
  }, [open, userId]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          price,
          category:categories(name)
        `)
        .eq('is_published', true)
        .order('title');

      if (coursesData) {
        const coursesWithAccess = coursesData.map(course => ({
          ...course,
          hasAccess: false // Will be updated after fetching enrollments
        }));
        setCourses(coursesWithAccess);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserEnrollments = async () => {
    if (!userId) return;
    
    try {
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          enrolled_at,
          course:courses(title)
        `)
        .eq('user_id', userId);

      if (enrollmentData) {
        setEnrollments(enrollmentData);
        
        // Update courses to mark which ones user has access to
        setCourses(prevCourses => 
          prevCourses.map(course => ({
            ...course,
            hasAccess: enrollmentData.some(enrollment => enrollment.course_id === course.id)
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.category?.name && course.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCourseSelect = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses([...selectedCourses, courseId]);
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    }
  };

  const handlePermissionGrant = async () => {
    if (selectedCourses.length > 0 && userId) {
      setLoading(true);
      try {
        const enrollmentsToCreate = selectedCourses
          .filter(courseId => !enrollments.some(e => e.course_id === courseId))
          .map(courseId => ({
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString()
          }));

        if (enrollmentsToCreate.length > 0) {
          const { error } = await supabase
            .from('enrollments')
            .insert(enrollmentsToCreate);

          if (error) throw error;
        }

        toast({
          title: "권한이 부여되었습니다",
          description: `${selectedCourses.length}개 강의에 대한 권한이 설정되었습니다.`,
        });
        
        setSelectedCourses([]);
        await fetchUserEnrollments(); // Refresh enrollments
        onClose();
      } catch (error) {
        console.error('Error granting permissions:', error);
        toast({
          title: "권한 부여 실패",
          description: "권한을 부여하는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden flex flex-col bg-background">
        <DialogHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 pb-6 pt-6 px-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  강의 권한 관리
                </DialogTitle>
                {userId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    사용자별 맞춤 강의 권한을 설정하고 관리할 수 있습니다
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                선택 {selectedCourses.length}개
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-6 px-6">
          {/* 강의 검색 및 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">강의 권한 부여</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="강의명 또는 카테고리로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>강의명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>현재 상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={(checked) => handleCourseSelect(course.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.category?.name || '미분류'}</TableCell>
                      <TableCell>{course.price.toLocaleString()}원</TableCell>
                      <TableCell>
                        <Badge variant={course.hasAccess ? 'default' : 'secondary'}>
                          {course.hasAccess ? '권한 있음' : '권한 없음'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 권한 부여 액션 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center pt-4 border-t bg-muted/20 -mx-6 px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  {selectedCourses.length > 0 ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {selectedCourses.length}개 강의 선택됨
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      강의를 선택해주세요
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    취소
                  </Button>
                  <Button 
                    disabled={selectedCourses.length === 0 || loading || !userId}
                    onClick={handlePermissionGrant}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {loading ? '처리중...' : `권한 부여 (${selectedCourses.length}개)`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 현재 권한 내역 */}
          {enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  현재 권한 내역
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>강의명</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map(enrollment => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.course?.title}</TableCell>
                        <TableCell>
                          {enrollment.enrolled_at ? 
                            new Date(enrollment.enrolled_at).toLocaleDateString('ko-KR') : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">활성</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};