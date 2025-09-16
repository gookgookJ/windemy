import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical, Eye, EyeOff, Target, Zap, Crown, Monitor } from 'lucide-react';
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

  const config = sectionConfig[sectionType as keyof typeof sectionConfig];

  useEffect(() => {
    if (config) {
      fetchSectionData();
      fetchAvailableCourses();
    }
  }, [sectionType]);

  const fetchSectionData = async () => {
    try {
      // Fetch or create section
      let { data: sectionData, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('section_type', config.section_type)
        .single();

      if (error && error.code === 'PGRST116') {
        // Section doesn't exist, create it
        const { data: newSection, error: createError } = await supabase
          .from('homepage_sections')
          .insert({
            title: config.title,
            section_type: config.section_type,
            icon_type: 'lucide',
            icon_value: config.icon.name,
            filter_type: 'manual',
            display_limit: 8,
            order_index: 0,
            is_active: true
          })
          .select()
          .single();

        if (createError) throw createError;
        sectionData = newSection;
      } else if (error) {
        throw error;
      }

      setSection(sectionData);

      // Fetch selected courses for this section
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

      const processedCourses = (sectionCourses || []).map((sc: any) => ({
        ...sc,
        course: {
          ...sc.course,
          instructor_name: sc.course?.profiles?.full_name || '운영진',
          thumbnail_url: sc.course?.thumbnail_url || sc.course?.thumbnail_path || '/placeholder.svg'
        }
      }));

      setSelectedCourses(processedCourses);

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
              <Button
                onClick={() => setShowAvailable(!showAvailable)}
                variant={showAvailable ? "default" : "outline"}
              >
                {showAvailable ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showAvailable ? '강의 목록 숨기기' : '강의 추가'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selected Courses */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>선택된 강의</span>
                  <Badge variant="secondary">{selectedCourses.length}개</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <IconComponent className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>선택된 강의가 없습니다.</p>
                    <p className="text-sm">오른쪽에서 강의를 추가해보세요.</p>
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
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center p-4 border rounded-lg bg-white shadow-sm"
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mr-3 text-muted-foreground hover:text-foreground cursor-grab"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  
                                  <img 
                                    src={selectedCourse.course.thumbnail_url} 
                                    alt={selectedCourse.course.title}
                                    className="w-16 h-12 object-cover rounded mr-4"
                                  />
                                  
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{selectedCourse.course.title}</h4>
                                    <p className="text-xs text-muted-foreground">{selectedCourse.course.instructor_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-medium">{selectedCourse.course.price.toLocaleString()}원</span>
                                      {selectedCourse.course.is_hot && (
                                        <Badge variant="destructive" className="text-xs">HOT</Badge>
                                      )}
                                      {selectedCourse.course.is_new && (
                                        <Badge variant="default" className="text-xs">NEW</Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeCourse(selectedCourse.id)}
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
                          className="flex items-center p-3 border rounded-lg hover:border-primary/50 transition-colors"
                        >
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-12 h-8 object-cover rounded mr-3"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-muted-foreground">{course.instructor_name}</p>
                            <p className="text-xs font-medium">{course.price.toLocaleString()}원</p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addCourse(course)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview */}
          {!showAvailable && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>미리보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                      <h3 className="font-bold text-lg">{config.title}</h3>
                    </div>
                    
                    {selectedCourses.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        선택된 강의가 없어 섹션이 표시되지 않습니다.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedCourses.slice(0, 4).map((selectedCourse) => (
                          <div
                            key={selectedCourse.id}
                            className="border rounded-lg p-2 bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <img 
                                src={selectedCourse.course.thumbnail_url}
                                alt={selectedCourse.course.title}
                                className="w-12 h-8 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{selectedCourse.course.title}</p>
                                <p className="text-xs text-muted-foreground">{selectedCourse.course.instructor_name}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedCourses.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{selectedCourses.length - 4}개 더
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomepageSectionManager;