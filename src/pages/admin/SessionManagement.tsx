import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { SessionTable } from '@/components/admin/SessionTable';
import { SessionEditModal } from '@/components/admin/SessionEditModal';
import { MaterialUploadModal } from '@/components/admin/MaterialUploadModal';

import { getVimeoVideoInfo, isValidVimeoUrl } from '@/utils/vimeoUtils';

interface CourseSession {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_free: boolean;
  is_preview: boolean;
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  const [loadingVideoInfo, setLoadingVideoInfo] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [managingSession, setManagingSession] = useState<CourseSession | null>(null);
  
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    course_id: '',
    section_id: '',
    is_free: false,
    is_preview: false
  });
  
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

  const createSession = async () => {
    if (!newSession.title || !newSession.course_id) {
      toast({
        title: "오류",
        description: "제목과 강의를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('course_sessions')
        .insert({
          title: newSession.title,
          description: newSession.description,
          video_url: newSession.video_url,
          duration_minutes: newSession.duration_minutes,
          course_id: newSession.course_id,
          section_id: newSession.section_id || null,
          is_free: newSession.is_free,
          is_preview: newSession.is_preview,
          order_index: sessions.length + 1
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "새 세션이 생성되었습니다."
      });

      setIsCreateModalOpen(false);
      resetNewSession();
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "오류",
        description: "세션 생성에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteSession = async (sessionId: string, sessionTitle: string) => {
    try {
      const { error } = await supabase
        .from('course_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(session => session.id !== sessionId));
      toast({
        title: "성공",
        description: "세션이 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "오류",
        description: "세션 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const resetNewSession = () => {
    setNewSession({
      title: '',
      description: '',
      video_url: '',
      duration_minutes: 0,
      course_id: '',
      section_id: '',
      is_free: false,
      is_preview: false
    });
  };

  const handleVideoUrlChange = async (url: string) => {
    setNewSession({ ...newSession, video_url: url });
    
    if (url && isValidVimeoUrl(url)) {
      setLoadingVideoInfo(true);
      try {
        const videoInfo = await getVimeoVideoInfo(url);
        if (videoInfo) {
          setNewSession(prev => ({
            ...prev,
            duration_minutes: videoInfo.duration,
            title: prev.title || videoInfo.title // 제목이 없을 때만 자동 설정
          }));
          toast({
            title: "영상 정보 가져오기 완료",
            description: `재생시간: ${videoInfo.duration}분`
          });
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        toast({
          title: "알림",
          description: "영상 정보를 가져올 수 없었습니다. 수동으로 입력해주세요.",
          variant: "default"
        });
      } finally {
        setLoadingVideoInfo(false);
      }
    }
  };

  const handleEdit = (session: CourseSession) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  const handleMaterialManage = (session: CourseSession) => {
    setManagingSession(session);
    setIsMaterialModalOpen(true);
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
                       (typeFilter === 'premium' && !session.is_free) ||
                       (typeFilter === 'preview' && session.is_preview);
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
            <h1 className="text-3xl font-bold text-foreground mb-2">세션 관리</h1>
            <p className="text-muted-foreground">
              강의 세션의 영상, 자료, 접근 권한을 관리하세요 ({filteredSessions.length}개)
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="hover-scale">
                <Plus className="h-4 w-4 mr-2" />
                새 세션 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 세션 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">세션 제목</Label>
                  <Input
                    id="title"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    placeholder="세션 제목을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="course">강의 선택</Label>
                  <Select value={newSession.course_id} onValueChange={(value) => setNewSession({ ...newSession, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="강의를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    placeholder="세션 설명을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="video_url">
                    Vimeo 영상 URL
                    {loadingVideoInfo && (
                      <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />
                    )}
                  </Label>
                  <Input
                    id="video_url"
                    value={newSession.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://vimeo.com/123456789"
                    disabled={loadingVideoInfo}
                  />
                  {loadingVideoInfo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      영상 정보를 가져오는 중...
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="duration">
                    재생 시간 (분)
                    {loadingVideoInfo && (
                      <span className="text-xs text-muted-foreground ml-2">(자동 설정됨)</span>
                    )}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) || 0 })}
                    placeholder="60"
                    disabled={loadingVideoInfo}
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSession.is_free}
                      onChange={(e) => setNewSession({ ...newSession, is_free: e.target.checked })}
                    />
                    <span>무료 세션</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSession.is_preview}
                      onChange={(e) => setNewSession({ ...newSession, is_preview: e.target.checked })}
                    />
                    <span>미리보기</span>
                  </label>
                </div>
                <Button onClick={createSession} className="w-full">
                  세션 생성
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  <SelectItem value="preview">미리보기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Session Table */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">세션 목록</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <SessionTable
              sessions={paginatedSessions}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onEdit={handleEdit}
              onDelete={deleteSession}
              onMaterialManage={handleMaterialManage}
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

        <MaterialUploadModal
          isOpen={isMaterialModalOpen}
          onClose={() => {
            setIsMaterialModalOpen(false);
            setManagingSession(null);
          }}
          onUpdate={fetchSessions}
          courseId={managingSession?.course?.id || ''}
          sessionId={managingSession?.id}
          existingMaterials={[]}
        />

      </div>
    </AdminLayout>
  );
};

export default SessionManagement;