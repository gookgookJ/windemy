import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { SessionTable } from '@/components/admin/SessionTable';
import { SessionEditModal } from '@/components/admin/SessionEditModal';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface GroupedCourse {
  courseId: string;
  courseTitle: string;
  sessions: CourseSession[];
  totalSessions: number;
  sessionsWithVideo: number;
}

export const SessionManagement = () => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  
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

  const handleBulkUpload = (courseId: string, courseTitle: string) => {
    // TODO: 강의별 일괄 업로드 모달 구현
    toast({
      title: "일괄 업로드",
      description: `${courseTitle} 강의의 일괄 업로드 기능을 준비 중입니다.`
    });
  };

  // Filtering logic
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || session.course?.id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  // Group sessions by course
  const groupedSessions = (): GroupedCourse[] => {
    const grouped = filteredSessions.reduce((acc, session) => {
      const courseId = session.course?.id;
      const courseTitle = session.course?.title;
      
      if (!courseId || !courseTitle) return acc;
      
      if (!acc[courseId]) {
        acc[courseId] = {
          courseId,
          courseTitle,
          sessions: [],
          totalSessions: 0,
          sessionsWithVideo: 0
        };
      }
      
      acc[courseId].sessions.push(session);
      acc[courseId].totalSessions++;
      if (session.video_url) {
        acc[courseId].sessionsWithVideo++;
      }
      
      return acc;
    }, {} as Record<string, GroupedCourse>);

    return Object.values(grouped).sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
  };

  // Pagination for list view
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
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
            >
              목록 보기
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              onClick={() => setViewMode('grouped')}
              size="sm"
            >
              강의별 보기
            </Button>
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
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {viewMode === 'list' ? (
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
        ) : (
          <div className="space-y-4">
            {groupedSessions().map((group) => (
              <Card key={group.courseId} className="animate-fade-in">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:rotate-90" />
                          <div>
                            <CardTitle className="text-lg">{group.courseTitle}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                총 {group.totalSessions}개 세션
                              </Badge>
                              <Badge 
                                variant={group.sessionsWithVideo === group.totalSessions ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                영상 {group.sessionsWithVideo}개
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkUpload(group.courseId, group.courseTitle);
                          }}
                          className="hover-scale"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          일괄 업로드
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-0">
                      <SessionTable
                        sessions={group.sessions}
                        currentPage={1}
                        totalPages={1}
                        itemsPerPage={group.sessions.length}
                        onPageChange={() => {}}
                        onEdit={handleEdit}
                        onDelete={deleteVideoFromSession}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            {groupedSessions().length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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