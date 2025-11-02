import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';

interface PolicyDocument {
  id: string;
  document_type: 'terms' | 'privacy';
  section_id: string;
  title: string;
  content: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export default function PolicyManagement() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PolicyDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [formData, setFormData] = useState({
    document_type: 'terms' as 'terms' | 'privacy',
    section_id: '',
    title: '',
    content: '',
    is_active: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      toast.error('관리자 권한이 필요합니다.');
      return;
    }
    fetchPolicyDocuments();
  }, [user, isAdmin, navigate]);

  const fetchPolicyDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_documents')
        .select('*')
        .order('document_type', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPolicyDocuments((data || []) as PolicyDocument[]);
    } catch (error) {
      console.error('Error fetching policy documents:', error);
      toast.error('정책 문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('policy_documents')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('정책 문서가 수정되었습니다.');
      } else {
        const docs = policyDocuments.filter(d => d.document_type === formData.document_type);
        const maxOrder = docs.length > 0 ? Math.max(...docs.map(d => d.order_index)) : -1;
        const { error } = await supabase
          .from('policy_documents')
          .insert([{ ...formData, order_index: maxOrder + 1 }]);
        if (error) throw error;
        toast.success('정책 문서가 생성되었습니다.');
      }
      setIsModalOpen(false);
      resetForm();
      fetchPolicyDocuments();
    } catch (error) {
      console.error('Error saving policy document:', error);
      toast.error('정책 문서 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('policy_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('정책 문서가 삭제되었습니다.');
      fetchPolicyDocuments();
    } catch (error) {
      console.error('Error deleting policy document:', error);
      toast.error('정책 문서 삭제에 실패했습니다.');
    }
  };

  const handleEdit = (item: PolicyDocument) => {
    setEditingItem(item);
    setFormData({
      document_type: item.document_type,
      section_id: item.section_id,
      title: item.title,
      content: item.content,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      document_type: activeTab,
      section_id: '',
      title: '',
      content: '',
      is_active: true,
    });
    setEditingItem(null);
  };

  const termsDocuments = policyDocuments.filter(d => d.document_type === 'terms');
  const privacyDocuments = policyDocuments.filter(d => d.document_type === 'privacy');

  const renderDocumentTable = (documents: PolicyDocument[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>섹션 ID</TableHead>
          <TableHead>제목</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">작업</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </TableCell>
            <TableCell className="font-mono text-sm">{item.section_id}</TableCell>
            <TableCell className="font-medium">{item.title || <span className="text-muted-foreground italic">(제목 없음)</span>}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {item.is_active ? '활성' : '비활성'}
              </span>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">정책 문서 관리</h1>
        <Button onClick={() => { setFormData({ ...formData, document_type: activeTab }); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          신규 문서
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">로딩 중...</div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'terms' | 'privacy')}>
          <TabsList>
            <TabsTrigger value="terms">이용약관 ({termsDocuments.length})</TabsTrigger>
            <TabsTrigger value="privacy">개인정보처리방침 ({privacyDocuments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="terms">
            <Card>
              <CardHeader>
                <CardTitle>이용약관 문서</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDocumentTable(termsDocuments)}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>개인정보처리방침 문서</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDocumentTable(privacyDocuments)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '정책 문서 수정' : '새 정책 문서 생성'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">문서 유형</Label>
                <select
                  id="document_type"
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value as 'terms' | 'privacy' })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="terms">이용약관</option>
                  <option value="privacy">개인정보처리방침</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section_id">섹션 ID</Label>
                <Input
                  id="section_id"
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  placeholder="예: terms-1, privacy-intro"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목 (선택사항)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                placeholder="내용 (선택사항)"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">활성화</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                취소
              </Button>
              <Button type="submit">
                {editingItem ? '수정' : '생성'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}