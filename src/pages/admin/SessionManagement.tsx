import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, MoreHorizontal, Play, Pause, Trash2, Plus, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CourseSession {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_free: boolean;
  is_preview: boolean;
  attachment_url?: string;
  attachment_name?: string;
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  const navigate = useNavigate();

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
    if (!confirm(`정말로 "${sessionTitle}" 세션을 삭제하시겠습니까?`)) {
      return;
    }

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

  const formatDuration = (minutes: number) => {
    if (!minutes) return '미설정';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">세션 관리</h1>
            <p className="text-muted-foreground">강의 세션의 영상, 자료, 접근 권한을 관리하세요</p>
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
                  <Label htmlFor="video_url">Vimeo 영상 URL</Label>
                  <Input
                    id="video_url"
                    value={newSession.video_url}
                    onChange={(e) => setNewSession({ ...newSession, video_url: e.target.value })}
                    placeholder="https://vimeo.com/123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">재생 시간 (분)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) || 0 })}
                    placeholder="60"
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

        {/* 필터 및 검색 */}
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

        {/* 세션 목록 테이블 */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl">세션 목록</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredSessions.length}개의 세션</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">세션명</TableHead>
                  <TableHead className="w-[20%]">강의</TableHead>
                  <TableHead className="w-[12%]">타입</TableHead>
                  <TableHead className="w-[10%]">재생시간</TableHead>
                  <TableHead className="w-[12%]">영상상태</TableHead>
                  <TableHead className="w-[16%] text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-base max-w-[250px] truncate" title={session.title}>
                        {session.title}
                      </div>
                      {session.description && (
                        <div className="text-sm text-muted-foreground mt-1 max-w-[250px] truncate">
                          {session.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {session.course?.title}
                      </div>
                      {session.section && (
                        <div className="text-xs text-muted-foreground">
                          섹션: {session.section.title}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {session.is_free && (
                          <Badge variant="secondary" className="text-xs">무료</Badge>
                        )}
                        {session.is_preview && (
                          <Badge variant="outline" className="text-xs">미리보기</Badge>
                        )}
                        {!session.is_free && !session.is_preview && (
                          <Badge variant="default" className="text-xs">프리미엄</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDuration(session.duration_minutes || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.video_url ? (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <Play className="h-3 w-3 mr-1" />
                          영상 있음
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Pause className="h-3 w-3 mr-1" />
                          영상 없음
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {session.video_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate(`/learn/${session.course?.id}?session=${session.id}`)}
                            className="h-8 px-3 hover-scale"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            재생
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover-scale">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-background border shadow-lg z-50">
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              자료 업로드
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteSession(session.id, session.title)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">검색 결과가 없습니다</p>
                  <p className="text-sm">다른 검색어를 입력하거나 필터를 조정해보세요</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SessionManagement;