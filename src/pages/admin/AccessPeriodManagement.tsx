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
    if (!selectedEnrollment || !selectedCourse) return;

    try {
      setLoading(true);

      // 1. Get orders for this user
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', selectedEnrollment.user_id);

      if (ordersError) throw ordersError;

      // 2. Get and delete order_items related to this course
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('id, order_id')
          .eq('course_id', selectedCourse.id)
          .in('order_id', orderIds);

        if (orderItemsError) throw orderItemsError;

        // Delete order_items and check if we need to delete orders
        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            // Delete the order item
            await supabase
              .from('order_items')
              .delete()
              .eq('id', item.id);

            // Check if order has any other items
            const { data: remainingItems, error: remainingError } = await supabase
              .from('order_items')
              .select('id')
              .eq('order_id', item.order_id);

            if (remainingError) throw remainingError;

            // If no other items, delete related data and the order
            if (!remainingItems || remainingItems.length === 0) {
              // Delete user_coupons related to this order
              await supabase
                .from('user_coupons')
                .delete()
                .eq('order_id', item.order_id);

              // Delete points_transactions related to this order
              await supabase
                .from('points_transactions')
                .delete()
                .eq('order_id', item.order_id);

              // Delete the order
              await supabase
                .from('orders')
                .delete()
                .eq('id', item.order_id);
            }
          }
        }
      }

      // 3. Delete video-related data for this course
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('id')
        .eq('course_id', selectedCourse.id);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);

        await supabase
          .from('video_watch_segments')
          .delete()
          .eq('user_id', selectedEnrollment.user_id)
          .in('session_id', sessionIds);

        await supabase
          .from('video_seek_events')
          .delete()
          .eq('user_id', selectedEnrollment.user_id)
          .in('session_id', sessionIds);

        await supabase
          .from('video_checkpoints')
          .delete()
          .eq('user_id', selectedEnrollment.user_id)
          .in('session_id', sessionIds);

        await supabase
          .from('session_file_downloads')
          .delete()
          .eq('user_id', selectedEnrollment.user_id)
          .in('session_id', sessionIds);

        await supabase
          .from('session_progress')
          .delete()
          .eq('user_id', selectedEnrollment.user_id)
          .in('session_id', sessionIds);
      }

      // 4. Delete enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', selectedEnrollment.id);

      if (enrollmentError) throw enrollmentError;

      toast({
        title: "성공",
        description: "수강 정보, 주문 내역 및 모든 관련 데이터가 삭제되었습니다.",
      });

      setDeleteDialogOpen(false);
      fetchEnrollments(selectedCourse.id);
    } catch (error: any) {
      console.error('Error deleting enrollment:', error);
      toast({
        title: "오류",
        description: "수강 삭제에 실패했습니다: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">학습 기간 관리</h1>
          <p className="text-muted-foreground">강의별 수강생의 학습 기간을 관리합니다</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">강의 선택</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="강의명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCourse?.id === course.id 
                    ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                    : 'hover:scale-[1.01]'
                }`}
                onClick={() => setSelectedCourse(course)}
              >
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>수강생</span>
                      </div>
                      <span className="font-medium">{course.total_students}명</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>학습 기간</span>
                      </div>
                      <Badge variant={course.access_duration_days ? 'default' : 'secondary'}>
                        {course.access_duration_days 
                          ? `${course.access_duration_days}일` 
                          : '평생소장'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                총 {enrollments.length}명의 수강생이 있습니다
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>수강생이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">학생명</TableHead>
                        <TableHead className="w-[200px]">이메일</TableHead>
                        <TableHead className="w-[120px]">등록일</TableHead>
                        <TableHead className="w-[140px]">만료일</TableHead>
                        <TableHead className="w-[100px]">진도율</TableHead>
                        <TableHead className="w-[100px]">상태</TableHead>
                        <TableHead className="text-right w-[200px]">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment) => {
                        const expired = isExpired(enrollment.expires_at);
                        const enrolledDate = format(parseISO(enrollment.enrolled_at), 'yyyy-MM-dd');
                        
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.profiles.full_name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {enrollment.profiles.email}
                            </TableCell>
                            <TableCell className="text-sm">
                              {enrolledDate}
                            </TableCell>
                            <TableCell>
                              {enrollment.expires_at ? (
                                <span className={`text-sm ${expired ? 'text-destructive font-medium' : ''}`}>
                                  {format(parseISO(enrollment.expires_at), 'yyyy-MM-dd')}
                                </span>
                              ) : (
                                <Badge variant="secondary" className="font-normal">
                                  평생소장
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {Math.round(enrollment.progress)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {expired ? (
                                <Badge variant="destructive">만료</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500">수강중</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditExpiry(enrollment)}
                                  className="gap-2"
                                >
                                  <Calendar className="h-4 w-4" />
                                  <span>만료일 변경</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedEnrollment(enrollment);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>삭제</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
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
