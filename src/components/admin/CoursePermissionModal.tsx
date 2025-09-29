import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Plus, Calendar as CalendarIcon, Trash2, Settings, Users, Filter, Clock, CheckCircle, BookOpen, Crown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
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
      <DialogContent className="max-w-6xl h-[85vh] overflow-hidden flex flex-col bg-background">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="grid grid-cols-3 mb-4 bg-muted/30 flex-shrink-0 h-12">
            <TabsTrigger value="permissions" className="font-medium data-[state=active]:bg-background h-10 gap-2">
              <BookOpen className="h-4 w-4" />
              개별 권한 설정
            </TabsTrigger>
            <TabsTrigger value="groups" className="font-medium data-[state=active]:bg-background h-10 gap-2">
              <Users className="h-4 w-4" />
              그룹 관리
            </TabsTrigger>
            <TabsTrigger value="history" className="font-medium data-[state=active]:bg-background h-10 gap-2">
              <Clock className="h-4 w-4" />
              권한 내역
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-6">
            <TabsContent value="permissions" className="space-y-6 mt-0">
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
                    <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="그룹 기능 준비중" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">그룹 기능 준비중</SelectItem>
                      </SelectContent>
                    </Select>
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

              {/* 수강 기간 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">수강 기간 설정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">시작일</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'yyyy-MM-dd', { locale: ko }) : '시작일 선택'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">종료일</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'yyyy-MM-dd', { locale: ko }) : '종료일 선택'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t bg-muted/20 -mx-6 px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedCourses.length > 0 && startDate && endDate ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {selectedCourses.length}개 강의 • {format(startDate, 'yyyy-MM-dd')} ~ {format(endDate, 'yyyy-MM-dd')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          강의와 기간을 모두 선택해주세요
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
            </TabsContent>

            <TabsContent value="groups" className="space-y-6 mt-0">
              {/* 그룹 생성 폼 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">새 그룹 생성</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">그룹명</label>
                      <Input placeholder="예: 신규 VIP 회원" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">그룹 설명</label>
                      <Input placeholder="그룹 특징을 간단히 설명하세요" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">기본 제공 강의</label>
                    <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                      {courses.map(course => (
                        <div key={course.id} className="flex items-center space-x-2 py-1">
                          <Checkbox id={`group-course-${course.id}`} />
                          <label htmlFor={`group-course-${course.id}`} className="text-sm font-medium">
                            {course.title}
                          </label>
                          <Badge variant="outline" className="text-xs">{course.category?.name || '미분류'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">취소</Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      그룹 생성
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 기존 그룹 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">기존 그룹 관리</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>그룹명</TableHead>
                        <TableHead>회원수</TableHead>
                        <TableHead>포함된 강의</TableHead>
                        <TableHead>생성일</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[].map((group: any) => (
                        <TableRow key={group.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              {group.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-primary">{group.memberCount}</span>
                            <span className="text-muted-foreground">명</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {group.courses?.slice(0, 2).map((courseId: string) => (
                                  <Badge key={courseId} variant="outline" className="text-xs">
                                    {courses.find(c => c.id === courseId)?.title}
                                  </Badge>
                                ))}
                              {group.courses.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{group.courses.length - 2}개
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">2024-01-15</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" className="h-8 px-3">
                                회원 관리
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 px-3">
                                편집
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">현재 권한 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>강의명</TableHead>
                        <TableHead>시작일</TableHead>
                        <TableHead>종료일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map(enrollment => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.course?.title}</TableCell>
                          <TableCell>{enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), 'yyyy-MM-dd') : '-'}</TableCell>
                          <TableCell>무제한</TableCell>
                          <TableCell>
                            <Badge variant="default">활성</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" disabled>연장</Button>
                              <Button size="sm" variant="ghost" disabled>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};