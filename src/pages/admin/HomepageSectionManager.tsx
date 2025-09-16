import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical, Eye, EyeOff, Target, Zap, Crown, Monitor, Star, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Course {
  id: string;
  title: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  instructor_name?: string;
  price: number;
  rating?: number;
  total_students?: number;
  is_hot?: boolean;
  is_new?: boolean;
}

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: string;
  icon_value: string;
  section_type: string;
  filter_type: string;
  filter_value?: string;
  display_limit: number;
  is_active: boolean;
}

interface SelectedCourse {
  id: string;
  course_id: string;
  order_index: number;
  course: Course;
}

const sectionConfig = {
  featured: {
    title: '지금 가장 주목받는 강의',
    subtitle: '인기와 신규 강의를 관리합니다',
    icon: Target,
    section_type: 'featured'
  },
  free: {
    title: '무료로 배우는 이커머스',
    subtitle: '무료 강의 섹션을 관리합니다',
    icon: Zap,
    section_type: 'free'
  },
  premium: {
    title: '프리미엄 강의',
    subtitle: '프리미엄 강의 섹션을 관리합니다',
    icon: Crown,
    section_type: 'premium'
  },
  vod: {
    title: 'VOD 강의',
    subtitle: 'VOD 강의 섹션을 관리합니다',
    icon: Monitor,
    section_type: 'vod'
  }
};

const HomepageSectionManager = () => {
  const { sectionType } = useParams<{ sectionType: string }>();
  const [section, setSection] = useState<HomepageSection | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);
  const [previewCurrentCourse, setPreviewCurrentCourse] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);

  const config = sectionConfig[sectionType as keyof typeof sectionConfig];

  useEffect(() => {
    if (config) {
      fetchSectionData();
      fetchAvailableCourses();
    }
  }, [sectionType]);

  // 미리보기 자동 슬라이드
  useEffect(() => {
    if (!isPreviewPlaying || selectedCourses.length === 0) return;
    
    const timer = setInterval(() => {
      setPreviewCurrentCourse((prev) => (prev + 1) % Math.min(selectedCourses.length, 4));
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedCourses.length, isPreviewPlaying]);

  useEffect(() => {
    if (config) {
      fetchSectionData();
      fetchAvailableCourses();
    }
  }, [sectionType]);

  const fetchSectionData = async () => {
    try {
      // Fetch existing section
      const { data: sectionData, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('section_type', config.section_type)
        .single();

      if (error) {
        console.error('Error fetching section:', error);
        toast({
          title: "오류",
          description: "섹션을 찾을 수 없습니다.",
          variant: "destructive"
        });
        return;
      }

      setSection(sectionData);

      // Fetch courses based on the section's filter_type
      let courses: SelectedCourse[] = [];
      
      if (sectionData.filter_type === 'manual') {
        // Fetch manually selected courses
        const { data: sectionCourses, error: coursesError } = await supabase
          .from('homepage_section_courses')
          .select(`
            *,
            course:courses(
              *,
              profiles:instructor_id(full_name)
            )
          `)
          .eq('section_id', sectionData.id)
          .order('order_index');

        if (coursesError) throw coursesError;

        courses = (sectionCourses || []).map((sc: any) => ({
          ...sc,
          course: {
            ...sc.course,
            instructor_name: sc.course?.profiles?.full_name || '운영진',
            thumbnail_url: sc.course?.thumbnail_url || sc.course?.thumbnail_path || '/placeholder.svg'
          }
        }));
      } else {
        // For other filter types, show current live courses for preview
        let liveCoursesData: any[] = [];
        
        if (sectionData.filter_type === 'category' && sectionData.filter_value) {
          const { data: categoryCourses } = await supabase
            .from('courses')
            .select(`
              *,
              profiles:instructor_id(full_name),
              categories:category_id(name)
            `)
            .eq('is_published', true)
            .eq('categories.name', sectionData.filter_value)
            .order('created_at', { ascending: false })
            .limit(sectionData.display_limit);
          
          liveCoursesData = categoryCourses || [];
        } else if (sectionData.filter_type === 'hot_new') {
          const { data: hotNewCourses } = await supabase
            .from('courses')
            .select(`
              *,
              profiles:instructor_id(full_name),
              categories:category_id(name)
            `)
            .eq('is_published', true)
            .or('is_hot.eq.true,is_new.eq.true')
            .order('created_at', { ascending: false })
            .limit(sectionData.display_limit);
          
          liveCoursesData = hotNewCourses || [];
        }
        
        // Convert to SelectedCourse format for display (but these are not actually selected)
        courses = liveCoursesData.map((course: any, index: number) => ({
          id: `preview-${course.id}`,
          course_id: course.id,
          order_index: index,
          course: {
            ...course,
            instructor_name: course.profiles?.full_name || '운영진',
            thumbnail_url: course.thumbnail_url || course.thumbnail_path || '/placeholder.svg'
          }
        }));
      }

      setSelectedCourses(courses);

    } catch (error) {
      console.error('Error fetching section data:', error);
      toast({
        title: "오류",
        description: "섹션 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:instructor_id(full_name)
        `)
        .eq('is_published', true)
        .order('title');

      if (error) throw error;

      const processedCourses = (data || []).map(course => ({
        ...course,
        instructor_name: course.profiles?.full_name || '운영진',
        thumbnail_url: course.thumbnail_url || course.thumbnail_path || '/placeholder.svg'
      }));

      setAvailableCourses(processedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const addCourse = async (course: Course) => {
    if (!section) return;

    try {
      const maxOrder = Math.max(...selectedCourses.map(sc => sc.order_index), -1);
      
      const { data, error } = await supabase
        .from('homepage_section_courses')
        .insert({
          section_id: section.id,
          course_id: course.id,
          order_index: maxOrder + 1
        })
        .select(`
          *,
          course:courses(
            *,
            profiles:instructor_id(full_name)
          )
        `)
        .single();

      if (error) throw error;

      const newSelectedCourse = {
        ...data,
        course: {
          ...data.course,
          instructor_name: data.course?.profiles?.full_name || '운영진',
          thumbnail_url: data.course?.thumbnail_url || data.course?.thumbnail_path || '/placeholder.svg'
        }
      };

      setSelectedCourses(prev => [...prev, newSelectedCourse]);
      
      toast({
        title: "성공",
        description: "강의가 추가되었습니다."
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "오류",
        description: "강의 추가에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const removeCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('homepage_section_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setSelectedCourses(prev => prev.filter(sc => sc.id !== courseId));
      
      toast({
        title: "성공",
        description: "강의가 제거되었습니다."
      });
    } catch (error) {
      console.error('Error removing course:', error);
      toast({
        title: "오류",
        description: "강의 제거에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateSectionStatus = async (isActive: boolean) => {
    if (!section) return;

    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ is_active: isActive })
        .eq('id', section.id);

      if (error) throw error;

      setSection(prev => prev ? { ...prev, is_active: isActive } : null);
      
      toast({
        title: "성공",
        description: `섹션이 ${isActive ? '활성화' : '비활성화'}되었습니다.`
      });
    } catch (error) {
      console.error('Error updating section status:', error);
      toast({
        title: "오류",
        description: "섹션 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const convertToManual = async () => {
    if (!section || section.filter_type === 'manual') return;

    try {
      // 1. Update section to manual filter
      const { error: sectionError } = await supabase
        .from('homepage_sections')
        .update({ 
          filter_type: 'manual',
          filter_value: null 
        })
        .eq('id', section.id);

      if (sectionError) throw sectionError;

      // 2. Save current courses as manual selections
      const coursesToSave = selectedCourses.map((course, index) => ({
        section_id: section.id,
        course_id: course.course_id,
        order_index: index
      }));

      if (coursesToSave.length > 0) {
        const { error: coursesError } = await supabase
          .from('homepage_section_courses')
          .insert(coursesToSave);

        if (coursesError) throw coursesError;
      }

      // 3. Update local state
      setSection(prev => prev ? { 
        ...prev, 
        filter_type: 'manual',
        filter_value: null 
      } : null);

      // 4. Update selected courses with proper IDs from database
      const { data: newCourses } = await supabase
        .from('homepage_section_courses')
        .select(`
          *,
          course:courses(
            *,
            profiles:instructor_id(full_name)
          )
        `)
        .eq('section_id', section.id)
        .order('order_index');

      if (newCourses) {
        const processedCourses = newCourses.map((sc: any) => ({
          ...sc,
          course: {
            ...sc.course,
            instructor_name: sc.course?.profiles?.full_name || '운영진',
            thumbnail_url: sc.course?.thumbnail_url || sc.course?.thumbnail_path || '/placeholder.svg'
          }
        }));
        setSelectedCourses(processedCourses);
      }

      toast({
        title: "성공",
        description: "수동 선택 모드로 전환되었습니다. 이제 강의를 직접 추가/제거할 수 있습니다."
      });
    } catch (error) {
      console.error('Error converting to manual:', error);
      toast({
        title: "오류",
        description: "수동 모드 전환에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedCourses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedCourses(items);

    // Update order in database
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('homepage_section_courses')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "오류",
        description: "순서 변경에 실패했습니다.",
        variant: "destructive"
      });
      // Revert on error
      fetchSectionData();
    }
  };

  if (!config) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">잘못된 섹션입니다</h1>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-medium text-muted-foreground">로딩중...</div>
        </div>
      </AdminLayout>
    );
  }

  const IconComponent = config.icon;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <IconComponent className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
                <p className="text-gray-600 mt-1">{config.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="section-active"
                  checked={section?.is_active || false}
                  onCheckedChange={updateSectionStatus}
                />
                <Label htmlFor="section-active" className="text-sm font-medium">
                  섹션 활성화
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">라이브 미리보기</h2>
              <Badge variant={section?.is_active ? "default" : "secondary"}>
                {section?.is_active ? "활성" : "비활성"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                disabled={selectedCourses.length === 0}
              >
                {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewCurrentCourse(Math.max(0, previewCurrentCourse - 1))}
                  disabled={previewCurrentCourse === 0 || selectedCourses.length === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewCurrentCourse(Math.min(Math.min(selectedCourses.length, 4) - 1, previewCurrentCourse + 1))}
                  disabled={previewCurrentCourse >= Math.min(selectedCourses.length, 4) - 1 || selectedCourses.length === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Filter Settings */}
          {section && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">현재 필터 설정</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-blue-700 border-blue-300">
                        {section.filter_type === 'manual' && '수동 선택'}
                        {section.filter_type === 'category' && `카테고리: ${section.filter_value}`}
                        {section.filter_type === 'hot_new' && '인기/신규 강의'}
                      </Badge>
                      <span className="text-sm text-blue-600">
                        최대 {section.display_limit}개 강의 표시
                      </span>
                    </div>
                  </div>
                </div>
                {section.filter_type !== 'manual' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={convertToManual}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    수동 선택으로 전환
                  </Button>
                )}
              </div>
              {section.filter_type !== 'manual' && (
                <p className="text-sm text-blue-600 mt-3">
                  현재 자동 필터링으로 강의가 표시되고 있습니다. 수동으로 강의를 선택하려면 "수동 선택으로 전환" 버튼을 클릭하세요.
                </p>
              )}
            </div>
          )}

          {/* Preview Content */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8 min-h-[300px]">
            {selectedCourses.length === 0 ? (
              <div className="text-center py-12">
                <IconComponent className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">섹션이 비어있습니다</h3>
                <p className="text-muted-foreground">
                  강의를 추가하면 메인 페이지에서 이렇게 표시됩니다
                </p>
              </div>
            ) : (
              <div>
                {/* Section Title */}
                <div className="flex items-center gap-3 mb-8">
                  <IconComponent className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {config.title}
                  </h2>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {selectedCourses.slice(0, 4).map((selectedCourse, index) => (
                    <div
                      key={selectedCourse.id}
                      className={`group cursor-pointer transform transition-all duration-300 ${
                        index === previewCurrentCourse ? 'scale-105 ring-2 ring-primary' : 'hover:scale-102'
                      }`}
                    >
                      <div className="relative mb-4">
                        <img
                          src={selectedCourse.course.thumbnail_url}
                          alt={selectedCourse.course.title}
                          className="w-full h-[159px] object-cover rounded-xl"
                          style={{ aspectRatio: "283/159" }}
                        />
                        
                        {/* Tags */}
                        <div className="absolute top-3 left-3 flex gap-1">
                          {selectedCourse.course.is_hot && (
                            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                              HOT
                            </span>
                          )}
                          {selectedCourse.course.is_new && (
                            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {selectedCourse.course.title}
                        </h3>
                        
                        {selectedCourse.course.instructor_name && 
                         selectedCourse.course.instructor_name !== "운영진" && 
                         selectedCourse.course.instructor_name !== "강사" && (
                          <div className="text-sm text-muted-foreground">
                            {selectedCourse.course.instructor_name}
                          </div>
                        )}

                        {selectedCourse.course.price !== undefined && (
                          <div className="text-sm font-semibold text-primary">
                            {selectedCourse.course.price.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCourses.length > 4 && (
                  <div className="text-center mt-6">
                    <p className="text-muted-foreground">
                      총 {selectedCourses.length}개 강의 중 4개 표시 (실제로는 더보기 버튼과 캐러셀로 표시됨)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Management Section */}
        {section?.filter_type === 'manual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Selected Courses */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span>선택된 강의</span>
                      <Badge variant="secondary">{selectedCourses.length}개</Badge>
                    </CardTitle>
                    <Button
                      onClick={() => setShowAvailable(!showAvailable)}
                      variant={showAvailable ? "default" : "outline"}
                    >
                      {showAvailable ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showAvailable ? '강의 목록 숨기기' : '강의 추가'}
                    </Button>
                  </div>
                </CardHeader>
              <CardContent>
                {selectedCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <IconComponent className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>선택된 강의가 없습니다.</p>
                    <p className="text-sm">강의 추가 버튼을 클릭하여 강의를 추가해보세요.</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="selected-courses">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {selectedCourses.map((selectedCourse, index) => (
                            <Draggable
                              key={selectedCourse.id}
                              draggableId={selectedCourse.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center p-4 border rounded-lg bg-white transition-all ${
                                    snapshot.isDragging ? 'shadow-lg rotate-1' : 'shadow-sm'
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mr-3 text-muted-foreground hover:text-foreground cursor-grab"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                      <img 
                                        src={selectedCourse.course.thumbnail_url} 
                                        alt={selectedCourse.course.title}
                                        className="w-20 h-14 object-cover rounded"
                                      />
                                      <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                                        {index + 1}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">{selectedCourse.course.title}</h4>
                                      <p className="text-xs text-muted-foreground mb-2">{selectedCourse.course.instructor_name}</p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-primary">{selectedCourse.course.price.toLocaleString()}원</span>
                                        {selectedCourse.course.is_hot && (
                                          <Badge variant="destructive" className="text-xs">HOT</Badge>
                                        )}
                                        {selectedCourse.course.is_new && (
                                          <Badge variant="default" className="text-xs">NEW</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeCourse(selectedCourse.id)}
                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Courses */}
          {showAvailable && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>강의 추가</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableCourses
                      .filter(course => !selectedCourses.some(sc => sc.course_id === course.id))
                      .map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center p-3 border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                          onClick={() => addCourse(course)}
                        >
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-14 h-10 object-cover rounded mr-3"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-muted-foreground">{course.instructor_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-medium text-primary">{course.price.toLocaleString()}원</p>
                              {course.is_hot && (
                                <Badge variant="destructive" className="text-xs">HOT</Badge>
                              )}
                              {course.is_new && (
                                <Badge variant="default" className="text-xs">NEW</Badge>
                              )}
                            </div>
                          </div>
                          
                          <Plus className="w-4 h-4 text-muted-foreground ml-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Stats */}
          {!showAvailable && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>섹션 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">선택된 강의</span>
                      <Badge variant="outline">{selectedCourses.length}개</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">섹션 상태</span>
                      <Badge variant={section?.is_active ? "default" : "secondary"}>
                        {section?.is_active ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">추가 가능</span>
                      <Badge variant="outline">
                        {availableCourses.filter(course => !selectedCourses.some(sc => sc.course_id === course.id)).length}개
                      </Badge>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        💡 드래그앤드롭으로 순서를 변경할 수 있습니다
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🎯 메인 페이지에서는 최대 8개 강의가 표시됩니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <IconComponent className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">자동 필터링 모드</h3>
            <p className="text-muted-foreground mb-4">
              현재 {section.filter_type === 'category' ? '카테고리' : '인기/신규'} 필터로 자동 관리되고 있습니다.
            </p>
            <Button onClick={convertToManual} variant="outline">
              수동 선택으로 전환
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HomepageSectionManager;