import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Users, Edit } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { EnrollmentTable } from '@/components/admin/access-period/EnrollmentTable';
import { ExpiryEditModal } from '@/components/admin/access-period/ExpiryEditModal';
import { CourseFilter } from '@/components/admin/access-period/CourseFilter';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse.id);
      setSelectedEnrollments([]);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          access_duration_days,
          category_id,
          created_at,
          enrollments(count)
        `)
        .eq('is_published', true);

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply sorting
      switch (sortBy) {
        case 'title':
          query = query.order('title');
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('title');
      }

      const { data: coursesData, error } = await query;

      if (error) throw error;

      let coursesWithCount = coursesData?.map(course => ({
        ...course,
        total_students: course.enrollments?.[0]?.count || 0
      })) || [];

      // Apply sorting for student count
      if (sortBy === 'students_desc') {
        coursesWithCount.sort((a, b) => (b.total_students || 0) - (a.total_students || 0));
      } else if (sortBy === 'students_asc') {
        coursesWithCount.sort((a, b) => (a.total_students || 0) - (b.total_students || 0));
      }

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

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <CourseFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
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
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    총 {enrollments.length}명의 수강생이 있습니다
                    {selectedEnrollments.length > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        ({selectedEnrollments.length}명 선택됨)
                      </span>
                    )}
                  </p>
                </div>
                {selectedEnrollments.length > 0 && (
                  <Button onClick={handleBulkEditExpiry} className="gap-2">
                    <Edit className="h-4 w-4" />
                    <span>선택한 수강생 만료일 변경</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>수강생이 없습니다</p>
                </div>
              ) : (
                <EnrollmentTable
                  enrollments={enrollments}
                  selectedEnrollments={selectedEnrollments}
                  onSelectAll={handleSelectAll}
                  onSelectEnrollment={handleSelectEnrollment}
                  onEditExpiry={handleEditExpiry}
                  onDeleteEnrollment={(enrollment) => {
                    setSelectedEnrollment(enrollment);
                    setDeleteDialogOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}

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
