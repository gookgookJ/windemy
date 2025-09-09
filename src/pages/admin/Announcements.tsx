import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_published: boolean;
  target_audience: string;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
}

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'general',
    target_audience: 'all',
    is_published: false,
    expires_at: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "오류",
        description: "공지사항을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.content) {
        toast({
          title: "오류",
          description: "제목과 내용을 입력해주세요.",
          variant: "destructive"
        });
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('인증되지 않은 사용자');

      const { error } = await supabase
        .from('announcements')
        .insert({
          ...newAnnouncement,
          created_by: user.user.id,
          published_at: newAnnouncement.is_published ? new Date().toISOString() : null,
          expires_at: newAnnouncement.expires_at || null
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "공지사항이 생성되었습니다."
      });

      setNewAnnouncement({
        title: '',
        content: '',
        type: 'general',
        target_audience: 'all',
        is_published: false,
        expires_at: ''
      });
      setShowCreateForm(false);
      fetchAnnouncements();

    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "오류",
        description: "공지사항 생성에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          type: editingAnnouncement.type,
          target_audience: editingAnnouncement.target_audience,
          is_published: editingAnnouncement.is_published,
          expires_at: editingAnnouncement.expires_at,
          published_at: editingAnnouncement.is_published && !editingAnnouncement.published_at 
            ? new Date().toISOString() 
            : editingAnnouncement.published_at
        })
        .eq('id', editingAnnouncement.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "공지사항이 수정되었습니다."
      });

      setEditingAnnouncement(null);
      fetchAnnouncements();

    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: "오류",
        description: "공지사항 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "공지사항이 삭제되었습니다."
      });

      fetchAnnouncements();

    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "오류",
        description: "공지사항 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    const matchesAudience = audienceFilter === 'all' || announcement.target_audience === audienceFilter;
    return matchesSearch && matchesType && matchesAudience;
  });

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'urgent': return 'destructive';
      case 'maintenance': return 'secondary';
      case 'feature': return 'default';
      default: return 'outline';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent': return '긴급';
      case 'maintenance': return '점검';
      case 'feature': return '기능';
      case 'general': return '일반';
      default: return type;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'students': return '학생';
      case 'instructors': return '강사';
      case 'premium': return '프리미엄';
      case 'all': return '전체';
      default: return audience;
    }
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
            <h1 className="text-3xl font-bold text-foreground mb-2">공지사항 관리</h1>
            <p className="text-muted-foreground">사용자에게 전달할 공지사항을 관리하세요</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 공지사항
          </Button>
        </div>

        {/* 새 공지사항 생성 폼 */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>새 공지사항 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>제목</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="공지사항 제목"
                  />
                </div>
                <div>
                  <Label>유형</Label>
                  <Select 
                    value={newAnnouncement.type} 
                    onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                      <SelectItem value="maintenance">점검</SelectItem>
                      <SelectItem value="feature">기능</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>대상</Label>
                  <Select 
                    value={newAnnouncement.target_audience} 
                    onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, target_audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="students">학생</SelectItem>
                      <SelectItem value="instructors">강사</SelectItem>
                      <SelectItem value="premium">프리미엄</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>만료일</Label>
                  <Input
                    type="datetime-local"
                    value={newAnnouncement.expires_at}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>내용</Label>
                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAnnouncement.is_published}
                  onCheckedChange={(checked) => setNewAnnouncement(prev => ({ ...prev, is_published: checked }))}
                />
                <Label>즉시 공개</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={createAnnouncement}>생성</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 편집 폼 */}
        {editingAnnouncement && (
          <Card>
            <CardHeader>
              <CardTitle>공지사항 편집</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>제목</Label>
                  <Input
                    value={editingAnnouncement.title}
                    onChange={(e) => setEditingAnnouncement(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                    placeholder="공지사항 제목"
                  />
                </div>
                <div>
                  <Label>유형</Label>
                  <Select 
                    value={editingAnnouncement.type} 
                    onValueChange={(value) => setEditingAnnouncement(prev => prev ? ({ ...prev, type: value }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                      <SelectItem value="maintenance">점검</SelectItem>
                      <SelectItem value="feature">기능</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>내용</Label>
                <Textarea
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingAnnouncement.is_published}
                  onCheckedChange={(checked) => setEditingAnnouncement(prev => prev ? ({ ...prev, is_published: checked }) : null)}
                />
                <Label>공개</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={updateAnnouncement}>저장</Button>
                <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>취소</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 필터 및 검색 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="제목 또는 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 유형</SelectItem>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="maintenance">점검</SelectItem>
                  <SelectItem value="feature">기능</SelectItem>
                </SelectContent>
              </Select>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 대상</SelectItem>
                  <SelectItem value="students">학생</SelectItem>
                  <SelectItem value="instructors">강사</SelectItem>
                  <SelectItem value="premium">프리미엄</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 공지사항 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>공지사항 목록 ({filteredAnnouncements.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge variant={getTypeBadgeVariant(announcement.type)}>
                          {getTypeLabel(announcement.type)}
                        </Badge>
                        <Badge variant={announcement.is_published ? "default" : "secondary"}>
                          {announcement.is_published ? "공개" : "비공개"}
                        </Badge>
                        <Badge variant="outline">
                          {getAudienceLabel(announcement.target_audience)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        작성일: {new Date(announcement.created_at).toLocaleString()}
                        {announcement.expires_at && (
                          <span className="ml-4">
                            만료일: {new Date(announcement.expires_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAnnouncement(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAnnouncements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  검색 조건에 맞는 공지사항이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;