import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  content: string;
  section_id: string | null;
  order_index: number;
  is_published: boolean;
  version: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

const LegalDocumentManagement = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const [activeTab, setActiveTab] = useState('terms');
  const [formData, setFormData] = useState({
    document_type: 'terms',
    title: '',
    content: '',
    section_id: '',
    order_index: 0,
    is_published: true,
    version: '1.0'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('document_type')
        .order('order_index');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDocument) {
        const { error } = await supabase
          .from('legal_documents')
          .update(formData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast.success('문서가 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('legal_documents')
          .insert([formData]);

        if (error) throw error;
        toast.success('문서가 등록되었습니다.');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('문서 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('문서가 삭제되었습니다.');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? '비공개 처리되었습니다.' : '공개 처리되었습니다.');
      fetchDocuments();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      document_type: activeTab,
      title: '',
      content: '',
      section_id: '',
      order_index: 0,
      is_published: true,
      version: '1.0'
    });
    setEditingDocument(null);
  };

  const openEditDialog = (document: LegalDocument) => {
    setEditingDocument(document);
    setFormData({
      document_type: document.document_type,
      title: document.title,
      content: document.content,
      section_id: document.section_id || '',
      order_index: document.order_index,
      is_published: document.is_published,
      version: document.version
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData(prev => ({ ...prev, document_type: activeTab }));
    setIsDialogOpen(true);
  };

  const termsDocuments = documents.filter(doc => doc.document_type === 'terms');
  const privacyDocuments = documents.filter(doc => doc.document_type === 'privacy');

  const DocumentList = ({ docs }: { docs: LegalDocument[] }) => (
    <div className="space-y-4">
      {docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">등록된 문서가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        docs.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{doc.title}</CardTitle>
                    {doc.is_published ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    버전 {doc.version} | 시행일: {new Date(doc.effective_date).toLocaleDateString('ko-KR')}
                  </p>
                  {doc.section_id && (
                    <p className="text-xs text-muted-foreground">섹션 ID: {doc.section_id}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublish(doc.id, doc.is_published)}
                  >
                    {doc.is_published ? '비공개' : '공개'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(doc)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap line-clamp-3">{doc.content}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">약관 및 정책 관리</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              문서 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? '문서 수정' : '문서 등록'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="document_type">문서 유형</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terms">이용약관</SelectItem>
                    <SelectItem value="privacy">개인정보처리방침</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 제1조 (목적)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="section_id">섹션 ID (선택)</Label>
                <Input
                  id="section_id"
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  placeholder="예: terms-1"
                />
              </div>
              <div>
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="문서 내용을 입력하세요"
                  rows={15}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">버전</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="order_index">정렬 순서</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">즉시 공개</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingDocument ? '수정' : '등록'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terms">이용약관</TabsTrigger>
          <TabsTrigger value="privacy">개인정보처리방침</TabsTrigger>
        </TabsList>
        <TabsContent value="terms" className="mt-6">
          <DocumentList docs={termsDocuments} />
        </TabsContent>
        <TabsContent value="privacy" className="mt-6">
          <DocumentList docs={privacyDocuments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalDocumentManagement;
