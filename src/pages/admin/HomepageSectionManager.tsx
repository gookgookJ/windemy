import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical, Eye, EyeOff, Target, Zap, Crown, Monitor, Star, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
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
  order_index: number;
  is_active: boolean;
  is_draft?: boolean;
  published_at?: string;
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

  const config = sectionConfig[sectionType as keyof typeof sectionConfig];

  useEffect(() => {
    if (config) {
      fetchSectionData();
      fetchAvailableCourses();

      // 실시간 업데이트 구독
      const channel = supabase
        .channel('homepage-section-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'homepage_section_courses'
          },
          (payload) => {
            // 현재 섹션과 관련된 변경사항만 처리
            const newSectionId = (payload.new as any)?.section_id;
            const oldSectionId = (payload.old as any)?.section_id;
            
            if (section?.id && (newSectionId === section.id || oldSectionId === section.id)) {
              // 데이터 새로고침
              setTimeout(() => {
                fetchSectionData();
              }, 500);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses'
          },
          () => {
            fetchAvailableCourses(); // 사용 가능한 강의 목록 새로고침
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sectionType, section?.id]);

  const fetchSectionData = async () => {
    try {
      // First try to fetch draft section for editing
      let { data: sectionData, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('section_type', config.section_type)
        .eq('is_draft', true)
        .maybeSingle();

      // If no draft exists, create one from published section or create new
      if (!sectionData) {
        const { data: publishedSection, error: publishedError } = await supabase
          .from('homepage_sections')
          .select('*')
          .eq('section_type', config.section_type)
          .eq('is_draft', false)
          .maybeSingle();

        if (publishedError) {
          console.error('Error fetching published section:', publishedError);
        }

        if (publishedSection) {
          // Create draft version from published
          const { data: newDraft, error: draftError } = await supabase
            .from('homepage_sections')
            .insert({
              title: publishedSection.title,
              subtitle: publishedSection.subtitle,
              icon_type: publishedSection.icon_type,
              icon_value: publishedSection.icon_value,
              section_type: publishedSection.section_type,
              filter_type: 'manual',
              filter_value: null,
              display_limit: publishedSection.display_limit,
              order_index: publishedSection.order_index,
              is_active: publishedSection.is_active,
              is_draft: true
            })
            .select()
            .single();

          if (draftError) {
            console.error('Error creating draft section:', draftError);
            toast({
              title: "오류",
              description: "드래프트 섹션 생성에 실패했습니다.",
              variant: "destructive"
            });
            return;
          }

          sectionData = newDraft;

          // Copy section courses to draft
          const { data: publishedCourses } = await supabase
            .from('homepage_section_courses')
            .select('*')
            .eq('section_id', publishedSection.id)
            .eq('is_draft', false);

          if (publishedCourses && publishedCourses.length > 0) {
            const draftCourses = publishedCourses.map(course => ({
              section_id: newDraft.id,
              course_id: course.course_id,
              order_index: course.order_index,
              is_draft: true
            }));

            await supabase
              .from('homepage_section_courses')
              .insert(draftCourses);
          }

        } else {
          // Create new section
          const { data: newSection, error: newSectionError } = await supabase
            .from('homepage_sections')
            .insert({
              title: config.title,
              subtitle: config.subtitle,
              icon_type: 'lucide',
              icon_value: config.icon.name,
              section_type: config.section_type,
              filter_type: 'manual',
              filter_value: null,
              display_limit: 15,
              order_index: 0,
              is_active: true,
              is_draft: true
            })
            .select()
            .single();

          if (newSectionError) {
            console.error('Error creating new section:', newSectionError);
            toast({
              title: "오류",
              description: "새 섹션 생성에 실패했습니다.",
              variant: "destructive"
            });
            return;
          }

          sectionData = newSection;
        }
      }

      if (error) {
        console.error('Error fetching draft section:', error);
        toast({
          title: "오류",
          description: "섹션을 찾을 수 없습니다.",
          variant: "destructive"
        });
        return;
      }

      setSection(sectionData);

      // Fetch manually selected courses for draft
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
        .eq('is_draft', true)
        .order('order_index');

      if (coursesError) throw coursesError;

      const courses = (sectionCourses || []).map((sc: any) => ({
        ...sc,
        course: {
          ...sc.course,
          instructor_name: sc.course?.profiles?.full_name || '운영진',
          thumbnail_url: sc.course?.thumbnail_url || sc.course?.thumbnail_path || '/placeholder.svg'
        }
      }));

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
      console.error('Error fetching available courses:', error);
      toast({
        title: "오류",
        description: "강의 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const addCourse = async (course: Course) => {
    if (!section) return;

    // Check if course is already selected
    if (selectedCourses.some(sc => sc.course_id === course.id)) {
      toast({
        title: "알림",
        description: "이미 추가된 강의입니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('homepage_section_courses')
        .insert({
          section_id: section.id,
          course_id: course.id,
          order_index: selectedCourses.length,
          is_draft: true
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
    if (!section) return;

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

  const publishSection = async () => {
    if (!section) return;

    try {
      // Check if published version exists
      const { data: publishedSection } = await supabase
        .from('homepage_sections')
        .select('id')
        .eq('section_type', section.section_type)
        .eq('is_draft', false)
        .maybeSingle();

      if (publishedSection) {
        // Update existing published section
        await supabase
          .from('homepage_sections')
          .update({
            title: section.title,
            subtitle: section.subtitle,
            icon_type: section.icon_type,
            icon_value: section.icon_value,
            filter_type: section.filter_type,
            filter_value: section.filter_value,
            display_limit: section.display_limit,
            order_index: section.order_index,
            is_active: section.is_active,
            published_at: new Date().toISOString()
          })
          .eq('id', publishedSection.id);

        // Delete existing published courses
        await supabase
          .from('homepage_section_courses')
          .delete()
          .eq('section_id', publishedSection.id)
          .eq('is_draft', false);

        // Copy draft courses to published
        const draftCourses = selectedCourses.map(course => ({
          section_id: publishedSection.id,
          course_id: course.course_id,
          order_index: course.order_index,
          is_draft: false
        }));

        if (draftCourses.length > 0) {
          await supabase
            .from('homepage_section_courses')
            .insert(draftCourses);
        }
      } else {
        // Create new published section
        const { data: newPublished, error: publishError } = await supabase
          .from('homepage_sections')
          .insert({
            title: section.title,
            subtitle: section.subtitle,
            icon_type: section.icon_type,
            icon_value: section.icon_value,
            section_type: section.section_type,
            filter_type: section.filter_type,
            filter_value: section.filter_value,
            display_limit: section.display_limit,
            order_index: section.order_index,
            is_active: section.is_active,
            is_draft: false,
            published_at: new Date().toISOString()
          })
          .select()
          .single();

        if (publishError) throw publishError;

        // Copy draft courses to published
        const draftCourses = selectedCourses.map(course => ({
          section_id: newPublished.id,
          course_id: course.course_id,
          order_index: course.order_index,
          is_draft: false
        }));

        if (draftCourses.length > 0) {
          await supabase
            .from('homepage_section_courses')
            .insert(draftCourses);
        }
      }

      toast({
        title: "성공",
        description: "섹션이 라이브에 적용되었습니다."
      });
    } catch (error) {
      console.error('Error publishing section:', error);
      toast({
        title: "오류",
        description: "섹션 적용에 실패했습니다.",
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
                  onCheckedChange={(checked) => {
                    setSection(prev => prev ? { ...prev, is_active: checked } : null);
                  }}
                />
                <Label htmlFor="section-active" className="flex items-center gap-2">
                  {section?.is_active ? (
                    <><Eye className="w-4 h-4" /> 활성화</>
                  ) : (
                    <><EyeOff className="w-4 h-4" /> 비활성화</>
                  )}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={publishSection}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  적용
                </Button>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">드래프트 강의</div>
              <div className="text-2xl font-bold text-gray-900">{selectedCourses.length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">표시 제한</div>
              <div className="text-2xl font-bold text-gray-900">{section?.display_limit || 15}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">총 수강생</div>
              <div className="text-2xl font-bold text-gray-900">{selectedCourses.reduce((sum, c) => sum + (c.course?.total_students || 0), 0)}</div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">실시간 미리보기</h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewCurrentCourse(Math.max(0, previewCurrentCourse - 4))}
                  disabled={previewCurrentCourse === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewCurrentCourse(Math.min(selectedCourses.length - 4, previewCurrentCourse + 4))}
                  disabled={previewCurrentCourse + 4 >= selectedCourses.length}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedCourses.slice(previewCurrentCourse, previewCurrentCourse + 4).map((course, index) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    <img
                      src={course.course.thumbnail_url || '/placeholder.svg'}
                      alt={course.course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium">
                      {previewCurrentCourse + index + 1}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm line-clamp-2 mb-2">{course.course.title}</h4>
                    <p className="text-xs text-gray-600">{course.course.instructor_name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Course Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selected Courses */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">선택된 강의 ({selectedCourses.length})</h2>
              <Button 
                onClick={() => setShowAvailable(!showAvailable)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                강의 추가
              </Button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="selected-courses">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3 rounded-lg p-2 min-h-[200px]"
                  >
                    {selectedCourses.map((course, index) => (
                      <Draggable 
                        key={course.id} 
                        draggableId={course.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 border rounded-lg bg-white ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            } transition-shadow`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="bg-primary text-white rounded px-2 py-1 text-xs font-medium min-w-[24px] text-center">
                              {index + 1}
                            </div>
                            <img
                              src={course.course.thumbnail_url || '/placeholder.svg'}
                              alt={course.course.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">{course.course.title}</h3>
                              <p className="text-xs text-gray-600">{course.course.instructor_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold">{course.course.price.toLocaleString()}원</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeCourse(course.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {selectedCourses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>선택된 강의가 없습니다.</p>
                        <p className="text-sm">강의 추가 버튼을 클릭하여 강의를 추가하세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Available Courses */}
          {showAvailable && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">사용 가능한 강의</h2>
                <Button 
                  onClick={() => setShowAvailable(false)}
                  size="sm"
                  variant="outline"
                >
                  닫기
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {availableCourses
                  .filter(course => !selectedCourses.some(sc => sc.course_id === course.id))
                  .map(course => (
                    <div key={course.id} className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                      <img
                        src={course.thumbnail_url || '/placeholder.svg'}
                        alt={course.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{course.title}</h3>
                        <p className="text-xs text-gray-600">{course.instructor_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold">{course.price.toLocaleString()}원</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addCourse(course)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomepageSectionManager;