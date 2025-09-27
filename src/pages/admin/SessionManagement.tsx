import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter } from 'lucide-react';
import { SessionTable } from '@/components/admin/SessionTable';
import { SessionEditModal } from '@/components/admin/SessionEditModal';

interface CourseSession {
  id: string;
  title: string;
  video_url?: string;
  order_index: number;
  is_free: boolean;
  course: {
    title: string;
    id: string;
  };
  section: {
    title: string;
    id: string;
  };
  created_at: string;
}

export const SessionManagement = () => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchCourses();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select(`
          *,
          course:courses(title, id),
          section:course_sections(title, id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "오류",
        description: "세션 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const deleteVideoFromSession = async (sessionId: string, sessionTitle: string) => {
    try {
      const { error } = await supabase
        .from('course_sessions')
        .update({ video_url: null })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, video_url: undefined }
          : session
      ));
      toast({
        title: "성공",
        description: "영상이 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error removing video:', error);
      toast({
        title: "오류",
        description: "영상 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (session: CourseSession) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filtering logic
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || session.course?.id === courseFilter;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'free' && session.is_free) ||
                       (typeFilter === 'premium' && !session.is_free);
    return matchesSearch && matchesCourse && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">강의 영상 관리</h1>
            <p className="text-muted-foreground">
              강의 영상을 업로드하고 관리하세요 ({filteredSessions.length}개)
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="세션명 또는 강의명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="강의 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 강의</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="타입 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 타입</SelectItem>
                  <SelectItem value="free">무료</SelectItem>
                  <SelectItem value="premium">프리미엄</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Session Table */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">영상 목록</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SessionTable
              sessions={paginatedSessions}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={deleteVideoFromSession}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        <SessionEditModal
          session={editingSession}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSession(null);
          }}
          onUpdate={fetchSessions}
        />

      </div>
    </AdminLayout>
  );
};

export default SessionManagement;