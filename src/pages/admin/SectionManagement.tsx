import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Search, Upload, File, Eye, ChevronRight, Filter, FolderOpen } from 'lucide-react';
import { MaterialUploadModal } from '@/components/admin/MaterialUploadModal';
import { MaterialViewModal } from '@/components/admin/MaterialViewModal';
import { BulkUploadModal } from '@/components/admin/BulkUploadModal';

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
  courseId: string;
  courseTitle: string;
  sections: CourseSection[];
  totalSections: number;
  sectionsWithMaterials: number;
}

export const SectionManagement = () => {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<CourseSection | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState<CourseSection | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadCourse, setBulkUploadCourse] = useState<GroupedCourse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
    fetchCourses();
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

  const handleUpload = (section: CourseSection) => {
    setUploadingSection(section);
    setIsUploadModalOpen(true);
  };

  const handleViewMaterials = (section: CourseSection) => {
    setViewingSection(section);
    setIsViewModalOpen(true);
  };

  const handleBulkUpload = (group: GroupedCourse) => {
    setBulkUploadCourse(group);
    setIsBulkUploadOpen(true);
  };

  // Filtering logic
  const filteredSections = sections.filter(section => {
    const matchesSearch = searchTerm === '' || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = courseFilter === 'all' || 
      section.course?.id === courseFilter;
    
    return matchesSearch && matchesCourse;
  });

  // Group sections by course
  const groupedSections = (): GroupedCourse[] => {
    const grouped = filteredSections.reduce((acc, section) => {
      const courseId = section.course?.id;
      const courseTitle = section.course?.title;
      
      if (!courseId || !courseTitle) return acc;
      
      if (!acc[courseId]) {
        acc[courseId] = {
          courseId,
          courseTitle,
          sections: [],
          totalSections: 0,
          sectionsWithMaterials: 0
        };
      }
      
      acc[courseId].sections.push(section);
      acc[courseId].totalSections++;
      if (section.materials && section.materials.length > 0) {
        acc[courseId].sectionsWithMaterials++;
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
            <h1 className="text-3xl font-bold text-foreground mb-2">강의 자료 관리</h1>
            <p className="text-muted-foreground">
              강의 자료를 업로드하고 관리하세요 ({filteredSections.length}개)
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
                  placeholder="섹션명 또는 강의명으로 검색..."
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

        {/* Grouped Sections */}
        <div className="space-y-3">
          {groupedSections().map((group) => (
            <Card key={group.courseId} className="animate-fade-in border-l-4 border-l-primary/20 shadow-sm">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="group cursor-pointer transition-all duration-200 rounded-t-lg py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                        <div>
                          <CardTitle className="text-lg font-semibold leading-tight">{group.courseTitle}</CardTitle>
                          <div className="flex gap-2 mt-1.5">
                            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 pointer-events-none">
                              총 {group.totalSections}개
                            </Badge>
                            <Badge 
                              className={`text-xs py-0.5 px-2 pointer-events-none border ${
                                group.sectionsWithMaterials === group.totalSections 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-orange-50 text-orange-700 border-orange-200"
                              }`}
                            >
                              자료 {group.sectionsWithMaterials}/{group.totalSections}
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
                        className="hover-scale bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 px-3 py-1.5"
                      >
                        <Upload className="h-4 w-4 mr-1.5" />
                        일괄 업로드
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-0 pt-0 border-t border-muted/30">
                    <div className="divide-y divide-muted/30">
                      {group.sections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{section.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">순서: {section.order_index}</span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">세션: {section.sessions?.length || 0}개</span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs">
                                    자료 {section.materials?.length || 0}개
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {section.materials && section.materials.length > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMaterials(section)}
                                className="text-xs h-8 px-3"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                자료 보기
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground px-3">자료 없음</div>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpload(section)}
                              className="text-xs h-8 px-3"
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              자료 관리
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
          {groupedSections().length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">자료 관리할 강의가 없습니다</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || courseFilter !== 'all' 
                    ? '검색 조건에 맞는 강의를 찾을 수 없습니다.' 
                    : '먼저 강의를 생성하고 섹션을 추가해주세요.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upload Modal */}
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

        {/* View Modal */}
        <MaterialViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingSection(null);
          }}
          materials={viewingSection?.materials || []}
          sectionTitle={viewingSection?.title || ''}
        />

        {/* Bulk Upload Modal */}
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => {
            setIsBulkUploadOpen(false);
            setBulkUploadCourse(null);
          }}
          onUpdate={fetchSections}
          sections={bulkUploadCourse?.sections || []}
          courseTitle={bulkUploadCourse?.courseTitle || ''}
        />
      </div>
    </AdminLayout>
  );
};

export default SectionManagement;