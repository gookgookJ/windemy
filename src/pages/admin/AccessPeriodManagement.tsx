import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Calendar, Trash2, Clock, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AdminLayout } from '@/layouts/AdminLayout';

interface Course {
  id: string;
  title: string;
  access_duration_days: number | null;
  total_students?: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  expires_at: string | null;
  progress: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AccessPeriodManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          access_duration_days,
          enrollments(count)
        `)
        .eq('is_published', true)
        .order('title');

      if (error) throw error;

      const coursesWithCount = coursesData?.map(course => ({
        ...course,
        total_students: course.enrollments?.[0]?.count || 0
      })) || [];

      setCourses(coursesWithCount);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: "오류",
        description: "강의 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (courseId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          enrolled_at,
          expires_at,
          progress,
          profiles!inner(full_name, email)
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "오류",
        description: "수강생 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpiry = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setNewExpiryDate(enrollment.expires_at ? format(parseISO(enrollment.expires_at), 'yyyy-MM-dd') : '');
    setEditDialogOpen(true);
  };

  const handleSaveExpiry = async () => {
    if (!selectedEnrollment) return;

    try {
      const expiryValue = newExpiryDate ? new Date(newExpiryDate).toISOString() : null;
      
      const { error } = await supabase
        .from('enrollments')
        .update({ expires_at: expiryValue })
        .eq('id', selectedEnrollment.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "만료일이 변경되었습니다.",
      });

      setEditDialogOpen(false);
      if (selectedCourse) {
        fetchEnrollments(selectedCourse.id);
      }
    } catch (error: any) {
      console.error('Error updating expiry:', error);
      toast({
        title: "오류",
        description: "만료일 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', selectedEnrollment.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "수강 정보가 삭제되었습니다.",
      });

      setDeleteDialogOpen(false);
      if (selectedCourse) {
        fetchEnrollments(selectedCourse.id);
      }
    } catch (error: any) {
      console.error('Error deleting enrollment:', error);
      toast({
        title: "오류",
        description: "수강 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">학습 기간 관리</h1>
          <p className="text-muted-foreground mt-2">강의별 수강생의 학습 기간을 관리합니다</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>강의 목록</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="강의 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCourse?.id === course.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.total_students}명</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {course.access_duration_days 
                          ? `${course.access_duration_days}일` 
                          : '평생소장'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedCourse.title} - 수강생 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생명</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>결제일</TableHead>
                    <TableHead>만료일</TableHead>
                    <TableHead>진도율</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const expired = isExpired(enrollment.expires_at);
                    const paymentDate = format(parseISO(enrollment.enrolled_at), 'yyyy-MM-dd');
                    
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.profiles.full_name}</TableCell>
                        <TableCell>{enrollment.profiles.email}</TableCell>
                        <TableCell>{paymentDate}</TableCell>
                        <TableCell>
                          {enrollment.expires_at ? (
                            <span className={expired ? 'text-destructive' : ''}>
                              {format(parseISO(enrollment.expires_at), 'yyyy-MM-dd')}
                            </span>
                          ) : (
                            <Badge variant="secondary">평생소장</Badge>
                          )}
                        </TableCell>
                        <TableCell>{Math.round(enrollment.progress)}%</TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="destructive">만료</Badge>
                          ) : (
                            <Badge variant="default">수강중</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditExpiry(enrollment)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              만료일 변경
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Expiry Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>만료일 변경</DialogTitle>
              <DialogDescription>
                {selectedEnrollment?.profiles.full_name}님의 수강 만료일을 변경합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>만료일</Label>
                <Input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  비워두면 평생소장으로 설정됩니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveExpiry}>
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>수강 삭제 확인</DialogTitle>
              <DialogDescription>
                {selectedEnrollment?.profiles.full_name}님의 수강 정보를 삭제하시겠습니까?
                이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleDeleteEnrollment}>
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
