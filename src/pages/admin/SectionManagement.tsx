import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Search, Upload, MoreHorizontal, File, Edit, Trash2, Plus } from 'lucide-react';
import { SectionUploadModal } from '@/components/admin/SectionUploadModal';

interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  attachment_url?: string;
  attachment_name?: string;
  course_id: string;
  course: {
    title: string;
    id: string;
  };
  sessions: {
    id: string;
    title: string;
  }[];
}

export const SectionManagement = () => {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<CourseSection | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .select(`
          *,
          course:courses(title, id),
          sessions:course_sessions(id, title)
        `)
        .order('course_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "오류",
        description: "섹션 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (section: CourseSection) => {
    setUploadingSection(section);
    setIsUploadModalOpen(true);
  };

  const removeAttachment = async (section: CourseSection) => {
    try {
      const { error } = await supabase
        .from('course_sections')
        .update({
          attachment_url: null,
          attachment_name: null
        })
        .eq('id', section.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "첨부파일이 삭제되었습니다."
      });

      fetchSections();
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast({
        title: "오류",
        description: "파일 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 검색 필터링
  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.course?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>섹션 데이터를 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">섹션 관리</h1>
            <p className="text-muted-foreground mt-2">
              강의 섹션별 자료 업로드 및 관리
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="섹션명 또는 강의명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 섹션 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>섹션 목록 ({filteredSections.length}개)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">섹션명</TableHead>
                    <TableHead className="w-[20%]">강의</TableHead>
                    <TableHead className="w-[15%]">세션 개수</TableHead>
                    <TableHead className="w-[20%]">첨부자료</TableHead>
                    <TableHead className="w-[20%] text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSections.map((section) => (
                    <TableRow key={section.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-base">
                            {section.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            순서: {section.order_index}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {section.course?.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {section.sessions?.length || 0}개
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {section.attachment_url && section.attachment_name ? (
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600 truncate max-w-[150px]" title={section.attachment_name}>
                              {section.attachment_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">자료 없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpload(section)}
                            className="h-8 px-3"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {section.attachment_url ? '자료 변경' : '자료 업로드'}
                          </Button>
                          
                          {section.attachment_url && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem 
                                  onClick={() => removeAttachment(section)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  자료 삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <File className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">섹션이 없습니다</p>
                    <p className="text-sm">먼저 강의를 생성하고 섹션을 추가해주세요</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 업로드 모달 */}
        <SectionUploadModal
          section={uploadingSection}
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadingSection(null);
          }}
          onUpdate={fetchSections}
        />
      </div>
    </AdminLayout>
  );
};

export default SectionManagement;