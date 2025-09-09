import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Upload, ChevronLeft, ChevronRight, FileText, Video, Link, BookOpen, Settings, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseSession {
  id?: string;
  title: string;
  description: string;
  content_type: 'video' | 'pdf' | 'quiz' | 'assignment' | 'live_session';
  video_url?: string;
  pdf_url?: string;
  quiz_data?: any;
  assignment_data?: any;
  live_session_link?: string;
  order_index: number;
  duration_minutes: number;
  is_free: boolean;
  is_preview: boolean;
}

interface Course {
  title: string;
  short_description: string;
  description: string;
  thumbnail_url: string;
  detail_image_path: string;
  video_preview_url: string;
  course_type: 'vod' | 'offline' | 'hybrid';
  price: number;
  sale_price?: number;
  duration_hours: number;
  access_period: 'unlimited' | 'limited';
  access_days?: number;
  level: string;
  category_id: string;
  tags: string[];
  what_you_will_learn: string[];
  requirements: string[];
  sessions: CourseSession[];
  is_public: boolean;
  scheduled_publish_date?: string;
  sale_start_date?: string;
  sale_end_date?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  enable_reviews: boolean;
  enable_certificates: boolean;
}

export const AdminCourseCreate = () => {
  const [course, setCourse] = useState<Course>({
    title: '',
    short_description: '',
    description: '',
    thumbnail_url: '',
    detail_image_path: '',
    video_preview_url: '',
    course_type: 'vod',
    price: 0,
    sale_price: undefined,
    duration_hours: 0,
    access_period: 'unlimited',
    access_days: undefined,
    level: 'beginner',
    category_id: '',
    tags: [],
    what_you_will_learn: [''],
    requirements: [''],
    sessions: [],
    is_public: true,
    scheduled_publish_date: undefined,
    sale_start_date: undefined,
    sale_end_date: undefined,
    seo_title: undefined,
    seo_description: undefined,
    seo_keywords: undefined,
    enable_reviews: true,
    enable_certificates: false
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps = [
    { id: 1, name: '기본 정보', icon: BookOpen },
    { id: 2, name: '커리큘럼', icon: Video },
    { id: 3, name: '판매 설정', icon: DollarSign },
    { id: 4, name: '운영 옵션', icon: Settings },
    { id: 5, name: '완료', icon: Save }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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

  const addSession = () => {
    setCourse(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        title: '',
        description: '',
        content_type: 'video',
        video_url: '',
        order_index: prev.sessions.length + 1,
        duration_minutes: 0,
        is_free: false,
        is_preview: false
      }]
    }));
  };

  const updateSession = (index: number, field: keyof CourseSession, value: any) => {
    setCourse(prev => ({
      ...prev,
      sessions: prev.sessions.map((session, i) => 
        i === index ? { ...session, [field]: value } : session
      )
    }));
  };

  const removeSession = (index: number) => {
    setCourse(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index)
        .map((session, i) => ({ ...session, order_index: i + 1 }))
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !course.tags.includes(tag)) {
      setCourse(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (index: number) => {
    setCourse(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const autoSave = async () => {
    if (course.title && course.description) {
      localStorage.setItem('draft_course', JSON.stringify(course));
      toast({
        title: "자동 저장됨",
        description: "작업 내용이 자동으로 저장되었습니다.",
      });
    }
  };

  // 자동 저장 (30초마다)
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [course]);

  // 로컬스토리지에서 불러오기
  useEffect(() => {
    const draft = localStorage.getItem('draft_course');
    if (draft) {
      setCourse(JSON.parse(draft));
    }
  }, []);

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return course.title && course.description && course.category_id;
      case 2:
        return course.sessions.length > 0;
      case 3:
        return course.price >= 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "다음 단계로 넘어가기 위해 필수 정보를 모두 입력해주세요.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const saveCourse = async (isDraft = true) => {
    setLoading(true);
    try {
      // 필수 필드 검증
      if (!course.title || !course.description || !course.category_id) {
        toast({
          title: "오류",
          description: "제목, 설명, 카테고리는 필수입니다.",
          variant: "destructive"
        });
        return;
      }

      // 강의 저장
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: course.title,
          short_description: course.short_description,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          detail_image_path: course.detail_image_path,
          video_preview_url: course.video_preview_url,
          price: course.price,
          duration_hours: course.duration_hours,
          level: course.level,
          category_id: course.category_id,
          what_you_will_learn: course.what_you_will_learn.filter(item => item.trim()),
          requirements: course.requirements.filter(item => item.trim()),
          is_published: !isDraft,
          instructor_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 세션 저장
      if (course.sessions.length > 0) {
        const sessionsToInsert = course.sessions
          .filter(session => session.title.trim())
          .map(session => ({
            title: session.title,
            description: session.description,
            video_url: session.video_url || '',
            order_index: session.order_index,
            duration_minutes: session.duration_minutes,
            is_free: session.is_free,
            is_preview: session.is_preview,
            course_id: courseData.id
          }));

        if (sessionsToInsert.length > 0) {
          const { error: sessionsError } = await supabase
            .from('course_sessions')
            .insert(sessionsToInsert);

          if (sessionsError) throw sessionsError;
        }
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

                <div>
                  <Label>태그</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(index)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="태그를 입력하고 엔터를 누르세요"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 미디어 */}
            <Card>
              <CardHeader>
                <CardTitle>미디어</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="thumbnail">썸네일 URL</Label>
                  <Input
                    id="thumbnail"
                    value={course.thumbnail_url}
                    onChange={(e) => setCourse(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="detail_image">상세 이미지 경로</Label>
                  <Input
                    id="detail_image"
                    value={course.detail_image_path}
                    onChange={(e) => setCourse(prev => ({ ...prev, detail_image_path: e.target.value }))}
                    placeholder="/images/course-detail.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="preview_video">미리보기 비디오 URL</Label>
                  <Input
                    id="preview_video"
                    value={course.video_preview_url}
                    onChange={(e) => setCourse(prev => ({ ...prev, video_preview_url: e.target.value }))}
                    placeholder="https://player.vimeo.com/video/123456"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 학습 목표 */}
            <Card>
              <CardHeader>
                <CardTitle>학습 목표</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.what_you_will_learn.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateListItem('what_you_will_learn', index, e.target.value)}
                        placeholder="학습 목표를 입력하세요"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('what_you_will_learn', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addListItem('what_you_will_learn')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    학습 목표 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 수강 요건 */}
            <Card>
              <CardHeader>
                <CardTitle>수강 요건</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.requirements.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateListItem('requirements', index, e.target.value)}
                        placeholder="수강 요건을 입력하세요"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('requirements', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addListItem('requirements')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    요건 추가
                  </Button>
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
                <CardTitle>커리큘럼 구성</CardTitle>
                <p className="text-sm text-muted-foreground">강의 세션을 구성하고 순서를 설정하세요</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.sessions.map((session, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">세션 {index + 1}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSession(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={session.title}
                          onChange={(e) => updateSession(index, 'title', e.target.value)}
                          placeholder="세션 제목"
                        />
                        <Select 
                          value={session.content_type} 
                          onValueChange={(value: any) => updateSession(index, 'content_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                영상
                              </div>
                            </SelectItem>
                            <SelectItem value="pdf">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                PDF
                              </div>
                            </SelectItem>
                            <SelectItem value="quiz">퀴즈</SelectItem>
                            <SelectItem value="assignment">과제</SelectItem>
                            <SelectItem value="live_session">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                라이브 세션
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Textarea
                        value={session.description}
                        onChange={(e) => updateSession(index, 'description', e.target.value)}
                        placeholder="세션 설명"
                        rows={2}
                      />

                      {session.content_type === 'video' && (
                        <Input
                          value={session.video_url || ''}
                          onChange={(e) => updateSession(index, 'video_url', e.target.value)}
                          placeholder="비디오 URL"
                        />
                      )}

                      {session.content_type === 'pdf' && (
                        <Input
                          value={session.pdf_url || ''}
                          onChange={(e) => updateSession(index, 'pdf_url', e.target.value)}
                          placeholder="PDF URL"
                        />
                      )}

                      {session.content_type === 'live_session' && (
                        <Input
                          value={session.live_session_link || ''}
                          onChange={(e) => updateSession(index, 'live_session_link', e.target.value)}
                          placeholder="라이브 세션 링크"
                        />
                      )}
                      
                      <div className="flex gap-4 items-center">
                        <div>
                          <Label>시간 (분)</Label>
                          <Input
                            type="number"
                            value={session.duration_minutes}
                            onChange={(e) => updateSession(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={session.is_free}
                            onCheckedChange={(checked) => updateSession(index, 'is_free', checked)}
                          />
                          <Label>무료</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={session.is_preview}
                            onCheckedChange={(checked) => updateSession(index, 'is_preview', checked)}
                          />
                          <Label>미리보기</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={addSession} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    새 세션 추가
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
                <CardTitle>판매 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">정가 (원)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={course.price}
                      onChange={(e) => setCourse(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sale_price">판매가 (원)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      value={course.sale_price || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, sale_price: parseInt(e.target.value) || undefined }))}
                      placeholder="할인가 (선택사항)"
                    />
                    {course.sale_price && course.price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        할인율: {Math.round(((course.price - course.sale_price) / course.price) * 100)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sale_start">판매 시작일</Label>
                    <Input
                      id="sale_start"
                      type="datetime-local"
                      value={course.sale_start_date || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, sale_start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sale_end">판매 종료일</Label>
                    <Input
                      id="sale_end"
                      type="datetime-local"
                      value={course.sale_end_date || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, sale_end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>수강 기간</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={course.access_period === 'unlimited'}
                        onCheckedChange={(checked) => setCourse(prev => ({ 
                          ...prev, 
                          access_period: checked ? 'unlimited' : 'limited',
                          access_days: checked ? undefined : 30
                        }))}
                      />
                      <Label>무제한 수강</Label>
                    </div>
                    {course.access_period === 'limited' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={course.access_days || 30}
                          onChange={(e) => setCourse(prev => ({ ...prev, access_days: parseInt(e.target.value) || 30 }))}
                          className="w-20"
                        />
                        <span>일</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">총 강의 시간 (시간)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={course.duration_hours}
                    onChange={(e) => setCourse(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
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
                    checked={course.is_public}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label>즉시 공개</Label>
                </div>

                {!course.is_public && (
                  <div>
                    <Label htmlFor="scheduled_publish">예약 공개 날짜</Label>
                    <Input
                      id="scheduled_publish"
                      type="datetime-local"
                      value={course.scheduled_publish_date || ''}
                      onChange={(e) => setCourse(prev => ({ ...prev, scheduled_publish_date: e.target.value }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>추가 기능</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={course.enable_reviews}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, enable_reviews: checked }))}
                  />
                  <Label>리뷰/평가 활성화</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={course.enable_certificates}
                    onCheckedChange={(checked) => setCourse(prev => ({ ...prev, enable_certificates: checked }))}
                  />
                  <Label>수료증 발급</Label>
                </div>
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
                    value={course.seo_title || ''}
                    onChange={(e) => setCourse(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="검색 엔진 최적화용 제목"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO 설명</Label>
                  <Textarea
                    id="seo_description"
                    value={course.seo_description || ''}
                    onChange={(e) => setCourse(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="검색 엔진 최적화용 설명"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="seo_keywords">SEO 키워드</Label>
                  <Input
                    id="seo_keywords"
                    value={course.seo_keywords || ''}
                    onChange={(e) => setCourse(prev => ({ ...prev, seo_keywords: e.target.value }))}
                    placeholder="키워드1, 키워드2, 키워드3"
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
                <p className="text-sm text-muted-foreground">입력한 정보를 확인하고 강의를 생성하세요</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">기본 정보</h4>
                    <p><strong>제목:</strong> {course.title}</p>
                    <p><strong>타입:</strong> {course.course_type === 'vod' ? 'VOD' : course.course_type === 'offline' ? '오프라인' : '혼합형'}</p>
                    <p><strong>난이도:</strong> {course.level}</p>
                    <p><strong>세션 수:</strong> {course.sessions.length}개</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">판매 정보</h4>
                    <p><strong>정가:</strong> {course.price.toLocaleString()}원</p>
                    {course.sale_price && <p><strong>판매가:</strong> {course.sale_price.toLocaleString()}원</p>}
                    <p><strong>수강 기간:</strong> {course.access_period === 'unlimited' ? '무제한' : `${course.access_days}일`}</p>
                    <p><strong>공개 설정:</strong> {course.is_public ? '즉시 공개' : '비공개'}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => saveCourse(true)}
                    disabled={loading}
                    className="flex-1"
                  >
                    임시저장
                  </Button>
                  <Button 
                    onClick={() => saveCourse(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    강의 생성 완료
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

export default AdminCourseCreate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">새 강의 만들기</h1>
            <p className="text-muted-foreground">단계별로 강의를 생성하세요</p>
          </div>
          <Button 
            variant="outline" 
            onClick={autoSave}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            수동 저장
          </Button>
        </div>

        {/* 진행 표시기 */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = step.id <= currentStep || isCompleted;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isCurrent ? 'border-primary bg-primary text-primary-foreground' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        isAccessible ? 'border-muted-foreground text-muted-foreground hover:border-primary' :
                        'border-muted bg-muted text-muted-foreground cursor-not-allowed'}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                  <span className={`text-xs mt-1 ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* 단계별 컨텐츠 */}
        <div className="min-h-[600px]">
          {renderStepContent()}
        </div>

        {/* 네비게이션 버튼 */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button onClick={nextStep}>
              다음
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};