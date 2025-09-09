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
  description: string;
  order_index: number;
  duration_minutes: number;
  is_preview: boolean;
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
  short_description: string;
  description: string;
  thumbnail_url: string;
  detail_images: DetailImage[];
  video_preview_url: string;
  course_type: 'vod' | 'offline' | 'hybrid';
  price: number;
  duration_hours: number;
  level: string;
  category_id: string;
  what_you_will_learn: string[];
  requirements: string[];
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
    short_description: '',
    description: '',
    thumbnail_url: '',
    detail_images: [],
    video_preview_url: '',
    course_type: 'vod',
    price: 0,
    duration_hours: 0,
    level: 'beginner',
    category_id: '',
    what_you_will_learn: [''],
    requirements: [''],
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or('role.eq.admin,role.eq.instructor')
        .order('full_name');
      
      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const autoSave = () => {
    localStorage.setItem('draft_course', JSON.stringify(course));
  };

  // 리스트 관리 함수들
  const addListItem = (field: 'what_you_will_learn' | 'requirements') => {
    setCourse(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateListItem = (field: 'what_you_will_learn' | 'requirements', index: number, value: string) => {
    setCourse(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field: 'what_you_will_learn' | 'requirements', index: number) => {
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
      description: '',
      order_index: course.sections[sectionIndex].sessions.length,
      duration_minutes: 0,
      is_preview: false
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
        return !!(course.title && course.description && course.category_id);
      case 2:
        return course.sections.length > 0 && course.sections.every(s => s.title && s.sessions.length > 0);
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
        short_description: course.short_description,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        video_preview_url: course.video_preview_url,
        price: course.price,
        duration_hours: course.duration_hours,
        level: course.level,
        category_id: course.category_id,
        what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
        requirements: course.requirements.filter(item => item.trim()),
        is_published: !isDraft && course.is_published,
        instructor_id: course.category_id // Use selected instructor instead of current user
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
              description: session.description,
              order_index: sessionIndex,
              duration_minutes: session.duration_minutes,
              is_preview: session.is_preview,
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
                  <Label htmlFor="short_description">짧은 설명</Label>
                  <Input
                    id="short_description"
                    value={course.short_description}
                    onChange={(e) => setCourse(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="한 줄 요약"
                  />
                </div>

                <div>
                  <Label htmlFor="description">상세 설명 <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="강의 상세 설명을 입력하세요"
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="course_type">강의 타입</Label>
                  <Select value={course.course_type} onValueChange={(value: 'vod' | 'offline' | 'hybrid') => setCourse(prev => ({ ...prev, course_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vod">VOD (온라인 강의)</SelectItem>
                      <SelectItem value="offline">오프라인 강의</SelectItem>
                      <SelectItem value="hybrid">혼합형 (온라인 + 오프라인)</SelectItem>
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

                <div>
                  <Label htmlFor="video_preview_url">미리보기 동영상 URL (Vimeo)</Label>
                  <Input
                    id="video_preview_url"
                    value={course.video_preview_url}
                    onChange={(e) => setCourse(prev => ({ ...prev, video_preview_url: e.target.value }))}
                    placeholder="https://vimeo.com/..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* 학습 목표 및 요구사항 */}
            <Card>
              <CardHeader>
                <CardTitle>학습 목표 및 요구사항</CardTitle>
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

                <div>
                  <Label>수강 요구사항</Label>
                  <div className="space-y-2">
                    {course.requirements.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateListItem('requirements', index, e.target.value)}
                          placeholder="수강에 필요한 조건을 입력하세요"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeListItem('requirements', index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addListItem('requirements')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      항목 추가
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                  {course.sections.map((section, sectionIndex) => (
                    <Card key={sectionIndex} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">섹션 제목</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                              placeholder="섹션 제목을 입력하세요 (예: 기초편, 심화편)"
                              className="mt-1"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSection(sectionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {section.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="p-4 border rounded-lg bg-muted/30">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-sm">강의 #{sessionIndex + 1}</h5>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSession(sectionIndex, sessionIndex)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>

                                <div>
                                  <Label className="text-sm">강의 제목</Label>
                                  <Input
                                    value={session.title}
                                    onChange={(e) => updateSession(sectionIndex, sessionIndex, 'title', e.target.value)}
                                    placeholder="강의 제목을 입력하세요"
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">강의 설명</Label>
                                  <Textarea
                                    value={session.description}
                                    onChange={(e) => updateSession(sectionIndex, sessionIndex, 'description', e.target.value)}
                                    placeholder="강의에서 다룰 내용을 간단히 설명해주세요"
                                    rows={2}
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">예상 학습 시간 (분)</Label>
                                    <Input
                                      type="number"
                                      value={session.duration_minutes}
                                      onChange={(e) => updateSession(sectionIndex, sessionIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
                                      placeholder="30"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={session.is_preview}
                                      onCheckedChange={(checked) => updateSession(sectionIndex, sessionIndex, 'is_preview', checked)}
                                    />
                                    <Label className="text-sm">미리보기 허용</Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <Button 
                            onClick={() => addSession(sectionIndex)} 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            강의 추가
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button onClick={addSection} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    새 섹션 추가
                  </Button>
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

                <Card>
                  <CardHeader>
                    <CardTitle>기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="duration_hours">총 강의 시간 (시간)</Label>
                      <Input
                        id="duration_hours"
                        type="number"
                        value={course.duration_hours}
                        onChange={(e) => setCourse(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
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
                    <p className="text-sm text-muted-foreground">총 강의 시간: {course.duration_hours}시간</p>
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

            <div className="flex gap-4">
              <Button 
                onClick={() => saveCourse(true)} 
                variant="outline" 
                disabled={loading}
                className="flex-1"
              >
                임시 저장
              </Button>
              <Button 
                onClick={() => saveCourse(false)} 
                disabled={loading || !course.title}
                className="flex-1"
              >
                {loading ? "저장 중..." : "강의 생성"}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">새 강의 생성</h1>
          <p className="text-muted-foreground">
            단계별로 강의를 생성하고 관리하세요. 자동 저장 기능으로 작업 내용이 보호됩니다.
          </p>
          
          <div className="mt-4">
            <Button onClick={() => saveCourse(true)} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              수동 저장
            </Button>
          </div>
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
            <div className="space-x-2">
              <Button 
                onClick={() => saveCourse(true)} 
                variant="outline"
                disabled={loading}
              >
                임시 저장
              </Button>
              <Button 
                onClick={() => saveCourse(false)} 
                disabled={loading}
              >
                강의 생성
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseCreate;