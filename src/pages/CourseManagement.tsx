import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CourseOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  benefits: string[];
}

interface Course {
  id?: string;
  title: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  price: number;
  duration_hours: number;
  level: string;
  category_id: string;
  is_published: boolean;
  options: CourseOption[];
}

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return; // 인증 상태 로딩 완료까지 대기
    if (!user) {
      navigate('/auth');
      return;
    }
    // 임시로 관리자 권한 체크 제거 - 테스트용
    // if (!isAdmin) {
    //   navigate('/')
    //   toast({
    //     title: "접근 권한 없음",
    //     description: "관리자 권한이 필요합니다.",
    //     variant: "destructive"
    //   });
    //   return;
    // }
    fetchData();
  }, [user, isAdmin, navigate, authLoading]);

  const fetchData = async () => {
    try {
      const [coursesResponse, categoriesResponse] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*')
      ]);

      // Add default options to courses
      const coursesWithOptions = (coursesResponse.data || []).map(course => ({
        ...course,
        options: [
          {
            id: 'basic',
            name: '온라인 강의 (기본)',
            price: course.price,
            benefits: [
              '수료 후 즉시 적용 가능한 실무 기술',
              '평생 무제한 강의 수강',
              '수료증 발급',
              '질의응답 게시판 이용'
            ]
          }
        ]
      }));

      setCourses(coursesWithOptions);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (courseData: Course) => {
    try {
      if (courseData.id) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            title: courseData.title,
            description: courseData.description,
            short_description: courseData.short_description,
            thumbnail_url: courseData.thumbnail_url,
            price: courseData.price,
            duration_hours: courseData.duration_hours,
            level: courseData.level,
            category_id: courseData.category_id,
            is_published: courseData.is_published
          })
          .eq('id', courseData.id);

        if (error) throw error;

        setCourses(courses.map(course => 
          course.id === courseData.id ? courseData : course
        ));
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert({
            title: courseData.title,
            description: courseData.description,
            short_description: courseData.short_description,
            thumbnail_url: courseData.thumbnail_url,
            price: courseData.price,
            duration_hours: courseData.duration_hours,
            level: courseData.level,
            category_id: courseData.category_id,
            is_published: courseData.is_published,
            instructor_id: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        setCourses([{ ...data, options: courseData.options }, ...courses]);
      }

      setEditingCourse(null);
      toast({
        title: "성공",
        description: `강의가 ${courseData.id ? '수정' : '생성'}되었습니다.`
      });
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "오류",
        description: "강의 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('정말 이 강의를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(course => course.id !== courseId));
      toast({
        title: "성공",
        description: "강의가 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "오류",
        description: "강의 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const CourseForm = ({ course, onSave, onCancel }: {
    course: Course | null;
    onSave: (course: Course) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Course>(course || {
      title: '',
      description: '',
      short_description: '',
      thumbnail_url: '',
      price: 0,
      duration_hours: 0,
      level: 'beginner',
      category_id: '',
      is_published: false,
      options: [
        {
          id: 'basic',
          name: '온라인 강의 (기본)',
          price: 0,
          benefits: [
            '수료 후 즉시 적용 가능한 실무 기술',
            '평생 무제한 강의 수강',
            '수료증 발급',
            '질의응답 게시판 이용'
          ]
        }
      ]
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    const addOption = () => {
      setFormData({
        ...formData,
        options: [
          ...formData.options,
          {
            id: `option_${Date.now()}`,
            name: '',
            price: 0,
            benefits: []
          }
        ]
      });
    };

    const removeOption = (index: number) => {
      setFormData({
        ...formData,
        options: formData.options.filter((_, i) => i !== index)
      });
    };

    const updateOption = (index: number, field: string, value: any) => {
      const updatedOptions = formData.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      );
      setFormData({ ...formData, options: updatedOptions });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{course ? '강의 수정' : '새 강의 만들기'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">강의 제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">기본 가격</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">짧은 설명</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">상세 설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_hours">총 시간</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">난이도</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
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
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
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

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">썸네일 URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>

            {/* Course Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>강의 옵션</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  옵션 추가
                </Button>
              </div>
              
              {formData.options.map((option, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>옵션 {index + 1}</Label>
                      {formData.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="옵션 이름"
                        value={option.name}
                        onChange={(e) => updateOption(index, 'name', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="가격"
                        value={option.price}
                        onChange={(e) => updateOption(index, 'price', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <Textarea
                      placeholder="혜택 (한 줄에 하나씩)"
                      value={option.benefits.join('\n')}
                      onChange={(e) => updateOption(index, 'benefits', e.target.value.split('\n').filter(b => b.trim()))}
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              <Label htmlFor="is_published">강의 공개</Label>
            </div>

            <div className="flex gap-3">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                저장
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">강의 관리</h1>
              <p className="text-muted-foreground">강의를 생성하고 관리하세요</p>
            </div>
            <Button onClick={() => setEditingCourse({} as Course)}>
              <Plus className="w-4 h-4 mr-2" />
              새 강의 만들기
            </Button>
          </div>

          {editingCourse !== null && (
            <div className="mb-8">
              <CourseForm
                course={editingCourse.id ? editingCourse : null}
                onSave={handleSaveCourse}
                onCancel={() => setEditingCourse(null)}
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>강의 목록</CardTitle>
              <CardDescription>등록된 강의들을 확인하고 수정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        가격: {course.price.toLocaleString()}원 |
                        총 {course.duration_hours}시간 |
                        {course.level}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "공개" : "비공개"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseManagement;