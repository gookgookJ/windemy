import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseSession {
  id?: string;
  title: string;
  description: string;
  video_url: string;
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
  price: number;
  duration_hours: number;
  level: string;
  category_id: string;
  what_you_will_learn: string[];
  requirements: string[];
  sessions: CourseSession[];
}

export const AdminCourseCreate = () => {
  const [course, setCourse] = useState<Course>({
    title: '',
    short_description: '',
    description: '',
    thumbnail_url: '',
    detail_image_path: '',
    video_preview_url: '',
    price: 0,
    duration_hours: 0,
    level: 'beginner',
    category_id: '',
    what_you_will_learn: [''],
    requirements: [''],
    sessions: []
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
            ...session,
            course_id: courseData.id
          }));

        if (sessionsToInsert.length > 0) {
          const { error: sessionsError } = await supabase
            .from('course_sessions')
            .insert(sessionsToInsert);

          if (sessionsError) throw sessionsError;
        }
      }

      toast({
        title: "성공",
        description: `강의가 ${isDraft ? '임시저장' : '저장'}되었습니다.`
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">새 강의 만들기</h1>
            <p className="text-muted-foreground">새로운 온라인 강의를 생성하세요</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => saveCourse(true)}
              disabled={loading}
            >
              임시저장
            </Button>
            <Button 
              onClick={() => saveCourse(false)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              저장 및 공개
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">강의 제목 *</Label>
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
                <Label htmlFor="description">상세 설명 *</Label>
                <Textarea
                  id="description"
                  value={course.description}
                  onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="강의 상세 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">가격 (원)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={course.price}
                    onChange={(e) => setCourse(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">총 시간 (시간)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={course.duration_hours}
                    onChange={(e) => setCourse(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="category">카테고리 *</Label>
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
        </div>

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

        {/* 강의 세션 */}
        <Card>
          <CardHeader>
            <CardTitle>강의 세션</CardTitle>
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
                    <Input
                      value={session.video_url}
                      onChange={(e) => updateSession(index, 'video_url', e.target.value)}
                      placeholder="비디오 URL"
                    />
                  </div>
                  
                  <Textarea
                    value={session.description}
                    onChange={(e) => updateSession(index, 'description', e.target.value)}
                    placeholder="세션 설명"
                    rows={2}
                  />
                  
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
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={session.is_free}
                        onChange={(e) => updateSession(index, 'is_free', e.target.checked)}
                      />
                      무료
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={session.is_preview}
                        onChange={(e) => updateSession(index, 'is_preview', e.target.checked)}
                      />
                      미리보기
                    </label>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addSession}
              >
                <Plus className="h-4 w-4 mr-2" />
                세션 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseCreate;