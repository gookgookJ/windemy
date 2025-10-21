import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, BookOpen } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { EnrollmentTable } from '@/components/admin/access-period/EnrollmentTable';
import { ExpiryEditModal } from '@/components/admin/access-period/ExpiryEditModal';
import { CourseListTable } from '@/components/admin/access-period/CourseListTable';
import { EnrollmentSearchFilter } from '@/components/admin/access-period/EnrollmentSearchFilter';

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
    phone: string | null;
  };
}

export default function AccessPeriodManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse.id);
      setSelectedEnrollments([]);
      setEnrollmentSearchQuery('');
      setCurrentPage(1);
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
          profiles!inner(full_name, email, phone)
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEnrollments(enrollments.map(e => e.id));
    } else {
      setSelectedEnrollments([]);
    }
  };

  const handleSelectEnrollment = (enrollmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedEnrollments(prev => [...prev, enrollmentId]);
    } else {
      setSelectedEnrollments(prev => prev.filter(id => id !== enrollmentId));
    }
  };

  const handleEditExpiry = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setBulkEditMode(false);
    setEditDialogOpen(true);
  };

  const handleBulkEditExpiry = () => {
    if (selectedEnrollments.length === 0) {
      toast({
        title: "알림",
        description: "수강생을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }
    setBulkEditMode(true);
    setEditDialogOpen(true);
  };

  const handleSaveExpiry = async (expiryDateTime: string | null) => {
    try {
      if (bulkEditMode) {
        // Bulk update
        const { error } = await supabase
          .from('enrollments')
          .update({ expires_at: expiryDateTime })
          .in('id', selectedEnrollments);

        if (error) throw error;

        toast({
          title: "성공",
          description: `${selectedEnrollments.length}명의 만료일이 변경되었습니다.`,
        });
        setSelectedEnrollments([]);
      } else if (selectedEnrollment) {
        // Single update
        const { error } = await supabase
          .from('enrollments')
          .update({ expires_at: expiryDateTime })
          .eq('id', selectedEnrollment.id);

        if (error) throw error;

        toast({
          title: "성공",
          description: "만료일이 변경되었습니다.",
        });
      }

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
      setSelectedEnrollments([]);
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

  // Filter and paginate enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      const searchLower = enrollmentSearchQuery.toLowerCase();
      return (
        enrollment.profiles.full_name.toLowerCase().includes(searchLower) ||
        enrollment.profiles.email.toLowerCase().includes(searchLower)
      );
    });
  }, [enrollments, enrollmentSearchQuery]);

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEnrollments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEnrollments, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [enrollmentSearchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">학습 기간 관리</h1>
          <p className="text-muted-foreground">강의별 수강생의 학습 기간을 관리합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 강의 목록 */}
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  강의 목록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseListTable
                  courses={courses}
                  selectedCourseId={selectedCourse?.id || null}
                  onSelectCourse={setSelectedCourse}
                />
              </CardContent>
            </Card>
          </div>

          {/* 우측: 수강생 목록 */}
          <div className="lg:col-span-7">{selectedCourse ? (

            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl">{selectedCourse.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {filteredEnrollments.length > 0 ? (
                        <>
                          총 {filteredEnrollments.length}명
                          {enrollmentSearchQuery && filteredEnrollments.length !== enrollments.length && (
                            <span> (전체: {enrollments.length}명)</span>
                          )}
                          {selectedEnrollments.length > 0 && (
                            <span className="ml-2 text-primary font-medium">
                              • {selectedEnrollments.length}명 선택됨
                            </span>
                          )}
                        </>
                      ) : (
                        '수강생이 없습니다'
                      )}
                    </p>
                  </div>
                  {selectedEnrollments.length > 0 && (
                    <Button onClick={handleBulkEditExpiry} size="sm" className="gap-2 shrink-0">
                      <Edit className="h-4 w-4" />
                      <span>일괄 변경</span>
                    </Button>
                  )}
                </div>
                {enrollments.length > 0 && (
                  <EnrollmentSearchFilter
                    searchQuery={enrollmentSearchQuery}
                    onSearchChange={setEnrollmentSearchQuery}
                  />
                )}
              </CardHeader>
              <CardContent className="p-6">
                {filteredEnrollments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>
                      {enrollmentSearchQuery 
                        ? '검색 결과가 없습니다.' 
                        : '수강생이 없습니다'}
                    </p>
                  </div>
                ) : (
                  <EnrollmentTable
                    enrollments={paginatedEnrollments}
                    selectedEnrollments={selectedEnrollments}
                    onSelectAll={handleSelectAll}
                    onSelectEnrollment={handleSelectEnrollment}
                    onEditExpiry={handleEditExpiry}
                    onDeleteEnrollment={(enrollment) => {
                      setSelectedEnrollment(enrollment);
                      setDeleteDialogOpen(true);
                    }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground space-y-3">
                  <BookOpen className="h-16 w-16 mx-auto opacity-20" />
                  <p className="text-lg">좌측에서 강의를 선택하세요</p>
                  <p className="text-sm">강의를 선택하면 수강생 목록이 표시됩니다</p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>

        <ExpiryEditModal
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          enrollment={selectedEnrollment}
          onSave={handleSaveExpiry}
          isBulk={bulkEditMode}
          selectedCount={selectedEnrollments.length}
        />

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
