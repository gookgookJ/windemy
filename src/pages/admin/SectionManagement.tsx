import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Search, Upload, File, Eye, ChevronDown, ChevronRight, FolderOpen, X } from 'lucide-react';
import { MaterialUploadModal } from '@/components/admin/MaterialUploadModal';
import { MaterialViewModal } from '@/components/admin/MaterialViewModal';

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
  materials?: any[];
}

interface GroupedCourse {
  course_id: string;
  course_title: string;
  sections: CourseSection[];
  total_sections: number;
  sections_with_materials: number;
}

export const SectionManagement = () => {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<CourseSection | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState<CourseSection | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  
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
          sessions:course_sessions(id, title),
          materials:course_materials(id, title, file_name, file_type, order_index)
        `)
        .order('course_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      console.log('Admin sections data:', data);
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

  const handleViewMaterials = (section: CourseSection) => {
    setViewingSection(section);
    setIsViewModalOpen(true);
  };

  const toggleGroup = (courseId: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(courseId)) {
      newOpenGroups.delete(courseId);
    } else {
      newOpenGroups.add(courseId);
    }
    setOpenGroups(newOpenGroups);
  };

  // 검색 및 필터링 로직
  const filteredSections = sections.filter(section => {
    const matchesSearch = searchTerm === '' || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = courseFilter === 'all' || 
      section.course?.id === courseFilter;
    
    return matchesSearch && matchesCourse;
  });

  // 강의별 그룹화
  const groupedSections = (): GroupedCourse[] => {
    const courseMap = new Map<string, GroupedCourse>();
    
    filteredSections.forEach(section => {
      if (!section.course) return;
      
      const courseId = section.course.id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          course_id: courseId,
          course_title: section.course.title,
          sections: [],
          total_sections: 0,
          sections_with_materials: 0
        });
      }
      
      const group = courseMap.get(courseId)!;
      group.sections.push(section);
      group.total_sections++;
      if (section.materials && section.materials.length > 0) {
        group.sections_with_materials++;
      }
    });

    return Array.from(courseMap.values()).sort((a, b) => 
      a.course_title.localeCompare(b.course_title)
    );
  };

  // 고유한 강의 목록 추출
  const uniqueCourses = Array.from(
    new Map(sections.map(section => [section.course?.id, section.course]))
      .values()
  ).filter(course => course);

  const clearFilters = () => {
    setSearchTerm('');
    setCourseFilter('all');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>자료 데이터를 불러오는 중...</p>
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
            <h1 className="text-3xl font-bold">자료 관리</h1>
            <p className="text-muted-foreground mt-2">
              강의별 섹션 자료 업로드 및 관리
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="강의명, 섹션명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="min-w-[200px]">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="강의 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 강의</SelectItem>
                    {uniqueCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || courseFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  필터 초기화
                </Button>
              )}
            </div>
            
            {(searchTerm || courseFilter !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <span>활성 필터:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    검색어: "{searchTerm}"
                  </Badge>
                )}
                {courseFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    강의: "{uniqueCourses.find(c => c.id === courseFilter)?.title}"
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* 강의별 자료 관리 */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSections().map((courseGroup) => (
              <Card key={courseGroup.course_id} className="overflow-hidden">
                <Collapsible
                  open={openGroups.has(courseGroup.course_id)}
                  onOpenChange={() => toggleGroup(courseGroup.course_id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer transition-colors px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {openGroups.has(courseGroup.course_id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <FolderOpen className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="text-lg font-semibold">{courseGroup.course_title}</h3>
                            <p className="text-sm text-muted-foreground">
                              총 {courseGroup.total_sections}개 섹션 • 자료 업로드: {courseGroup.sections_with_materials}개
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="pointer-events-none">
                            {courseGroup.sections_with_materials}/{courseGroup.total_sections} 자료
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="p-0 border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%] pl-4">섹션명</TableHead>
                            <TableHead className="w-[25%]">첨부 자료</TableHead>
                            <TableHead className="w-[45%] text-right pr-4">자료 관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courseGroup.sections.map((section) => (
                            <TableRow key={section.id} className="transition-colors">
                              <TableCell className="pl-4">
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {section.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    순서: {section.order_index} • 세션: {section.sessions?.length || 0}개
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {section.materials && section.materials.length > 0 ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewMaterials(section)}
                                      className="h-auto p-2 text-left justify-start"
                                    >
                                      <div className="flex items-center gap-2">
                                        <File className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-600">
                                          {section.materials.length}개 자료
                                        </span>
                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <File className="h-4 w-4" />
                                      <span className="text-sm">자료 없음</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleUpload(section)}
                                  className="h-8 px-3"
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  자료 관리
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {groupedSections().length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">자료 관리할 강의가 없습니다</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || courseFilter !== 'all' 
                        ? '검색 조건에 맞는 강의를 찾을 수 없습니다.' 
                        : '먼저 강의를 생성하고 섹션을 추가해주세요.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 업로드 모달 */}
        <MaterialUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadingSection(null);
          }}
          onUpdate={fetchSections}
          courseId={uploadingSection?.course_id || ''}
          sectionId={uploadingSection?.id}
          existingMaterials={uploadingSection?.materials || []}
        />

        {/* 자료 보기 모달 */}
        <MaterialViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingSection(null);
          }}
          materials={viewingSection?.materials || []}
          sectionTitle={viewingSection?.title || ''}
        />
      </div>
    </AdminLayout>
  );
};

export default SectionManagement;