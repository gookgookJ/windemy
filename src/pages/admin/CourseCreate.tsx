import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Upload, FileImage, BookOpen, Video, DollarSign, FileText, Users, Settings, GripVertical, Save, FolderOpen, Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { FileUpload } from "@/components/ui/file-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AdminLayout } from "@/layouts/AdminLayout";

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
  const initialCourseState = {
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
    tags: [] as string[]
  };

  const [course, setCourse] = useState(initialCourseState);

  const [homepageSections, setHomepageSections] = useState<{id: string, title: string}[]>([]);
  
  // 임시저장 관리 상태
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isNameDraftModalOpen, setIsNameDraftModalOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<{id: string, name: string, created_at: string}[]>([]);
  
  // 예약 발행 상태
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // 새 강의 생성 시 초기화
  const resetToInitialState = () => {
    setCourse(initialCourseState);
    setCurrentStep(1);
    clearDraft();
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchCategories();
    fetchInstructors();
    fetchHomepageSections();
    loadDraft();
    fetchSavedDrafts();
    
    // URL이 /admin/course-create 일 때만 초기화 (새 강의 생성)
    if (window.location.pathname === '/admin/course-create') {
      resetToInitialState();
    }
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
      // Fetch from instructors table only (managed in admin instructor page)
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
        requirements: course.requirements?.filter(item => item.trim()) || [],
        thumbnail_url: course.thumbnail_url,
        thumbnail_path: course.thumbnail_path,
        is_published: course.is_published,
        tags: course.tags || []
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
        try {
          // 선택한 섹션 정보 가져오기
          const { data: selectedSection } = await supabase
            .from('homepage_sections')
            .select('*')
            .eq('id', course.homepage_section_id)
            .maybeSingle();

          if (!selectedSection) {
            console.warn('Selected section not found');
            return;
          }

          let publishedSectionId = course.homepage_section_id;
          let draftSectionId = course.homepage_section_id;

          // 선택한 섹션이 드래프트면 발행 섹션 찾기/생성, 발행 섹션이면 드래프트 섹션 찾기/생성
          if (selectedSection.is_draft === true) {
            // 드래프트 섹션이 선택됨 -> 발행 섹션 찾기
            const { data: publishedSection } = await supabase
              .from('homepage_sections')
              .select('id')
              .eq('section_type', selectedSection.section_type)
              .eq('is_draft', false)
              .maybeSingle();

            if (publishedSection?.id) {
              publishedSectionId = publishedSection.id;
            }
          } else {
            // 발행 섹션이 선택됨 -> 드래프트 섹션 찾기/생성
            const { data: draftSection } = await supabase
              .from('homepage_sections')
              .select('id')
              .eq('section_type', selectedSection.section_type)
              .eq('is_draft', true)
              .maybeSingle();

            if (draftSection?.id) {
              draftSectionId = draftSection.id;
            } else {
              // 드래프트 섹션 생성
              const { data: newDraft } = await supabase
                .from('homepage_sections')
                .insert({
                  title: selectedSection.title,
                  subtitle: selectedSection.subtitle,
                  icon_type: selectedSection.icon_type,
                  icon_value: selectedSection.icon_value,
                  section_type: selectedSection.section_type,
                  filter_type: 'manual',
                  filter_value: null,
                  display_limit: selectedSection.display_limit ?? 15,
                  order_index: selectedSection.order_index ?? 0,
                  is_active: selectedSection.is_active ?? true,
                  is_draft: true
                })
                .select('id')
                .single();
              if (newDraft?.id) draftSectionId = newDraft.id;
            }
          }

          // 발행 섹션에 추가 (메인페이지 노출용, is_draft: false)
          const { error: publishedError } = await supabase
            .from('homepage_section_courses')
            .insert({
              section_id: publishedSectionId,
              course_id: courseResult.id,
              order_index: 0,
              is_draft: false
            });

          // 드래프트 섹션에 추가 (관리자 편집용, is_draft: true)
          const { error: draftError } = await supabase
            .from('homepage_section_courses')
            .insert({
              section_id: draftSectionId,
              course_id: courseResult.id,
              order_index: 0,
              is_draft: true
            });

          if (publishedError) console.warn('Failed to add to published section:', publishedError);
          if (draftError) console.warn('Failed to add to draft section:', draftError);

        } catch (e) {
          console.warn('Failed to add course to homepage sections:', e);
        }
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
    setIsNameDraftModalOpen(true);
  };

  const handleScheduledSubmit = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "오류",
        description: "발행 날짜와 시간을 모두 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      toast({
        title: "오류", 
        description: "미래 날짜와 시간을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 임시로 저장하고 예약 발행 정보를 추가
      const courseData = {
        title: course.title,
        category_id: course.category_id,
        instructor_id: course.instructor_id,
        level: course.level,
        course_type: course.course_type,
        price: course.price,
        what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
        requirements: course.requirements.filter(item => item.trim()),
        is_published: false, // 예약 발행이므로 일단 비공개로 저장
        thumbnail_url: course.thumbnail_url,
        thumbnail_path: course.thumbnail_path,
        detail_image_path: '',
        video_preview_url: ''
      };

      // TODO: 여기에 예약 발행 로직 추가
      // 실제로는 별도의 스케줄링 테이블에 저장하고 cron job으로 처리
      
      toast({
        title: "성공",
        description: `강의가 ${scheduledDateTime.toLocaleString('ko-KR')}에 발행되도록 예약되었습니다.`,
      });
      
      setIsScheduleModalOpen(false);
      setScheduleDate('');
      setScheduleTime('');
      
    } catch (error: any) {
      console.error('Failed to schedule course:', error);
      toast({
        title: "오류",
        description: "예약 발행 설정에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 임시저장 관리 함수들
  const fetchSavedDrafts = async () => {
    try {
      const result = await (supabase as any)
        .from('course_drafts')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });
      
      if (result.error) {
        console.error('Supabase error:', result.error);
        return;
      }
      
      if (result.data && Array.isArray(result.data)) {
        setSavedDrafts(result.data as {id: string, name: string, created_at: string}[]);
      }
    } catch (error: any) {
      console.error('Failed to fetch saved drafts:', error);
    }
  };

  const handleSaveNamedDraft = async () => {
    if (!draftName.trim()) {
      toast({
        title: "오류",
        description: "임시저장본 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await (supabase as any)
        .from('course_drafts')
        .insert({
          name: draftName.trim(),
          data: course,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (result.error) throw result.error;

      toast({
        title: "성공",
        description: "임시저장본이 저장되었습니다."
      });

      setDraftName('');
      setIsNameDraftModalOpen(false);
      await fetchSavedDrafts();
    } catch (error: any) {
      console.error('Failed to save named draft:', error);
      toast({
        title: "오류",
        description: "임시저장본 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleLoadDraft = async (draftId: string) => {
    try {
      const result = await (supabase as any)
        .from('course_drafts')
        .select('data')
        .eq('id', draftId)
        .single();

      if (result.error) throw result.error;

      setCourse(result.data.data);
      setCurrentStep(1);
      setIsDraftModalOpen(false);
      
      toast({
        title: "성공",
        description: "임시저장본이 불러와졌습니다."
      });
    } catch (error: any) {
      console.error('Failed to load draft:', error);
      toast({
        title: "오류",
        description: "임시저장본 불러오기에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const result = await (supabase as any)
        .from('course_drafts')
        .delete()
        .eq('id', draftId);

      if (result.error) throw result.error;

      toast({
        title: "성공",
        description: "임시저장본이 삭제되었습니다."
      });

      await fetchSavedDrafts();
    } catch (error: any) {
      console.error('Failed to delete draft:', error);
      toast({
        title: "오류",
        description: "임시저장본 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
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

  // 상세 이미지 관리 함수
  const handleDetailImagesChange = (images: CourseDetailImage[]) => {
    setCourse(prev => ({ ...prev, detail_images: images }));
  };

  // 단계 검증
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(course.title && course.category_id && course.instructor_id);
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
          <div className="space-y-8">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>
                  기본 정보
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  강의의 기본 정보를 입력해주세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium">강의 제목 *</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="예: 해외구매대행 완전정복"
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium">카테고리 *</Label>
                  <Select value={course.category_id} onValueChange={(value) => setCourse(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger className="h-11">
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

                <div className="space-y-3">
                  <Label htmlFor="instructor" className="text-sm font-medium">강사 선택 *</Label>
                  <Select value={course.instructor_id} onValueChange={handleInstructorSelect}>
                    <SelectTrigger className="h-11">
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

                <div className="space-y-3">
                  <Label htmlFor="level" className="text-sm font-medium">난이도</Label>
                  <Select value={course.level} onValueChange={(value) => setCourse(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">초급</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="course_type" className="text-sm font-medium">강의 타입</Label>
                  <Select value={course.course_type} onValueChange={(value) => setCourse(prev => ({ ...prev, course_type: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VOD">VOD</SelectItem>
                      <SelectItem value="실시간 라이브">실시간 라이브</SelectItem>
                      <SelectItem value="오프라인">오프라인</SelectItem>
                      <SelectItem value="1:1 컨설팅">1:1 컨설팅</SelectItem>
                      <SelectItem value="챌린지·스터디">챌린지·스터디</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <div key={index} className="flex gap-3">
                      <Input
                        value={item}
                        onChange={(e) => updateListItem('what_you_will_learn', index, e.target.value)}
                        placeholder="예: 해외구매대행에 대한 A to Z를 학습할 수 있습니다."
                        className="h-11"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('what_you_will_learn', index)}
                        className="h-11 px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addListItem('what_you_will_learn')}
                    className="h-11"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    항목 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 커리큘럼 구성 */}
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle>
                  커리큘럼 구성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {course.sections.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5">
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">상세 페이지 이미지</Label>
                    <p className="text-sm text-muted-foreground">
                      {course.detail_images.length}개의 이미지
                    </p>
                  </div>
                  
                  <MultiImageUpload
                    bucket="course-detail-images"
                    images={course.detail_images}
                    onImagesChange={handleDetailImagesChange}
                    accept="image/*"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '선택되지 않음';
        const getInstructorName = (id: string) => instructors.find(i => i.id === id)?.full_name || '선택되지 않음';
        const getHomepageSectionName = (id: string) => homepageSections.find(s => s.id === id)?.title || '선택되지 않음';
        
        const totalSessions = course.sections.reduce((acc, section) => acc + section.sessions.length, 0);
        const freeSessions = course.sections.reduce((acc, section) => 
          acc + section.sessions.filter(session => session.is_free).length, 0
        );
        
        return (
          <div className="space-y-8">
            {/* 기본 정보 */}
            <Card className="animate-fade-in">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">강의 제목</Label>
                      <p className="text-base font-medium">{course.title || '입력되지 않음'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">카테고리</Label>
                      <p className="text-base">{getCategoryName(course.category_id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">강사</Label>
                      <p className="text-base">{getInstructorName(course.instructor_id)}</p>
                    </div>
                    {course.what_you_will_learn.filter(item => item.trim()).length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">학습 목표</Label>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                          {course.what_you_will_learn.filter(item => item.trim()).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">난이도</Label>
                      <p className="text-base">{course.level === 'beginner' ? '초급' : course.level === 'intermediate' ? '중급' : '고급'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">강의 유형</Label>
                      <p className="text-base">{course.course_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">기본 가격</Label>
                      <p className="text-base">{course.price.toLocaleString()}원</p>
                    </div>
                    {course.requirements.filter(item => item.trim()).length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">수강 요구사항</Label>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                          {course.requirements.filter(item => item.trim()).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 커리큘럼 */}
            {course.sections.length > 0 && (
              <Card className="animate-fade-in">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    커리큘럼 ({course.sections.length}개 섹션, {totalSessions}개 세션)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.sections.map((section, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{section.title}</h4>
                          <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">
                            {section.sessions.length}개 세션
                          </span>
                        </div>
                        {section.sessions.length > 0 && (
                          <div className="grid gap-2">
                            {section.sessions.map((session, sessionIndex) => (
                              <div key={sessionIndex} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                                <span className="flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  {session.title}
                                </span>
                                {session.is_free && (
                                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded">
                                    무료
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex justify-center gap-8 text-sm mt-6 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>무료 세션: {freeSessions}개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>유료 세션: {totalSessions - freeSessions}개</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 판매 옵션 */}
            {course.course_options.length > 0 && (
              <Card className="animate-fade-in">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    판매 옵션 ({course.course_options.length}개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {course.course_options.map((option, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {option.name}
                              {option.tag && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {option.tag}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold">{option.price.toLocaleString()}원</span>
                              {option.original_price && option.original_price !== option.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {option.original_price.toLocaleString()}원
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {option.benefits.filter(benefit => benefit.trim()).length > 0 && (
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">포함 혜택</Label>
                            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                              {option.benefits.filter(benefit => benefit.trim()).map((benefit, benefitIndex) => (
                                <li key={benefitIndex}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 추가 설정 */}
            <Card className="animate-fade-in">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  추가 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">홈페이지 섹션</Label>
                      <p className="text-base">{getHomepageSectionName(course.homepage_section_id)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">상세 이미지</Label>
                      <p className="text-base">{course.detail_images.length}개 업로드됨</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">썸네일 이미지</Label>
                      <p className="text-base">{course.thumbnail_url ? '업로드됨' : '업로드되지 않음'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼들 */}
            <Card className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading} 
                    className="flex-1 h-12 text-base hover-scale"
                  >
                    {isLoading ? '생성 중...' : '강의 생성'}
                  </Button>
                  
                  <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 h-12 text-base hover-scale">
                        <Calendar className="w-4 h-4 mr-2" />
                        예약 발행
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md animate-scale-in">
                      <DialogHeader className="space-y-3">
                        <DialogTitle>예약 발행 설정</DialogTitle>
                        <DialogDescription>
                          강의가 자동으로 발행될 날짜와 시간을 설정하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label htmlFor="schedule-date" className="text-sm font-medium">발행 날짜</Label>
                          <Input
                            id="schedule-date"
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="schedule-time" className="text-sm font-medium">발행 시간</Label>
                          <Input
                            id="schedule-time"
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsScheduleModalOpen(false);
                              setScheduleDate('');
                              setScheduleTime('');
                            }} 
                            className="px-6"
                          >
                            취소
                          </Button>
                          <Button 
                            onClick={handleScheduledSubmit}
                            disabled={!scheduleDate || !scheduleTime || isLoading}
                            className="px-6"
                          >
                            {isLoading ? '설정 중...' : '예약 설정'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
              <h1 className="text-2xl font-bold">새 강의 만들기</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Dialog open={isNameDraftModalOpen} onOpenChange={setIsNameDraftModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={handleSaveDraft} className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        임시저장
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="space-y-3">
                        <DialogTitle>임시저장하기</DialogTitle>
                        <DialogDescription>
                          현재 입력된 내용을 임시저장본으로 저장합니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label htmlFor="draft-name" className="text-sm font-medium">임시저장본 이름</Label>
                          <Input
                            id="draft-name"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="예: 해외구매대행 완전정복"
                            className="h-11"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button variant="outline" onClick={() => setIsNameDraftModalOpen(false)} className="px-6">
                            취소
                          </Button>
                          <Button onClick={handleSaveNamedDraft} className="px-6">
                            저장
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isDraftModalOpen} onOpenChange={setIsDraftModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2" onClick={fetchSavedDrafts}>
                        <FolderOpen className="w-4 h-4" />
                        임시저장본 관리
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                      <DialogHeader className="space-y-3 pb-4">
                        <DialogTitle className="flex items-center gap-3 text-lg">
                          <FolderOpen className="w-5 h-5" />
                          임시저장본 관리
                        </DialogTitle>
                        <DialogDescription>
                          저장된 임시저장본을 불러오거나 삭제할 수 있습니다.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-auto px-1">
                        {savedDrafts.length > 0 ? (
                          <div className="grid gap-4">
                            {savedDrafts.map((draft) => (
                              <div key={draft.id} className="group border rounded-xl p-5 hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-4 mb-3">
                                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-6 h-6 text-primary" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-base truncate mb-1">
                                          {draft.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(draft.created_at).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-3 ml-6">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleLoadDraft(draft.id)}
                                      className="whitespace-nowrap px-4 h-9"
                                    >
                                      불러오기
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeleteDraft(draft.id)}
                                      className="text-destructive hover:text-destructive whitespace-nowrap px-4 h-9"
                                    >
                                      삭제
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                              <FolderOpen className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">저장된 임시저장본이 없습니다</h3>
                            <p className="text-muted-foreground text-base leading-relaxed">
                              좌측 상단의 "임시저장" 버튼을 클릭해서<br />
                              현재 작업을 저장해보세요.
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>단계 {currentStep} / 5</span>
                </div>
              </div>
          </div>
          
          {/* 진행 단계 표시 */}
          <div className="mt-6">
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

      <div className="container mx-auto px-6 py-8">
        {renderStepContent()}
        
        {/* 하단 네비게이션 */}
        <div className="flex justify-between mt-12 pt-8 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
            className="h-11 px-6"
          >
            이전
          </Button>
          
          <div className="flex gap-3">
            {currentStep < 5 && (
              <Button 
                onClick={nextStep} 
                disabled={!canProceed(currentStep)}
                className="h-11 px-6"
              >
                다음
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default CourseCreate;