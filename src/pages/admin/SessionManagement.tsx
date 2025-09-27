import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Upload, ChevronRight, Loader2, Save } from 'lucide-react';
import { SessionTable } from '@/components/admin/SessionTable';
import { SessionEditModal } from '@/components/admin/SessionEditModal';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getVimeoVideoInfo, isValidVimeoUrl } from '@/utils/vimeoUtils';

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

interface BulkUploadSession {
  id: string;
  title: string;
  video_url: string;
  original_video_url?: string;
}

export const SessionManagement = () => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  
  // Bulk upload modal states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadCourse, setBulkUploadCourse] = useState<GroupedCourse | null>(null);
  const [bulkUploadSessions, setBulkUploadSessions] = useState<BulkUploadSession[]>([]);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [videoInfoLoading, setVideoInfoLoading] = useState<string | null>(null);
  
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

  const handleBulkUpload = (group: GroupedCourse) => {
    setBulkUploadCourse(group);
    setBulkUploadSessions(
      group.sessions.map(session => ({
        id: session.id,
        title: session.title,
        video_url: session.video_url || '',
        original_video_url: session.video_url
      }))
    );
    setIsBulkUploadOpen(true);
  };

  const handleBulkVideoUrlChange = async (sessionId: string, url: string) => {
    setBulkUploadSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, video_url: url }
          : session
      )
    );

    // Auto-fetch video info if valid Vimeo URL
    if (url && isValidVimeoUrl(url)) {
      setVideoInfoLoading(sessionId);
      try {
        const videoInfo = await getVimeoVideoInfo(url);
        if (videoInfo) {
          toast({
            title: "영상 정보 확인됨",
            description: `${videoInfo.title} (${videoInfo.duration}분)`
          });
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
      } finally {
        setVideoInfoLoading(null);
      }
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkUploadCourse) return;

    setBulkUploadLoading(true);
    
    try {
      const updates = bulkUploadSessions
        .filter(session => session.video_url !== session.original_video_url)
        .map(session => ({
          id: session.id,
          video_url: session.video_url || null
        }));

      if (updates.length === 0) {
        toast({
          title: "알림",
          description: "변경된 영상이 없습니다."
        });
        setBulkUploadLoading(false);
        return;
      }

      // Update sessions one by one to ensure proper error handling
      let successCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        try {
          const { error } = await supabase
            .from('course_sessions')
            .update({ video_url: update.video_url })
            .eq('id', update.id);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error('Error updating session:', update.id, error);
          errorCount++;
        }
      }

      // Update local state
      setSessions(prev =>
        prev.map(session => {
          const updated = bulkUploadSessions.find(bulk => bulk.id === session.id);
          return updated
            ? { ...session, video_url: updated.video_url || undefined }
            : session;
        })
      );

      toast({
        title: "업로드 완료",
        description: `${successCount}개 영상이 업데이트되었습니다.${errorCount > 0 ? ` (실패: ${errorCount}개)` : ''}`
      });

      setIsBulkUploadOpen(false);
      setBulkUploadCourse(null);
      setBulkUploadSessions([]);

    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast({
        title: "오류",
        description: "일괄 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setBulkUploadLoading(false);
    }
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
            </div>
          </CardContent>
        </Card>

        {/* Grouped Sessions */}
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
                          handleBulkUpload(group);
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

        {/* Session Edit Modal */}
        <SessionEditModal
          session={editingSession}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSession(null);
          }}
          onUpdate={fetchSessions}
        />

        {/* Bulk Upload Modal */}
        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {bulkUploadCourse?.courseTitle} - 일괄 영상 업로드
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                각 세션에 Vimeo 영상 URL을 입력하세요. 빈 칸으로 두면 기존 영상이 유지됩니다.
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bulkUploadSessions.map((session, index) => (
                  <div key={session.id} className="grid grid-cols-5 gap-3 items-center p-3 border rounded-lg">
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">{session.title}</Label>
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="https://vimeo.com/123456789"
                        value={session.video_url}
                        onChange={(e) => handleBulkVideoUrlChange(session.id, e.target.value)}
                        disabled={bulkUploadLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex justify-center">
                      {videoInfoLoading === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : session.video_url && isValidVimeoUrl(session.video_url) ? (
                        <Badge variant="default" className="text-xs">유효</Badge>
                      ) : session.video_url ? (
                        <Badge variant="destructive" className="text-xs">오류</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">미입력</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleBulkUploadSubmit} 
                  disabled={bulkUploadLoading}
                  className="flex-1"
                >
                  {bulkUploadLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      일괄 업로드
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBulkUploadOpen(false)}
                  disabled={bulkUploadLoading}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default SessionManagement;