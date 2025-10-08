import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, FileImage, BookOpen, Video, DollarSign, FileText, Users, Settings, GripVertical, ArrowLeft } from 'lucide-react';
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AdminLayout } from "@/layouts/AdminLayout";

const AdminCourseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  interface Category {
    id: string;
    name: string;
  }

  interface Instructor {
    id: string;
    full_name: string;
    email: string;
  }

  interface CourseSession {
    title: string;
    order_index: number;
    is_free?: boolean;
    video_url?: string;
  }

  interface CourseSection {
    title: string;
    sessions: CourseSession[];
  }

  interface CourseOption {
    name: string;
    price: number;
    original_price?: number;
    benefits: string[];
    
  }

  interface CourseDetailImage {
    id?: string;
    image_url: string;
    image_name: string;
    section_title: string;
    order_index: number;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [course, setCourse] = useState({
    title: '',
    category_id: '',
    instructor_id: '',
    level: 'beginner',
    course_type: 'VOD',
    price: 0,
    what_you_will_learn: [''],
    
    sections: [] as CourseSection[],
    course_options: [] as CourseOption[],
    detail_images: [] as CourseDetailImage[],
    thumbnail_url: '',
    thumbnail_path: '',
    is_published: false,
    tags: [] as string[]
  });

  // 초기 데이터 로드
  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchCategories();
      fetchInstructors();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_options(*),
          course_sections(*, course_sessions(*)),
          course_detail_images(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform sections data
      const transformedSections: CourseSection[] = (data.course_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((section: any) => ({
          title: section.title,
          sessions: (section.course_sessions || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((session: any) => ({
              title: session.title,
              order_index: session.order_index,
              is_free: session.is_free || false,
              video_url: session.video_url || ''
            }))
        }));

      // Transform options data
      const transformedOptions: CourseOption[] = (data.course_options || []).map((option: any) => ({
        name: option.name,
        price: option.price,
        original_price: option.original_price,
        benefits: option.benefits || []
      }));

      // Transform detail images data
      const transformedImages: CourseDetailImage[] = (data.course_detail_images || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          image_name: img.image_name || 'Image',
          section_title: img.section_title || '',
          order_index: img.order_index || 0
        }));

      setCourse({
        title: data.title || '',
        category_id: data.category_id || '',
        instructor_id: data.instructor_id || '',
        level: data.level || 'beginner',
        course_type: data.course_type || 'VOD',
        price: data.price || 0,
        what_you_will_learn: data.what_you_will_learn || [''],
        
        sections: transformedSections,
        course_options: transformedOptions,
        detail_images: transformedImages,
        thumbnail_url: data.thumbnail_url || '',
        thumbnail_path: data.thumbnail_path || '',
        is_published: data.is_published || false,
        tags: data.tags || []
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "오류",
        description: "강의 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "카테고리를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const fetchInstructors = async () => {
    try {
      // Admin page: directly query instructors table
      const { data, error } = await supabase
        .from('instructors')
        .select('id, full_name, email')
        .order('full_name');
      
      if (error) throw error;
      setInstructors((data || []) as any);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "강사 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // 필수 필드 검증
      if (!course.instructor_id) {
        toast({
          title: "오류",
          description: "강사를 선택해주세요.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const courseData = {
        title: course.title,
        category_id: course.category_id,
        instructor_id: course.instructor_id,
        level: course.level,
        course_type: course.course_type,
        price: course.price,
        what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
        thumbnail_url: course.thumbnail_url,
        thumbnail_path: course.thumbnail_path,
        is_published: course.is_published,
        tags: course.tags || []
      };

      const { error: courseError } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id);

      if (courseError) throw courseError;

      // Delete existing sections and sessions
      const { error: deleteSessionsError } = await supabase
        .from('course_sessions')
        .delete()
        .eq('course_id', id);

      if (deleteSessionsError) throw deleteSessionsError;

      const { error: deleteSectionsError } = await supabase
        .from('course_sections')
        .delete()
        .eq('course_id', id);

      if (deleteSectionsError) throw deleteSectionsError;

      // Insert new sections
      if (course.sections.length > 0) {
        const sectionsData = course.sections.map((section, index) => ({
          course_id: id,
          title: section.title,
          order_index: index
        }));

        const { data: sectionsResult, error: sectionsError } = await supabase
          .from('course_sections')
          .insert(sectionsData)
          .select();

        if (sectionsError) throw sectionsError;

        // Insert sessions
        const allSessions: any[] = [];
        course.sections.forEach((section, sectionIndex) => {
          section.sessions.forEach((session, sessionIndex) => {
            allSessions.push({
              course_id: id,
              section_id: sectionsResult[sectionIndex].id,
              title: session.title,
              order_index: sessionIndex,
              is_free: session.is_free || false,
              video_url: session.video_url
            });
          });
        });

        if (allSessions.length > 0) {
          const { error: sessionsError } = await supabase
            .from('course_sessions')
            .insert(allSessions);

          if (sessionsError) throw sessionsError;
        }
      }

      // Update course options
      const { error: deleteOptionsError } = await supabase
        .from('course_options')
        .delete()
        .eq('course_id', id);

      if (deleteOptionsError) throw deleteOptionsError;

      if (course.course_options.length > 0) {
        const optionsData = course.course_options.map(option => ({
          course_id: id,
          name: option.name,
          price: option.price,
          original_price: option.original_price,
          benefits: option.benefits.filter(benefit => benefit.trim())
        }));

        const { error: optionsError } = await supabase
          .from('course_options')
          .insert(optionsData);

        if (optionsError) throw optionsError;
      }

      // Update detail images
      const { error: deleteImagesError } = await supabase
        .from('course_detail_images')
        .delete()
        .eq('course_id', id);

      if (deleteImagesError) throw deleteImagesError;

      if (course.detail_images.length > 0) {
        const detailImagesData = course.detail_images.map((image, index) => ({
          course_id: id,
          image_url: image.image_url,
          image_name: image.image_name,
          section_title: image.section_title,
          order_index: index
        }));

        const { error: detailImagesError } = await supabase
          .from('course_detail_images')
          .insert(detailImagesData);

        if (detailImagesError) throw detailImagesError;
      }

      toast({
        title: "성공",
        description: "강의가 성공적으로 수정되었습니다."
      });

      navigate('/admin/courses');

    } catch (error: any) {
      console.error('Failed to update course:', error);
      toast({
        title: "오류",
        description: error.message || "강의 수정에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstructorSelect = async (val: string) => {
    try {
      if (val.startsWith('email:')) {
        const email = val.slice(7);
        const target = instructors.find(i => i.email === email);
        const full_name = target?.full_name || email;
        const { data, error } = await supabase.functions.invoke('manage-instructor', {
          body: { email, full_name, role: 'instructor' },
        });
        if (error) throw error;
        const newId = (data as any)?.userId || (data as any)?.user_id || (data as any)?.id;
        if (newId) {
          setCourse(prev => ({ ...prev, instructor_id: newId }));
          await fetchInstructors();
        }
      } else {
        setCourse(prev => ({ ...prev, instructor_id: val }));
      }
    } catch (e: any) {
      console.error('Failed to set instructor:', e);
      toast({ title: '오류', description: '강사 선택에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 리스트 관리 함수들
  const addListItem = (field: 'what_you_will_learn') => {
    setCourse(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateListItem = (field: 'what_you_will_learn', index: number, value: string) => {
    setCourse(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field: 'what_you_will_learn', index: number) => {
    setCourse(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // 섹션 관리 함수들
  const addSection = () => {
    const newSection: CourseSection = {
      title: `섹션 ${course.sections.length + 1}`,
      sessions: []
    };
    setCourse(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (index: number, field: keyof CourseSection, value: any) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeSection = (index: number) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  // 세션 관리 함수들
  const addSession = (sectionIndex: number) => {
    const newSession: CourseSession = {
      title: '',
      order_index: course.sections[sectionIndex].sessions.length
    };
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, sessions: [...section.sessions, newSession] }
          : section
      )
    }));
  };

  const updateSession = (sectionIndex: number, sessionIndex: number, field: keyof CourseSession, value: any) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              sessions: section.sessions.map((session, j) =>
                j === sessionIndex ? { ...session, [field]: value } : session
              )
            }
          : section
      )
    }));
  };

  const removeSession = (sectionIndex: number, sessionIndex: number) => {
    setCourse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, sessions: section.sessions.filter((_, j) => j !== sessionIndex) }
          : section
      )
    }));
  };

  // 코스 옵션 관리 함수들
  const addCourseOption = () => {
    const newOption: CourseOption = {
      name: '',
      price: 0,
      benefits: ['']
    };
    setCourse(prev => ({
      ...prev,
      course_options: [...prev.course_options, newOption]
    }));
  };

  const updateCourseOption = (index: number, field: keyof CourseOption, value: any) => {
    setCourse(prev => ({
      ...prev,
      course_options: prev.course_options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeCourseOption = (index: number) => {
    setCourse(prev => ({
      ...prev,
      course_options: prev.course_options.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = (optionIndex: number) => {
    setCourse(prev => ({
      ...prev,
      course_options: prev.course_options.map((option, i) => 
        i === optionIndex 
          ? { ...option, benefits: [...option.benefits, ''] }
          : option
      )
    }));
  };

  const updateBenefit = (optionIndex: number, benefitIndex: number, value: string) => {
    setCourse(prev => ({
      ...prev,
      course_options: prev.course_options.map((option, i) => 
        i === optionIndex 
          ? {
              ...option,
              benefits: option.benefits.map((benefit, j) => 
                j === benefitIndex ? value : benefit
              )
            }
          : option
      )
    }));
  };

  const removeBenefit = (optionIndex: number, benefitIndex: number) => {
    setCourse(prev => ({
      ...prev,
      course_options: prev.course_options.map((option, i) => 
        i === optionIndex 
          ? { ...option, benefits: option.benefits.filter((_, j) => j !== benefitIndex) }
          : option
      )
    }));
  };

  // 상세 이미지 관리 함수들
  const addDetailImage = (imageUrl: string, imageName: string) => {
    const newImage: CourseDetailImage = {
      image_url: imageUrl,
      image_name: imageName,
      section_title: '',
      order_index: course.detail_images.length
    };
    setCourse(prev => ({
      ...prev,
      detail_images: [...prev.detail_images, newImage]
    }));
  };

  const removeDetailImage = (index: number) => {
    setCourse(prev => ({
      ...prev,
      detail_images: prev.detail_images.filter((_, i) => i !== index)
    }));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(course.detail_images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }));

    setCourse(prev => ({
      ...prev,
      detail_images: updatedItems
    }));
  };

  if (isLoading) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">강의 편집</h1>
              <p className="text-muted-foreground">기존 강의 내용을 수정합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? '저장 중...' : '수정 완료'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              기본 정보
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              학습 내용
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              판매 옵션
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              미디어
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>강의의 기본적인 정보를 입력해주세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">강의 제목 <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      value={course.title}
                      onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="강의 제목을 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">기본 가격 (원) <span className="text-red-500">*</span></Label>
                    <Input
                      id="price"
                      type="number"
                      value={course.price}
                      onChange={(e) => setCourse(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">카테고리 <span className="text-red-500">*</span></Label>
                    <Select value={course.category_id} onValueChange={(value) => setCourse(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">강사 선택 <span className="text-red-500">*</span></Label>
                    <Select value={course.instructor_id} onValueChange={handleInstructorSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="강사를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.full_name} ({instructor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="level">난이도</Label>
                    <Select value={course.level} onValueChange={(value) => setCourse(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="난이도를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">초급</SelectItem>
                        <SelectItem value="intermediate">중급</SelectItem>
                        <SelectItem value="advanced">고급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course_type">강의 타입</Label>
                    <Select value={course.course_type} onValueChange={(value) => setCourse(prev => ({ ...prev, course_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="강의 타입을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VOD">VOD</SelectItem>
                        <SelectItem value="오프라인">오프라인</SelectItem>
                        <SelectItem value="1:1 컨설팅">1:1 컨설팅</SelectItem>
                        <SelectItem value="챌린지·스터디">챌린지·스터디</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">프로모션 태그 (최대 3개)</Label>
                  <div className="flex flex-wrap gap-2">
                    {['신규', '인기', '30명한정', '얼리버드'].map((tag) => {
                      const isSelected = course.tags?.includes(tag) || false;
                      const canSelect = !isSelected && (course.tags?.length || 0) < 3;
                      
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // 선택 해제
                              setCourse(prev => ({
                                ...prev,
                                tags: prev.tags?.filter(t => t !== tag) || []
                              }));
                            } else if (canSelect) {
                              // 선택 추가
                              setCourse(prev => ({
                                ...prev,
                                tags: [...(prev.tags || []), tag]
                              }));
                            }
                          }}
                          disabled={!isSelected && !canSelect}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isSelected 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : canSelect
                              ? "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                              : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed",
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    선택된 태그: {course.tags?.length || 0}/3개
                    {course.level && (
                      <span className="ml-2 text-primary">
                        + 난이도 태그 ({course.level === 'beginner' ? 'Lv1' : course.level === 'intermediate' ? 'Lv2' : 'Lv3'})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={course.is_published}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="published">강의 공개</Label>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* What You Will Learn */}
            <Card>
              <CardHeader>
                <CardTitle>이 강의에서 배울 내용</CardTitle>
                <CardDescription>수강생이 이 강의를 통해 얻을 수 있는 지식이나 기술을 입력해주세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.what_you_will_learn.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateListItem('what_you_will_learn', index, e.target.value)}
                      placeholder="배울 내용을 입력하세요"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeListItem('what_you_will_learn', index)}
                      disabled={course.what_you_will_learn.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addListItem('what_you_will_learn')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  항목 추가
                </Button>
              </CardContent>
            </Card>


            {/* Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle>커리큘럼</CardTitle>
                <CardDescription>강의의 섹션과 세션을 구성해주세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                        placeholder="섹션 제목을 입력하세요"
                        className="font-medium"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSection(sectionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="ml-4 space-y-2">
                      {section.sessions.map((session, sessionIndex) => (
                        <div key={sessionIndex} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Input
                            value={session.title}
                            onChange={(e) => updateSession(sectionIndex, sessionIndex, 'title', e.target.value)}
                            placeholder="세션 제목을 입력하세요"
                            className="flex-1"
                          />
                          <Input
                            value={session.video_url || ''}
                            onChange={(e) => updateSession(sectionIndex, sessionIndex, 'video_url', e.target.value)}
                            placeholder="비디오 URL"
                            className="flex-1"
                          />
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={session.is_free || false}
                              onCheckedChange={(checked) => updateSession(sectionIndex, sessionIndex, 'is_free', checked)}
                            />
                            <Label className="text-sm">무료</Label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSession(sectionIndex, sessionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSession(sectionIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        세션 추가
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addSection}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  섹션 추가
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Options Tab */}
          <TabsContent value="options" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>판매 옵션</CardTitle>
                <CardDescription>다양한 가격대의 강의 옵션을 설정할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.course_options.map((option, optionIndex) => (
                  <div key={optionIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={option.name}
                        onChange={(e) => updateCourseOption(optionIndex, 'name', e.target.value)}
                        placeholder="옵션 이름 (예: 기본, 프리미엄)"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeCourseOption(optionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>판매 가격 (원)</Label>
                        <Input
                          type="number"
                          value={option.price}
                          onChange={(e) => updateCourseOption(optionIndex, 'price', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>정가 (원, 선택사항)</Label>
                        <Input
                          type="number"
                          value={option.original_price || ''}
                          onChange={(e) => updateCourseOption(optionIndex, 'original_price', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="정가를 입력하면 할인율이 표시됩니다"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>포함된 혜택</Label>
                      {(option.benefits || []).map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2">
                          <Input
                            value={benefit}
                            onChange={(e) => updateBenefit(optionIndex, benefitIndex, e.target.value)}
                            placeholder="혜택을 입력하세요"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBenefit(optionIndex, benefitIndex)}
                            disabled={option.benefits.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBenefit(optionIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        혜택 추가
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addCourseOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  판매 옵션 추가
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            {/* Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>썸네일 이미지</CardTitle>
                <CardDescription>강의 목록에 표시될 썸네일 이미지를 업로드해주세요.</CardDescription>
              </CardHeader>
              <CardContent>
                {course.thumbnail_url && (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <img 
                        src={course.thumbnail_url} 
                        alt="썸네일" 
                        className="w-48 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => setCourse(prev => ({ ...prev, thumbnail_url: '', thumbnail_path: '' }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <FileUpload
                  bucket="course-thumbnails"
                  path="thumbnails"
                  accept="image/*"
                  onUpload={(url, fileName) => {
                    setCourse(prev => ({ ...prev, thumbnail_url: url, thumbnail_path: fileName }));
                  }}
                  currentFile={course.thumbnail_url}
                  label=""
                  description="썸네일 이미지를 선택하거나 드래그해서 업로드하세요 (최대 5MB)"
                />
              </CardContent>
            </Card>

            {/* Detail Images */}
            <Card>
              <CardHeader>
                <CardTitle>상세 페이지 이미지</CardTitle>
                <CardDescription>강의 상세 페이지에 표시될 이미지들을 업로드하고 순서를 조정해주세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <FileUpload
                      bucket="course-detail-images"
                      path="detail-images"
                      accept="image/*"
                      maxSize={10 * 1024 * 1024}
                      onUpload={(url, fileName) => {
                        addDetailImage(url, fileName);
                      }}
                      label=""
                      description="상세페이지 이미지를 선택하거나 드래그해서 업로드하세요 (최대 10MB)"
                    />
                  </div>
                </div>

                {course.detail_images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                      <span>이미지를 드래그해서 순서를 변경할 수 있습니다</span>
                    </div>
                    
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="detail-images">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {course.detail_images.map((image, index) => (
                              <Draggable key={`${image.image_url}-${index}`} draggableId={`${image.image_url}-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "flex items-center gap-4 p-3 bg-card border rounded-lg transition-colors",
                                      snapshot.isDragging && "shadow-lg bg-accent"
                                    )}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex flex-col items-center justify-center w-12 h-12 bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing shrink-0 mt-2 transition-colors group"
                                      title="드래그해서 순서 변경"
                                    >
                                      <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                                        {index + 1}
                                      </span>
                                    </div>
                                    
                                    <img 
                                      src={image.image_url} 
                                      alt={image.image_name}
                                      className="w-24 h-16 object-cover rounded border shrink-0"
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{image.image_name}</p>
                                      <p className="text-xs text-muted-foreground">순서: {index + 1}</p>
                                    </div>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeDetailImage(index)}
                                      className="shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseEdit;