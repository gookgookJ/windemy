import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload, FileImage, BookOpen, Video, DollarSign, FileText, Users, Settings, GripVertical } from 'lucide-react';
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AdminLayout } from "@/layouts/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";


const CourseCreate = () => {
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
    tag?: string;
  }

  interface CourseDetailImage {
    id?: string;
    image_url: string;
    image_name: string;
    section_title: string;
    order_index: number;
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const defaultCourse = {
    title: '',
    category_id: '',
    instructor_id: '',
    level: 'beginner',
    course_type: 'VOD',
    price: 0,
    what_you_will_learn: [''],
    requirements: [''] as string[],
    sections: [] as CourseSection[],
    course_options: [] as CourseOption[],
    detail_images: [] as CourseDetailImage[],
    thumbnail_url: '',
    thumbnail_path: '',
    is_published: false,
    homepage_section_id: '',
    is_new: false,
    is_hot: false
  };
  const [course, setCourse] = useState(defaultCourse);

  const { user, isAdmin } = useAuth();
  const [homepageSections, setHomepageSections] = useState<{id: string, title: string}[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [drafts, setDrafts] = useState<{id: string; name: string; updated_at: string; created_by: string}[]>([]);

  const mergeWithDefaults = (data: any) => ({
    ...defaultCourse,
    ...data,
    what_you_will_learn: data?.what_you_will_learn ?? [''],
    requirements: data?.requirements ?? [''],
    sections: data?.sections ?? [],
    course_options: data?.course_options ?? [],
    detail_images: data?.detail_images ?? [],
  });

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('course_drafts')
        .select('id, name, updated_at, created_by')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDrafts(data || []);
    } catch (e: any) {
      console.error('Failed to fetch drafts:', e);
    }
  };

  const handleOpenSaveDialog = () => {
    setDraftName(course.title || '새 임시저장본');
    setIsSaveDialogOpen(true);
  };

  const saveDraftToServer = async () => {
    if (!user?.id) {
      toast({ title: '오류', description: '로그인이 필요합니다.', variant: 'destructive' });
      return;
    }
    const name = draftName.trim();
    if (!name) {
      toast({ title: '이름 필요', description: '임시저장본 이름을 입력해주세요.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('course_drafts')
      .upsert({ name, data: course, created_by: user.id }, { onConflict: 'created_by,name' });
    if (error) {
      toast({ title: '오류', description: '임시저장에 실패했습니다.', variant: 'destructive' });
    } else {
      toast({ title: '임시저장 완료', description: `"${name}" 이름으로 저장되었습니다.` });
      setIsSaveDialogOpen(false);
      fetchDrafts();
    }
  };

  const loadDraftById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('course_drafts')
        .select('data')
        .eq('id', id)
        .single();
      if (error) throw error;
      const draftData = (data as any)?.data ?? {};
      setCourse(mergeWithDefaults(draftData));
      toast({ title: '불러오기 완료', description: '임시저장본을 불러왔습니다.' });
      setIsManageDialogOpen(false);
    } catch (e: any) {
      toast({ title: '오류', description: '임시저장본 불러오기에 실패했습니다.', variant: 'destructive' });
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase.from('course_drafts').delete().eq('id', id);
      if (error) throw error;
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast({ title: '삭제 완료', description: '임시저장본이 삭제되었습니다.' });
    } catch (e: any) {
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchCategories();
    fetchInstructors();
    fetchHomepageSections();
    fetchDrafts();
    loadDraft();
  }, []);

  // 자동저장
  useEffect(() => {
    if (course.title) {
      autoSave();
    }
  }, [course]);

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
      const { data, error } = await supabase
        .from('instructors')
        .select('id, full_name, email')
        .order('full_name');
      
      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "강사 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const fetchHomepageSections = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('id, title')
        .eq('is_active', true)
        .order('order_index');
      
      if (error) throw error;
      
      // 중복 제거: 같은 title을 가진 섹션 중 첫 번째만 유지
      const uniqueSections = (data || []).filter((section, index, self) => 
        index === self.findIndex(s => s.title === section.title)
      );
      
      setHomepageSections(uniqueSections);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "홈페이지 섹션을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('draft_course');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setCourse(prevCourse => ({ ...prevCourse, ...parsedDraft }));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('draft_course');
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      const courseData = {
        title: course.title,
        category_id: course.category_id,
        instructor_id: course.instructor_id,
        level: course.level,
        course_type: course.course_type,
        price: course.price,
        what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
        requirements: course.requirements?.filter(item => item.trim()) || [],
        thumbnail_url: course.thumbnail_url,
        thumbnail_path: course.thumbnail_path,
        is_published: course.is_published,
        is_new: course.is_new,
        is_hot: course.is_hot
      };

      const { data: courseResult, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (courseError) throw courseError;

      // 섹션 저장
      if (course.sections.length > 0) {
        const sectionsData = course.sections.map((section, index) => ({
          course_id: courseResult.id,
          title: section.title,
          order_index: index
        }));

        const { data: sectionsResult, error: sectionsError } = await supabase
          .from('course_sections')
          .insert(sectionsData)
          .select();

        if (sectionsError) throw sectionsError;

        // 세션 저장
        const allSessions: any[] = [];
        course.sections.forEach((section, sectionIndex) => {
          section.sessions.forEach((session, sessionIndex) => {
            allSessions.push({
              course_id: courseResult.id,
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

      // 코스 옵션 저장
      if (course.course_options.length > 0) {
        const optionsData = course.course_options.map(option => ({
          course_id: courseResult.id,
          name: option.name,
          price: option.price,
          original_price: option.original_price,
          benefits: option.benefits.filter(benefit => benefit.trim()),
          tag: option.tag
        }));

        const { error: optionsError } = await supabase
          .from('course_options')
          .insert(optionsData);

        if (optionsError) throw optionsError;
      }

      // 상세 페이지 이미지 저장
      if (course.detail_images.length > 0) {
        const detailImagesData = course.detail_images.map((image, index) => ({
          course_id: courseResult.id,
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

      // 홈페이지 섹션에 강의 추가 (공개된 강의이고 섹션이 선택된 경우)
      if (course.is_published && course.homepage_section_id) {
        const { error: sectionCourseError } = await supabase
          .from('homepage_section_courses')
          .insert({
            section_id: course.homepage_section_id,
            course_id: courseResult.id,
            order_index: 0
          });

        if (sectionCourseError) throw sectionCourseError;
      }

      toast({
        title: "성공",
        description: "강의가 성공적으로 생성되었습니다."
      });

      clearDraft();
      
      // 관리자 페이지로 리다이렉트
      window.location.href = '/admin/courses';

    } catch (error: any) {
      console.error('Failed to create course:', error);
      toast({
        title: "오류",
        description: error.message || "강의 생성에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    autoSave();
    toast({
      title: "임시저장 완료",
      description: "강의가 임시저장되었습니다."
    });
  };

  const handleInstructorSelect = async (val: string) => {
    try {
      if (val.startsWith('email:')) {
        const email = val.slice(7);
        const target = (instructors as any[]).find((i: any) => i.email === email);
        const full_name = target?.full_name || email;
        const { data, error } = await supabase.functions.invoke('manage-instructor', {
          body: { email, full_name, role: 'instructor' },
        });
        if (error) throw error;
        const newId = (data as any)?.userId || (data as any)?.user_id || (data as any)?.id;
        if (newId) {
          setCourse((prev) => ({ ...prev, instructor_id: newId }));
          await fetchInstructors();
        }
      } else {
        setCourse((prev) => ({ ...prev, instructor_id: val }));
      }
    } catch (e: any) {
      console.error('Failed to set instructor:', e);
      toast({ title: '오류', description: '강사 선택에 실패했습니다.', variant: 'destructive' });
    }
  };

  const autoSave = () => {
    localStorage.setItem('draft_course', JSON.stringify(course));
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

  // 드래그앤드롭 핸들러
  const handleSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(course.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCourse(prev => ({ ...prev, sections: items }));
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

  const updateDetailImage = (index: number, field: keyof CourseDetailImage, value: any) => {
    setCourse(prev => ({
      ...prev,
      detail_images: prev.detail_images.map((image, i) => 
        i === index ? { ...image, [field]: value } : image
      )
    }));
  };

  const removeDetailImage = (index: number) => {
    setCourse(prev => ({
      ...prev,
      detail_images: prev.detail_images.filter((_, i) => i !== index)
    }));
  };

  const handleDetailImageDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(course.detail_images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 순서 인덱스 업데이트
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }));

    setCourse(prev => ({ ...prev, detail_images: updatedItems }));
  };

  // 단계 검증
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(course.title && course.category_id);
      case 2:
        return course.what_you_will_learn.some(item => item.trim()) && 
               course.sections.length > 0 && 
               course.sections.every(s => s.title && s.sessions.length > 0);
      case 3:
        return course.course_options.length > 0 && course.course_options.every(o => o.name && o.price >= 0);
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const canProceed = (step: number) => {
    return validateStep(step);
  };

  const nextStep = () => {
    if (canProceed(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 단계별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  기본 정보
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  강의의 기본 정보를 입력해주세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">강의 제목 *</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 해외구매대행 완전정복"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select value={course.category_id} onValueChange={(value) => setCourse(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger className="mt-2">
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

                <div>
                  <Label htmlFor="instructor">강사 선택 *</Label>
                  <Select value={course.instructor_id} onValueChange={handleInstructorSelect}>
                    <SelectTrigger className="mt-2">
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

                <div>
                  <Label htmlFor="level">난이도</Label>
                  <Select value={course.level} onValueChange={(value) => setCourse(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">초급</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course_type">강의 타입</Label>
                  <Select value={course.course_type} onValueChange={(value) => setCourse(prev => ({ ...prev, course_type: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VOD">VOD</SelectItem>
                      <SelectItem value="오프라인">오프라인</SelectItem>
                      <SelectItem value="1:1 컨설팅">1:1 컨설팅</SelectItem>
                      <SelectItem value="챌린지·스터디">챌린지·스터디</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* 이 강의에서 배우는 것들 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  이 강의에서 배우는 것들
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  학습자가 이 강의를 통해 얻을 수 있는 것들을 작성해주세요.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.what_you_will_learn.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateListItem('what_you_will_learn', index, e.target.value)}
                        placeholder="예: 해외구매대행 사이트 이용 방법을 마스터할 수 있습니다"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('what_you_will_learn', index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addListItem('what_you_will_learn')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    항목 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 커리큘럼 구성 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  커리큘럼 구성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.sections.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button onClick={addSection} size="lg" className="hover-scale">
                            <Plus className="w-5 h-5 mr-2" />
                            섹션 만들기
                          </Button>
                          <Button 
                            onClick={() => {
                              // 기본 3챕터 템플릿 생성
                              const templateSections: CourseSection[] = [
                                { 
                                  title: '1챕터: 기초 개념 이해하기', 
                                  sessions: [
                                    { title: '강의 소개 및 학습 목표', order_index: 0 },
                                    { title: '핵심 개념 설명', order_index: 1 }
                                  ]
                                },
                                { 
                                  title: '2챕터: 실습을 통한 학습', 
                                  sessions: [
                                    { title: '단계별 실습 가이드', order_index: 0 },
                                    { title: '문제 해결 방법', order_index: 1 }
                                  ]
                                },
                                { 
                                  title: '3챕터: 실무 적용하기', 
                                  sessions: [
                                    { title: '실제 사례 분석', order_index: 0 },
                                    { title: '과제 및 마무리', order_index: 1 }
                                  ]
                                }
                              ];
                              setCourse(prev => ({ ...prev, sections: templateSections }));
                            }}
                            variant="outline" 
                            size="lg"
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            템플릿으로 시작
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleSectionDragEnd}>
                      <Droppable droppableId="sections">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {course.sections.map((section, sectionIndex) => (
                              <Draggable key={sectionIndex} draggableId={`section-${sectionIndex}`} index={sectionIndex}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "relative bg-card border border-border rounded-xl p-6 transition-all",
                                      snapshot.isDragging && "shadow-lg rotate-1"
                                    )}
                                  >
                                    {/* 섹션 헤더 */}
                                    <div className="flex items-start gap-4 mb-6">
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-xl text-lg font-bold shrink-0 cursor-grab active:cursor-grabbing hover:bg-primary/80 transition-colors"
                                      >
                                        {sectionIndex + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <Input
                                            value={section.title}
                                            onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                                            placeholder="섹션명 입력"
                                            className="text-base font-medium border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary/50"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSection(sectionIndex)}
                                            className="text-destructive hover:text-destructive shrink-0"
                                            title="섹션 삭제"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                           <Video className="w-4 h-4" />
                                           <span>{section.sessions.length}개의 세션</span>
                                         </div>
                                      </div>
                                    </div>

                                    {/* 강의 목록 */}
                                    <div className="space-y-3">
                                      {section.sessions.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/10">
                                          <Video className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                                           <p className="text-sm text-muted-foreground mb-4">
                                             이 섹션에 세션 내용을 추가해보세요
                                           </p>
                                           <Button 
                                             onClick={() => addSession(sectionIndex)} 
                                             variant="outline"
                                           >
                                             <Plus className="w-4 h-4 mr-2" />
                                             첫 번째 세션 추가
                                           </Button>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {section.sessions.map((session, sessionIndex) => (
                                            <div key={sessionIndex} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors">
                                              <div className="flex items-center justify-center w-8 h-8 bg-muted-foreground/10 text-muted-foreground rounded-full text-sm font-medium shrink-0">
                                                {sessionIndex + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <Input
                                                  value={session.title}
                                                  onChange={(e) => updateSession(sectionIndex, sessionIndex, 'title', e.target.value)}
                                                  placeholder={`세션 ${sessionIndex + 1} 제목 (예: 기본 개념 설명하기)`}
                                                  className="border-0 bg-transparent px-0 focus-visible:ring-0 text-base"
                                                />
                                              </div>
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeSession(sectionIndex, sessionIndex)}
                                                  className="text-destructive hover:text-destructive"
                                                  title="세션 삭제"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                           <Button 
                                             onClick={() => addSession(sectionIndex)} 
                                             variant="outline" 
                                             className="w-full border-dashed hover:border-solid"
                                           >
                                             <Plus className="w-4 h-4 mr-2" />
                                             세션 추가하기
                                           </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            
                            {/* 새 섹션 추가 */}
                            <div className="text-center">
                              <Button onClick={addSection} variant="outline" size="lg" className="hover-scale">
                                <Plus className="w-5 h-5 mr-2" />
                                새 섹션 추가하기
                              </Button>
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  판매 옵션 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.course_options.map((option, optionIndex) => (
                  <Card key={optionIndex} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">판매 옵션 #{optionIndex + 1}</h4>
                        {course.course_options.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCourseOption(optionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>옵션 이름</Label>
                        <Input
                          value={option.name}
                          onChange={(e) => updateCourseOption(optionIndex, 'name', e.target.value)}
                          placeholder="예: 기본 패키지, 프리미엄 패키지"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>판매 가격 (원)</Label>
                          <Input
                            type="number"
                            value={option.price}
                            onChange={(e) => updateCourseOption(optionIndex, 'price', parseInt(e.target.value) || 0)}
                            placeholder="실제 판매 가격을 입력하세요"
                          />
                        </div>
                        <div>
                          <Label>정가 (원)</Label>
                          <Input
                            type="number"
                            value={option.original_price || ''}
                            onChange={(e) => updateCourseOption(optionIndex, 'original_price', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="할인 전 가격"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>포함 혜택 <span className="text-xs text-muted-foreground">이 옵션에 포함되는 혜택들을 작성하세요</span></Label>
                        <div className="space-y-2">
                          {option.benefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex gap-2">
                              <Input
                                value={benefit}
                                onChange={(e) => updateBenefit(optionIndex, benefitIndex, e.target.value)}
                                placeholder="예: 평생 무제한 수강, PDF 자료 제공, 1:1 질문답변"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeBenefit(optionIndex, benefitIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addBenefit(optionIndex)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            혜택 추가
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button onClick={addCourseOption} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  새 판매 옵션 추가
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>메인 페이지 섹션 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>홈페이지 섹션 선택</Label>
                  <Select value={course.homepage_section_id} onValueChange={(value) => setCourse(prev => ({ ...prev, homepage_section_id: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="메인 페이지에 표시할 섹션을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {homepageSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={course.is_published}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label>즉시 공개</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  섹션을 선택하고 즉시 공개를 체크하면 해당 섹션과 메인 페이지에 강의가 표시됩니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>미디어 업로드</CardTitle>
                <p className="text-sm text-muted-foreground">
                  강의 썸네일과 상세 페이지 이미지를 업로드하세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">썸네일 이미지</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    {course.thumbnail_url ? (
                      <div className="relative">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded overflow-hidden border shrink-0">
                            <img 
                              src={course.thumbnail_url} 
                              alt="썸네일 미리보기"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{course.thumbnail_path}</p>
                            <p className="text-xs text-muted-foreground mt-1">썸네일 이미지가 업로드되었습니다</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCourse(prev => ({ ...prev, thumbnail_url: '', thumbnail_path: '' }))}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <FileUpload
                        bucket="course-thumbnails"
                        path="thumbnails"
                        accept="image/*"
                        maxSize={5}
                        onUpload={(url, fileName) => {
                          setCourse(prev => ({ ...prev, thumbnail_url: url, thumbnail_path: fileName }));
                        }}
                        currentFile={course.thumbnail_url}
                        label=""
                        description="강의 목록에 표시될 썸네일 이미지를 업로드하세요 (최대 5MB)"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-medium">상세 페이지 이미지</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        강의 상세 페이지에 표시될 이미지들을 업로드하고 순서를 조정하세요.
                      </p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-6 mb-4">
                    <div className="text-center">
                      <FileUpload
                        bucket="course-detail-images"
                        path="detail-images"
                        accept="image/*"
                        maxSize={10}
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
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded"></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded"></div>
                        </div>
                        <span>이미지를 드래그해서 순서를 변경할 수 있습니다</span>
                      </div>
                      
                      <DragDropContext onDragEnd={handleDetailImageDragEnd}>
                        <Droppable droppableId="detail-images">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                              {course.detail_images.map((image, index) => (
                                <Draggable key={index} draggableId={`image-${index}`} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "border rounded-lg p-4 bg-card transition-all hover:shadow-md hover:border-primary/30",
                                        snapshot.isDragging && "shadow-lg rotate-1 scale-105 z-10"
                                      )}
                                    >
                                      <div className="flex items-start gap-4">
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
                                        
                                        <div className="w-20 h-20 rounded overflow-hidden border shrink-0">
                                          <img 
                                            src={image.image_url} 
                                            alt={image.image_name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm mb-1 truncate">
                                            {image.image_name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            상세 페이지에 표시됩니다
                                          </div>
                                        </div>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeDetailImage(index)}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                          title="이미지 삭제"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
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

                  {course.detail_images.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        아직 상세 페이지 이미지가 없습니다
                      </p>
                      <p className="text-xs mt-1">
                        위의 업로드 영역을 사용해서 이미지를 추가해보세요
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>강의 생성 완료</CardTitle>
                <p className="text-sm text-muted-foreground">
                  입력하신 정보를 확인하고 강의를 생성하세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">강의 정보 요약</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 제목: {course.title}</li>
                    <li>• 섹션: {course.sections.length}개</li>
                    <li>• 총 세션: {course.sections.reduce((acc, section) => acc + section.sessions.length, 0)}개</li>
                    <li>• 판매 옵션: {course.course_options.length}개</li>
                    <li>• 공개 여부: {course.is_published ? '즉시 공개' : '비공개'}</li>
                  </ul>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                    {isLoading ? '생성 중...' : '강의 생성'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">새 강의 만들기</h1>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleOpenSaveDialog} 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-primary/10"
                  >
                    임시저장
                  </Button>
                  <Button 
                    onClick={() => { fetchDrafts(); setIsManageDialogOpen(true); }}
                    variant="outline" 
                    size="sm"
                    className="hover:bg-secondary"
                  >
                    임시저장본 관리
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>단계 {currentStep} / 5</span>
              </div>
            </div>
          </div>
          
          {/* 진행 단계 표시 */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step <= currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step}
                  </div>
                  {step < 5 && (
                    <div className={cn(
                      "w-16 h-1 mx-2 transition-colors",
                      step < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Draft dialogs */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>임시저장</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="draftName">임시저장본 이름</Label>
            <Input
              id="draftName"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="예: 2025-10-월간-해외구매대행"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>취소</Button>
            <Button onClick={saveDraftToServer}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>임시저장본 관리</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" onClick={fetchDrafts}>새로고침</Button>
            <Button size="sm" onClick={handleOpenSaveDialog}>새 임시저장</Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">임시저장본이 없습니다.</p>
            ) : (
              drafts.map((d) => (
                <div key={d.id} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">업데이트: {new Date(d.updated_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => loadDraftById(d.id)}>불러오기</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteDraft(d.id)}>삭제</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-6 py-8">
        {renderStepContent()}
        
        {/* 하단 네비게이션 */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
          >
            이전
          </Button>
          
          <div className="flex gap-2">
            {currentStep < 5 && (
              <Button 
                onClick={nextStep} 
                disabled={!canProceed(currentStep)}
              >
                다음
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CourseCreate;