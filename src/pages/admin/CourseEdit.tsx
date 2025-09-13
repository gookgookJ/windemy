import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/ui/file-upload';
import { MultiImageUpload } from '@/components/ui/multi-image-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Save,
  FileImage,
  BookOpen,
  Target,
  Globe,
  Search,
  Tag
} from 'lucide-react';

interface CourseOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  tag?: string; // Add tag field for labels like "2차 얼리버드"
}

interface CurriculumSection {
  id: string;
  title: string;
  sessions: CurriculumSession[];
}

interface CurriculumSession {
  id: string;
  title: string;
  description: string;
  duration: number;
  isPreview: boolean;
}

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  level: string;
  duration_hours: number;
  what_you_learn: string[];
  curriculum: CurriculumSection[];
  options: CourseOption[];
  images: DetailImage[];
  thumbnail_url?: string;
  category_id: string;
  instructor_id: string; // Add instructor_id field
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

interface DetailImage {
  id: string;
  image_url: string;
  image_name: string;
  section_title: string;
  order_index: number;
}

export const AdminCourseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchCategories();
      fetchInstructors();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      // Fetch course details with complete data
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
      
      // Transform the data to match our Course interface using safe property access
      const transformedCurriculum: CurriculumSection[] = (data.course_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((section: any) => ({
          id: section.id,
          title: section.title,
          sessions: (section.course_sessions || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((session: any) => ({
              id: session.id,
              title: session.title,
              description: session.description || '',
              duration: session.duration_minutes || 30,
              isPreview: session.is_preview || false
            }))
        }));

      const transformedOptions: CourseOption[] = (data.course_options || []).map((option: any) => ({
        id: option.id,
        name: option.name,
        price: option.price,
        features: option.benefits || [],
        tag: option.tag || ''
      }));

      const transformedImages: DetailImage[] = (data.course_detail_images || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          image_name: img.image_name || 'Image',
          section_title: img.section_title || '',
          order_index: img.order_index || 0
        }));

      const transformedData: Course = {
        id: data.id,
        title: data.title || '',
        subtitle: data.short_description || data.title || '',
        description: data.description || '',
        price: data.price || 0,
        level: data.level || 'beginner',
        duration_hours: data.duration_hours || 0,
        what_you_learn: data.what_you_will_learn || [],
        
        curriculum: transformedCurriculum,
        options: transformedOptions.length > 0 ? transformedOptions : [{
          id: 'default',
          name: '기본 패키지',
          price: data.price || 0,
          features: ['강의 평생 수강권', '모든 강의 자료 제공'],
          tag: ''
        }],
        images: transformedImages,
        thumbnail_url: data.thumbnail_url || data.thumbnail_path || '',
        category_id: data.category_id || '',
        instructor_id: data.instructor_id || '',
        is_published: data.is_published || false,
        meta_title: data.title || '',
        meta_description: data.description || '',
        meta_keywords: ''
      };
      
      setCourse(transformedData);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "오류",
        description: "강의 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchInstructors = async () => {
    try {
      // Fetch both from profiles and instructors tables to ensure sync
      const [profilesResult, instructorsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .or('role.eq.admin,role.eq.instructor')
          .order('full_name'),
        supabase
          .from('instructors')
          .select('id, full_name, email')
          .order('full_name')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (instructorsResult.error) throw instructorsResult.error;

      // Combine and deduplicate instructors
      const combinedInstructors = [
        ...(profilesResult.data || []),
        ...(instructorsResult.data || [])
      ];

      // Remove duplicates based on email
      const uniqueInstructors = combinedInstructors.filter((instructor, index, self) => 
        index === self.findIndex(i => i.email === instructor.email)
      );

      setInstructors(uniqueInstructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleSave = async () => {
    if (!course) return;

    setSaving(true);
    try {
      // Update course basic info
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: course.title,
          short_description: course.subtitle,
          description: course.description,
          price: course.price,
          level: course.level,
          duration_hours: course.duration_hours,
          what_you_will_learn: (course.what_you_learn || []).filter(item => !!item && item.trim() !== ''),
          
          category_id: course.category_id || null,
          instructor_id: course.instructor_id || null,
          is_published: course.is_published,
          thumbnail_path: course.thumbnail_url || null,
        })
        .eq('id', id);

      if (courseError) throw courseError;

      // Update course sections and sessions
      // First, delete existing sections and sessions
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

      // Insert new sections and sessions
      if (course.curriculum.length > 0) {
        for (let sectionIndex = 0; sectionIndex < course.curriculum.length; sectionIndex++) {
          const section = course.curriculum[sectionIndex];
          
          const { data: sectionData, error: sectionError } = await supabase
            .from('course_sections')
            .insert({
              course_id: id,
              title: section.title,
              order_index: sectionIndex
            })
            .select()
            .single();

          if (sectionError) throw sectionError;

          // Insert sessions for this section
          if (section.sessions.length > 0) {
            const sessionsToInsert = section.sessions.map((session, sessionIndex) => ({
              course_id: id,
              section_id: sectionData.id,
              title: session.title,
              description: session.description,
              order_index: sessionIndex,
              duration_minutes: session.duration,
              is_preview: session.isPreview
            }));

            const { error: sessionsError } = await supabase
              .from('course_sessions')
              .insert(sessionsToInsert);

            if (sessionsError) throw sessionsError;
          }
        }
      }

      // Update course options
      const { error: deleteOptionsError } = await supabase
        .from('course_options')
        .delete()
        .eq('course_id', id);

      if (deleteOptionsError) throw deleteOptionsError;

      if (course.options.length > 0) {
        const optionsToInsert = course.options.map(option => ({
          course_id: id,
          name: option.name,
          price: option.price,
          benefits: option.features,
          tag: option.tag || null
        }));

        const { error: optionsError } = await supabase
          .from('course_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Update course detail images
      const { error: deleteImagesError } = await supabase
        .from('course_detail_images')
        .delete()
        .eq('course_id', id);

      if (deleteImagesError) throw deleteImagesError;

      if (course.images.length > 0) {
        const imagesToInsert = course.images.map(img => ({
          course_id: id,
          image_url: img.image_url,
          image_name: img.image_name,
          section_title: img.section_title,
          order_index: img.order_index
        }));

        const { error: imagesError } = await supabase
          .from('course_detail_images')
          .insert(imagesToInsert);

        if (imagesError) throw imagesError;
      }

      toast({
        title: "성공",
        description: "강의가 성공적으로 수정되었습니다."
      });

      navigate('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "오류",
        description: `강의 수정에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addCurriculumSection = () => {
    if (!course) return;
    const newSection: CurriculumSection = {
      id: Date.now().toString(),
      title: '새 섹션',
      sessions: []
    };
    setCourse({
      ...course,
      curriculum: [...course.curriculum, newSection]
    });
  };

  const updateCurriculumSection = (sectionId: string, updates: Partial<CurriculumSection>) => {
    if (!course) return;
    setCourse({
      ...course,
      curriculum: course.curriculum.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    });
  };

  const deleteCurriculumSection = (sectionId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      curriculum: course.curriculum.filter(section => section.id !== sectionId)
    });
  };

  const addSessionToSection = (sectionId: string) => {
    if (!course) return;
    const newSession: CurriculumSession = {
      id: Date.now().toString(),
      title: '새 세션',
      description: '',
      duration: 30,
      isPreview: false
    };
    
    setCourse({
      ...course,
      curriculum: course.curriculum.map(section =>
        section.id === sectionId 
          ? { ...section, sessions: [...section.sessions, newSession] }
          : section
      )
    });
  };

  const updateSession = (sectionId: string, sessionId: string, updates: Partial<CurriculumSession>) => {
    if (!course) return;
    setCourse({
      ...course,
      curriculum: course.curriculum.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              sessions: section.sessions.map(session =>
                session.id === sessionId ? { ...session, ...updates } : session
              )
            }
          : section
      )
    });
  };

  const deleteSession = (sectionId: string, sessionId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      curriculum: course.curriculum.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              sessions: section.sessions.filter(session => session.id !== sessionId)
            }
          : section
      )
    });
  };

  const addOption = () => {
    if (!course) return;
    const newOption: CourseOption = {
      id: Date.now().toString(),
      name: '새 옵션',
      price: 0,
      features: ['새 혜택'],
      tag: ''
    };
    setCourse({
      ...course,
      options: [...course.options, newOption]
    });
  };

  const updateOption = (optionId: string, updates: Partial<CourseOption>) => {
    if (!course) return;
    setCourse({
      ...course,
      options: course.options.map(option =>
        option.id === optionId ? { ...option, ...updates } : option
      )
    });
  };

  const deleteOption = (optionId: string) => {
    if (!course) return;
    setCourse({
      ...course,
      options: course.options.filter(option => option.id !== optionId)
    });
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

  if (!course) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">강의를 찾을 수 없습니다.</div>
            <Button onClick={() => navigate('/admin/courses')} className="mt-4">
              강의 목록으로 돌아가기
            </Button>
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
            <Button
              variant="outline"
              onClick={() => navigate(`/course/${course.id}`)}
            >
              미리보기
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              기본 정보 (상세페이지 상단 영역)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">강의 제목</Label>
                <Input
                  id="title"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  placeholder="강의 제목을 입력하세요"
                />
              </div>
            </div>

            {/* 썸네일 업로드 섹션 - 파일 업로드 방식으로 변경 */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">강의 썸네일</Label>
              <div className="space-y-4">
                {course.thumbnail_url && (
                  <div className="flex items-center space-x-4">
                    <img 
                      src={course.thumbnail_url} 
                      alt="Current thumbnail" 
                      className="w-32 h-20 object-cover rounded border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCourse({ ...course, thumbnail_url: '' })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </div>
                )}
                <FileUpload
                  bucket="course-thumbnails"
                  accept="image/*"
                  onUpload={(url) => setCourse({ ...course, thumbnail_url: url })}
                  currentFile={course.thumbnail_url}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">강의 설명</Label>
              <Textarea
                id="description"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                placeholder="강의에 대한 상세 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">기본 가격</Label>
                <Input
                  id="price"
                  type="number"
                  value={course.price}
                  onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">난이도</Label>
                <Select value={course.level} onValueChange={(value) => setCourse({ ...course, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">초급</SelectItem>
                    <SelectItem value="intermediate">중급</SelectItem>
                    <SelectItem value="advanced">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">예상 소요 시간 (시간)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={course.duration_hours}
                  onChange={(e) => setCourse({ ...course, duration_hours: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={course.category_id} onValueChange={(value) => setCourse({ ...course, category_id: value })}>
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
              <div className="space-y-2">
                <Label htmlFor="instructor">강사 관리</Label>
                <div className="flex gap-2">
                  <Select value={course.instructor_id} onValueChange={(value) => setCourse({ ...course, instructor_id: value })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="강사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
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
                      onClick={() => setCourse({ ...course, instructor_id: '' })}
                    >
                      선택 해제
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={course.is_published}
                onCheckedChange={(checked) => setCourse({ ...course, is_published: checked })}
              />
              <Label htmlFor="published">강의 공개</Label>
            </div>
          </CardContent>
        </Card>

        {/* 상세페이지 이미지 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              상세페이지 이미지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultiImageUpload
              images={course.images}
              onImagesChange={(images) => setCourse({ ...course, images })}
              bucket="course-detail-images"
            />
          </CardContent>
        </Card>

        {/* 학습 목표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              학습 목표 (상세페이지 "무엇을 배우게 될까요?" 섹션)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.what_you_learn.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...course.what_you_learn];
                    newGoals[index] = e.target.value;
                    setCourse({ ...course, what_you_learn: newGoals });
                  }}
                  placeholder="학습 목표를 입력하세요"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newGoals = course.what_you_learn.filter((_, i) => i !== index);
                    setCourse({ ...course, what_you_learn: newGoals });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => setCourse({ ...course, what_you_learn: [...course.what_you_learn, ''] })}
            >
              <Plus className="h-4 w-4 mr-2" />
              학습 목표 추가
            </Button>
          </CardContent>
        </Card>


        {/* 커리큘럼 */}
        <Card>
          <CardHeader>
            <CardTitle>커리큘럼 (상세페이지 "강의 내용" 섹션)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {course.curriculum.map((section) => (
              <div key={section.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateCurriculumSection(section.id, { title: e.target.value })}
                    placeholder="섹션 제목"
                    className="font-medium"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCurriculumSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 세션 목록 */}
                <div className="ml-4 space-y-3">
                  {section.sessions.map((session) => (
                    <div key={session.id} className="border rounded p-3 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <Input
                          value={session.title}
                          onChange={(e) => updateSession(section.id, session.id, { title: e.target.value })}
                          placeholder="세션 제목"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={session.duration}
                            onChange={(e) => updateSession(section.id, session.id, { duration: Number(e.target.value) })}
                            placeholder="30"
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">분</span>
                          <div className="flex items-center gap-2 ml-auto">
                            <Switch
                              checked={session.isPreview}
                              onCheckedChange={(checked) => updateSession(section.id, session.id, { isPreview: checked })}
                            />
                            <Label className="text-sm">미리보기</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSession(section.id, session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Textarea
                        value={session.description}
                        onChange={(e) => updateSession(section.id, session.id, { description: e.target.value })}
                        placeholder="세션 설명"
                        rows={2}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSessionToSection(section.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    세션 추가
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addCurriculumSection}
            >
              <Plus className="h-4 w-4 mr-2" />
              섹션 추가
            </Button>
          </CardContent>
        </Card>

        {/* 판매 옵션 */}
        <Card>
          <CardHeader>
            <CardTitle>판매 옵션 (상세페이지 결제 창의 "포함 혜택" 섹션)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {course.options.map((option) => (
              <div key={option.id} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>옵션명</Label>
                    <Input
                      value={option.name}
                      onChange={(e) => updateOption(option.id, { name: e.target.value })}
                      placeholder="옵션명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>가격</Label>
                    <Input
                      type="number"
                      value={option.price}
                      onChange={(e) => updateOption(option.id, { price: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>포함 혜택</Label>
                  <div className="space-y-2">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...option.features];
                            newFeatures[index] = e.target.value;
                            updateOption(option.id, { features: newFeatures });
                          }}
                          placeholder="혜택을 입력하세요"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFeatures = option.features.filter((_, i) => i !== index);
                            updateOption(option.id, { features: newFeatures });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOption(option.id, { features: [...option.features, ''] })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      혜택 추가
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              옵션 추가
            </Button>
          </CardContent>
        </Card>

        {/* SEO 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">메타 제목</Label>
              <Input
                id="meta_title"
                value={course.meta_title || ''}
                onChange={(e) => setCourse({ ...course, meta_title: e.target.value })}
                placeholder="검색엔진에 표시될 제목 (60자 이내 권장)"
                maxLength={60}
              />
              <p className="text-sm text-muted-foreground">
                {(course.meta_title || '').length}/60 글자
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">메타 설명</Label>
              <Textarea
                id="meta_description"
                value={course.meta_description || ''}
                onChange={(e) => setCourse({ ...course, meta_description: e.target.value })}
                placeholder="검색 결과에 표시될 설명 (160자 이내 권장)"
                maxLength={160}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                {(course.meta_description || '').length}/160 글자
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">키워드</Label>
              <Input
                id="meta_keywords"
                value={course.meta_keywords || ''}
                onChange={(e) => setCourse({ ...course, meta_keywords: e.target.value })}
                placeholder="키워드1, 키워드2, 키워드3 (쉼표로 구분)"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseEdit;