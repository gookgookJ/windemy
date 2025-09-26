import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, ChevronLeft, ChevronRight, FileText, Video, Link, BookOpen, Settings, DollarSign, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface DetailImage {
  id: string;
  image_url: string;
  image_name: string;
  section_title: string;
  order_index: number;
}

interface CourseSession {
  id?: string;
  title: string;
  order_index: number;
}

interface CourseSection {
  id?: string;
  title: string;
  sessions: CourseSession[];
}

interface CourseOption {
  id?: string;
  name: string;
  price: number;
  original_price?: number;
  benefits: string[];
}

interface Course {
  title: string;
  thumbnail_url: string;
  detail_images: DetailImage[];
  course_type: 'VOD' | '오프라인' | '1:1 컨설팅' | '챌린지·스터디';
  price: number;
  level: string;
  category_id: string;
  what_you_will_learn: string[];
  sections: CourseSection[];
  course_options: CourseOption[];
  is_published: boolean;
  instructor_id?: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
}

const AdminCourseCreate = () => {
  const [course, setCourse] = useState<Course>({
    title: '',
    thumbnail_url: '',
    detail_images: [],
    course_type: 'VOD',
    price: 0,
    level: 'beginner',
    category_id: '',
    what_you_will_learn: [''],
    sections: [],
    course_options: [
      {
        name: '기본 패키지',
        price: 0,
        benefits: ['강의 평생 수강권', '모든 강의 자료 제공']
      }
    ],
    is_published: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: []
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [priceInput, setPriceInput] = useState<string>('');

  const steps = [
    { id: 1, name: '기본 정보', icon: BookOpen },
    { id: 2, name: '커리큘럼', icon: FileText },
    { id: 3, name: '판매 설정', icon: DollarSign },
    { id: 4, name: '운영 설정', icon: Settings },
    { id: 5, name: '확인 및 생성', icon: Save }
  ];

  useEffect(() => {
    fetchCategories();
    fetchInstructors();
    
    // 자동 저장 로직
    const interval = setInterval(() => {
      if (course.title) {
        autoSave();
      }
    }, 30000); // 30초마다 자동 저장

    // 저장된 초안 불러오기
    const saved = localStorage.getItem('draft_course');
    if (saved) {
      try {
        setCourse(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }

    return () => clearInterval(interval);
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      // Source of truth: instructors table
      const { data: instructorsRows, error: insErr } = await supabase
        .from('instructors')
        .select('id, full_name, email')
        .order('full_name');

      if (insErr) throw insErr;

      const emails = (instructorsRows || []).map((i: any) => i.email).filter(Boolean);

      // Fetch existing profiles for these emails
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', emails);

      if (profErr) throw profErr;

      const profileByEmail = new Map<string, string>(
        (profiles || []).map((p: any) => [p.email, p.id])
      );

      // Ensure missing profiles exist
      const missing = (instructorsRows || []).filter((i: any) => !profileByEmail.get(i.email));
      if (missing.length > 0) {
        await Promise.all(
          missing.map(async (m: any) => {
            try {
              const { data, error } = await supabase.functions.invoke('manage-instructor', {
                body: { email: m.email, full_name: m.full_name, role: 'instructor' },
              });
              const newId = (data as any)?.userId || (data as any)?.user_id || (data as any)?.id;
              if (!error && newId) profileByEmail.set(m.email, newId);
            } catch (e) {
              console.warn('Failed to ensure profile for instructor', m.email, e);
            }
          })
        );
      }

      const finalList = (instructorsRows || [])
        .map((i: any) => ({ id: profileByEmail.get(i.email) || '', full_name: i.full_name, email: i.email }))
        .filter((i: any) => i.id);

      setInstructors(finalList);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleInstructorChange = async (val: string) => {
    try {
      if (val.startsWith('create:')) {
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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "필수 정보 누락",
        description: "필수 항목을 모두 입력해주세요.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 강의 저장
  const saveCourse = async (isDraft = false) => {
    setLoading(true);
    try {
      // 강의 기본 정보 저장
      const courseData = {
        title: course.title,
        thumbnail_path: course.thumbnail_url, // Use thumbnail_path instead of thumbnail_url
        price: course.price,
        level: course.level,
        category_id: course.category_id,
        what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
        course_type: course.course_type,
        
        is_published: !isDraft && course.is_published,
        instructor_id: course.instructor_id || null // profiles.id only; null if not selected
      };

      const { data: savedCourse, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (courseError) throw courseError;

      // 섹션과 세션 저장
      if (course.sections.length > 0) {
        for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex++) {
          const section = course.sections[sectionIndex];
          
          // 섹션 저장
          const { data: sectionData, error: sectionError } = await supabase
            .from('course_sections')
            .insert({
              course_id: savedCourse.id,
              title: section.title,
              order_index: sectionIndex
            })
            .select()
            .single();

          if (sectionError) throw sectionError;

          // 해당 섹션의 세션들 저장
          if (section.sessions.length > 0) {
            const sessionsToInsert = section.sessions.map((session, sessionIndex) => ({
              course_id: savedCourse.id,
              section_id: sectionData.id,
              title: session.title,
              order_index: sessionIndex,
              is_free: false
            }));

            const { error: sessionsError } = await supabase
              .from('course_sessions')
              .insert(sessionsToInsert);

            if (sessionsError) throw sessionsError;
          }
        }
      }

      // 코스 옵션 저장
      if (course.course_options.length > 0) {
        const optionsToInsert = course.course_options
          .filter(option => option.name.trim() && option.price >= 0)
          .map(option => ({
            course_id: savedCourse.id,
            name: option.name,
            price: option.price,
            original_price: option.original_price,
            benefits: option.benefits.filter(benefit => benefit.trim())
          }));

        if (optionsToInsert.length > 0) {
          const { error: optionsError } = await supabase
            .from('course_options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      // 상세 이미지 저장
      if (course.detail_images && course.detail_images.length > 0) {
        const imagesToInsert = course.detail_images.map(img => ({
          course_id: savedCourse.id,
          image_url: img.image_url,
          image_name: img.image_name,
          order_index: img.order_index ?? 0,
          section_title: img.section_title || null
        }));

        const { error: imagesError } = await supabase
          .from('course_detail_images')
          .insert(imagesToInsert);

        if (imagesError) throw imagesError;
      }

      // 로컬스토리지 비우기
      localStorage.removeItem('draft_course');

      toast({
        title: "성공",
        description: `강의가 ${isDraft ? '임시저장' : '생성'}되었습니다.`
      });

      navigate('/admin/courses');

    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "오류",
        description: "강의 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">강의 제목 <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="강의 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <Label htmlFor="course_type">강의 타입</Label>
                  <Select value={course.course_type} onValueChange={(value: 'VOD' | '오프라인' | '1:1 컨설팅' | '챌린지·스터디') => setCourse(prev => ({ ...prev, course_type: value }))}>
                    <SelectTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="level">난이도</Label>
                    <Select value={course.level} onValueChange={(value) => setCourse(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
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
                    <Label htmlFor="category">카테고리 <span className="text-red-500">*</span></Label>
                    <Select value={course.category_id} onValueChange={(value) => setCourse(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
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
                    <Label htmlFor="instructor">강사 관리</Label>
                    <div className="flex gap-2">
                      <Select
                        value={course.instructor_id || undefined}
                        onValueChange={(value) => setCourse(prev => ({ ...prev, instructor_id: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="강사를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor: any) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.full_name} ({instructor.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/instructors')}
                        className="whitespace-nowrap"
                      >
                        강사 관리
                      </Button>
                    </div>
                    {course.instructor_id && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/instructor-profile/${course.instructor_id}`)}
                        >
                          강사 수정
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCourse(prev => ({ ...prev, instructor_id: '' }))}
                        >
                          선택 해제
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 미디어 */}
            <Card>
              <CardHeader>
                <CardTitle>미디어</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  bucket="course-thumbnails"
                  accept="image/*"
                  maxSize={5}
                  onUpload={(url) => setCourse(prev => ({ ...prev, thumbnail_url: url }))}
                  currentFile={course.thumbnail_url}
                  label="썸네일 이미지"
                  description="강의 목록에서 보여질 썸네일 이미지를 업로드하세요"
                />

                <MultiImageUpload
                  bucket="course-detail-images"
                  images={course.detail_images}
                  onImagesChange={(images) => setCourse(prev => ({ ...prev, detail_images: images }))}
                  accept="image/*,image/gif"
                  maxSize={10}
                />

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
                <CardTitle>이 강의에서 배우는 것들</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>배울 내용</Label>
                  <div className="space-y-2">
                    {course.what_you_will_learn.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateListItem('what_you_will_learn', index, e.target.value)}
                          placeholder="학습자가 배울 내용을 입력하세요"
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
                      size="sm"
                      onClick={() => addListItem('what_you_will_learn')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      항목 추가
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  커리큘럼 구성
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  상세페이지의 '커리큘럼' 섹션에 표시될 내용입니다. 섹션별로 강의를 구성하세요.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.sections.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">커리큘럼을 구성해보세요</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        섹션을 추가하고 각 섹션에 강의를 추가하여 체계적인 커리큘럼을 만들어보세요.
                      </p>
                      <Button onClick={addSection} className="hover-scale">
                        <Plus className="w-4 h-4 mr-2" />
                        첫 번째 섹션 만들기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {course.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="relative">
                          {/* 섹션 헤더 */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                              {sectionIndex + 1}
                            </div>
                            <div className="flex-1">
                              <Input
                                value={section.title}
                                onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                                placeholder={`섹션 ${sectionIndex + 1} 제목 (예: 기초편, 심화편)`}
                                className="text-lg font-medium border-0 border-b-2 border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              {/* 섹션 순서 변경 */}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={sectionIndex === 0}
                                onClick={() => {
                                  const newSections = [...course.sections];
                                  [newSections[sectionIndex], newSections[sectionIndex - 1]] = 
                                  [newSections[sectionIndex - 1], newSections[sectionIndex]];
                                  setCourse(prev => ({ ...prev, sections: newSections }));
                                }}
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={sectionIndex === course.sections.length - 1}
                                onClick={() => {
                                  const newSections = [...course.sections];
                                  [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
                                  [newSections[sectionIndex + 1], newSections[sectionIndex]];
                                  setCourse(prev => ({ ...prev, sections: newSections }));
                                }}
                              >
                                ↓
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSection(sectionIndex)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 섹션 내용 */}
                          <div className="ml-11 space-y-3">
                            {/* 강의 목록 */}
                            {section.sessions.length === 0 ? (
                              <div className="text-center py-8 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
                                <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground mb-3">
                                  이 섹션에 강의를 추가해보세요
                                </p>
                                <Button 
                                  onClick={() => addSession(sectionIndex)} 
                                  variant="outline" 
                                  size="sm"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  강의 추가
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {section.sessions.map((session, sessionIndex) => (
                                  <div key={sessionIndex} className="group flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-center w-6 h-6 bg-muted text-muted-foreground rounded text-xs font-medium">
                                      {sessionIndex + 1}
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        value={session.title}
                                        onChange={(e) => updateSession(sectionIndex, sessionIndex, 'title', e.target.value)}
                                        placeholder={`강의 ${sessionIndex + 1} 제목`}
                                        className="border-0 bg-transparent px-0 focus-visible:ring-0"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {/* 세션 순서 변경 */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sessionIndex === 0}
                                        onClick={() => {
                                          const newSessions = [...section.sessions];
                                          [newSessions[sessionIndex], newSessions[sessionIndex - 1]] = 
                                          [newSessions[sessionIndex - 1], newSessions[sessionIndex]];
                                          updateSection(sectionIndex, 'sessions', newSessions);
                                        }}
                                      >
                                        ↑
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sessionIndex === section.sessions.length - 1}
                                        onClick={() => {
                                          const newSessions = [...section.sessions];
                                          [newSessions[sessionIndex], newSessions[sessionIndex + 1]] = 
                                          [newSessions[sessionIndex + 1], newSessions[sessionIndex]];
                                          updateSection(sectionIndex, 'sessions', newSessions);
                                        }}
                                      >
                                        ↓
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSession(sectionIndex, sessionIndex)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button 
                                  onClick={() => addSession(sectionIndex)} 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full border-dashed"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  강의 추가
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* 새 섹션 추가 */}
                      <div className="text-center pt-4 border-t border-dashed border-muted-foreground/25">
                        <Button onClick={addSection} variant="outline" className="hover-scale">
                          <Plus className="w-4 h-4 mr-2" />
                          새 섹션 추가
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 빠른 추가 도구 */}
                  {course.sections.length > 0 && (
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          빠른 도구
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            onClick={() => {
                              // 템플릿 섹션 추가
                              const templateSection: CourseSection = {
                                title: `Part ${course.sections.length + 1}`,
                                sessions: [
                                  { title: '개념 설명', order_index: 0 },
                                  { title: '실습 예제', order_index: 1 },
                                  { title: '과제 및 정리', order_index: 2 }
                                ]
                              };
                              setCourse(prev => ({
                                ...prev,
                                sections: [...prev.sections, templateSection]
                              }));
                            }}
                            variant="outline" 
                            size="sm"
                          >
                            템플릿 섹션 추가
                          </Button>
                          <Button 
                            onClick={() => {
                              // 마지막 섹션에 3개 강의 한번에 추가
                              if (course.sections.length > 0) {
                                const lastSectionIndex = course.sections.length - 1;
                                const currentSessionCount = course.sections[lastSectionIndex].sessions.length;
                                const newSessions = [
                                  { title: '', order_index: currentSessionCount },
                                  { title: '', order_index: currentSessionCount + 1 },
                                  { title: '', order_index: currentSessionCount + 2 }
                                ];
                                setCourse(prev => ({
                                  ...prev,
                                  sections: prev.sections.map((section, i) => 
                                    i === lastSectionIndex 
                                      ? { ...section, sessions: [...section.sessions, ...newSessions] }
                                      : section
                                  )
                                }));
                              }
                            }}
                            variant="outline" 
                            size="sm"
                            disabled={course.sections.length === 0}
                          >
                            강의 3개 추가
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 팁: 섹션과 강의에 마우스를 올리면 순서 변경 버튼이 나타납니다
                        </p>
                      </CardContent>
                    </Card>
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
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  판매 옵션 설정
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  상세페이지의 고정 결제창 '강의 구성' 및 '포함 혜택' 영역에 표시될 내용입니다.
                </p>
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
                          <Label>정가 (원)</Label>
                          <Input
                            type="number"
                            value={option.price}
                            onChange={(e) => updateCourseOption(optionIndex, 'price', parseInt(e.target.value) || 0)}
                            placeholder="정가를 입력하세요"
                          />
                        </div>
                        <div>
                          <Label>원가 (원) - 선택사항</Label>
                          <Input
                            type="number"
                            value={option.original_price || ''}
                            onChange={(e) => updateCourseOption(optionIndex, 'original_price', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="할인 표시용 원가"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>포함 혜택 <span className="text-xs text-muted-foreground">(상세페이지 '포함 혜택' 섹션에 표시)</span></Label>
                        <div className="space-y-2">
                          {option.benefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex gap-2">
                              <Input
                                value={benefit}
                                onChange={(e) => updateBenefit(optionIndex, benefitIndex, e.target.value)}
                                placeholder="포함 혜택을 입력하세요 (예: 평생 수강권, 1:1 피드백)"
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
                <CardTitle>공개 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={course.is_published}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label>즉시 공개</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  체크하면 강의가 즉시 공개됩니다. 체크하지 않으면 비공개 상태로 저장됩니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO 제목</Label>
                  <Input
                    id="seo_title"
                    value={course.seo_title}
                    onChange={(e) => setCourse(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="검색 엔진에 표시될 제목"
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO 설명</Label>
                  <Textarea
                    id="seo_description"
                    value={course.seo_description}
                    onChange={(e) => setCourse(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="검색 엔진에 표시될 설명"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_keywords">SEO 키워드 (쉼표로 구분)</Label>
                  <Input
                    id="seo_keywords"
                    value={course.seo_keywords.join(', ')}
                    onChange={(e) => setCourse(prev => ({ 
                      ...prev, 
                      seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                    }))}
                    placeholder="강의, 온라인교육, 프로그래밍"
                  />
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
                <CardTitle>강의 정보 확인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">기본 정보</h4>
                    <p className="text-sm text-muted-foreground">제목: {course.title}</p>
                    <p className="text-sm text-muted-foreground">카테고리: {categories.find(c => c.id === course.category_id)?.name}</p>
                    <p className="text-sm text-muted-foreground">난이도: {course.level}</p>
                  </div>
                <div>
                  <h4 className="font-semibold">가격 정보</h4>
                  <p className="text-sm text-muted-foreground">정가: {course.price.toLocaleString()}원</p>
                </div>
                </div>
                
                <div>
                  <h4 className="font-semibold">커리큘럼</h4>
                  <p className="text-sm text-muted-foreground">총 {course.sections.length}개 섹션, {course.sections.reduce((total, section) => total + section.sessions.length, 0)}개 강의</p>
                </div>

                <div>
                  <h4 className="font-semibold">판매 옵션</h4>
                  <p className="text-sm text-muted-foreground">총 {course.course_options.length}개 옵션</p>
                </div>

                <div>
                  <h4 className="font-semibold">공개 상태</h4>
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "즉시 공개" : "비공개"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => saveCourse(false)} 
              disabled={loading || !course.title}
              className="w-full"
            >
              {loading ? "저장 중..." : "강의 생성"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* 헤더 */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">새 강의 생성</h1>
            <p className="text-muted-foreground">
              단계별로 강의를 생성하고 관리하세요. 자동 저장 기능으로 작업 내용이 보호됩니다.
            </p>
          </div>
          <Button onClick={() => saveCourse(true)} variant="outline" size="sm" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            임시 저장
          </Button>
        </div>

        {/* 진행 상태 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || isCompleted;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary/10 text-primary border-2 border-primary'
                        : isAccessible
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                  <span className={`text-xs text-center ${
                    isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* 네비게이션 */}
        <div className="flex justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
          
          {currentStep < 5 ? (
            <Button onClick={nextStep}>
              다음
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => saveCourse(false)} 
              disabled={loading}
            >
              강의 생성
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseCreate;