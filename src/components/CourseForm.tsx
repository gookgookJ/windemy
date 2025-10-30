import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/ui/file-upload';
import { Plus, Trash2 } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  level: z.string().min(1, '난이도를 선택해주세요'),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  instructor_id: z.string().min(1, '강사를 선택해주세요'),
  thumbnail_path: z.string().optional(),
  detail_image_path: z.string().optional(),
  access_duration_days: z.number().nullable().optional(),
});

interface CourseFormProps {
  courseId?: string;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface CourseOption {
  name: string;
  price: number;
  benefits: string[];
}

export const CourseForm: React.FC<CourseFormProps> = ({ courseId, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [courseData, setCourseData] = useState({
    title: '',
    price: 0,
    level: 'beginner',
    category_id: '',
    instructor_id: '',
    thumbnail_path: '',
    detail_image_path: '',
    requirements: [''],
    course_options: [] as CourseOption[],
    access_duration_days: null as number | null,
    isLifetimeAccess: true
  });

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      price: 0,
      level: 'beginner',
      category_id: '',
      instructor_id: '',
      thumbnail_path: '',
      detail_image_path: '',
      access_duration_days: null,
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchInstructors();
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      // Fetch from instructors table only (managed in admin instructor page)
      const { data, error } = await supabase
        .from('instructors')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (courseData) {
        form.reset({
          title: courseData.title || '',
          price: courseData.price || 0,
          level: courseData.level || 'beginner',
          category_id: courseData.category_id || '',
          instructor_id: courseData.instructor_id || '',
          thumbnail_path: courseData.thumbnail_path || '',
          detail_image_path: courseData.detail_image_path || '',
          access_duration_days: courseData.access_duration_days || null
        });
        
        setCourseData({
          title: courseData.title || '',
          price: courseData.price || 0,
          level: courseData.level || 'beginner',
          category_id: courseData.category_id || '',
          instructor_id: courseData.instructor_id || '',
          thumbnail_path: courseData.thumbnail_path || '',
          detail_image_path: courseData.detail_image_path || '',
          requirements: courseData.requirements || [''],
          course_options: [],
          access_duration_days: courseData.access_duration_days || null,
          isLifetimeAccess: !courseData.access_duration_days
        });
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "오류",
        description: "강의 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof courseSchema>) => {
    setLoading(true);
    try {
      const coursePayload = {
        title: values.title,
        price: values.price,
        level: values.level,
        category_id: values.category_id,
        instructor_id: values.instructor_id || null,
        thumbnail_path: values.thumbnail_path || null,
        detail_image_path: values.detail_image_path || null,
        is_published: false,
        course_type: 'VOD',
        access_duration_days: courseData.isLifetimeAccess ? null : courseData.access_duration_days
      };

      let result;
      if (courseId) {
        // Update existing course
        result = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', courseId)
          .select()
          .single();
      } else {
        // Create new course
        result = await supabase
          .from('courses')
          .insert(coursePayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "성공",
        description: courseId ? "강의가 수정되었습니다." : "강의가 생성되었습니다.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
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

  const onSaveDraft = async (values: z.infer<typeof courseSchema>) => {
    setLoading(true);
    try {
      const coursePayload = {
        title: values.title || '',
        price: values.price,
        level: values.level,
        category_id: values.category_id,
        instructor_id: values.instructor_id || null,
        thumbnail_path: values.thumbnail_path || null,
        detail_image_path: values.detail_image_path || null,
        is_published: false,
        course_type: 'VOD',
        access_duration_days: courseData.isLifetimeAccess ? null : courseData.access_duration_days
      };

      let result;
      if (courseId) {
        result = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', courseId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('courses')
          .insert(coursePayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "성공",
        description: "강의가 임시 저장되었습니다.",
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "오류",
        description: "임시 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addListItem = (field: 'requirements') => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateListItem = (field: 'requirements', index: number, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field: 'requirements', index: number) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="learning">학습 내용</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>강의 제목</FormLabel>
                    <FormControl>
                      <Input placeholder="강의 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="price"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격 (원)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="가격을 입력하세요"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="level"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>난이도</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="난이도를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="category_id"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="instructor_id"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>강사</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="강사를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
               </div>

               <div className="space-y-4 mt-4">
                 <Label className="text-base font-medium">수강 기간 설정</Label>
                 <div className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     id="lifetime-access"
                     checked={courseData.isLifetimeAccess}
                     onChange={(e) => {
                       setCourseData(prev => ({
                         ...prev,
                         isLifetimeAccess: e.target.checked,
                         access_duration_days: e.target.checked ? null : 30
                       }));
                     }}
                     className="h-4 w-4"
                   />
                   <Label htmlFor="lifetime-access" className="cursor-pointer">
                     평생소장
                   </Label>
                 </div>
                 {!courseData.isLifetimeAccess && (
                   <div className="mt-2">
                     <Label>수강 기간 (일)</Label>
                     <Input
                       type="number"
                       min="1"
                       value={courseData.access_duration_days || 30}
                       onChange={(e) => {
                         const days = parseInt(e.target.value, 10) || 30;
                         setCourseData(prev => ({
                           ...prev,
                           access_duration_days: days
                         }));
                       }}
                       placeholder="수강 기간을 입력하세요 (일)"
                     />
                     <p className="text-sm text-muted-foreground mt-1">
                       결제일로부터 {courseData.access_duration_days || 30}일 동안 수강 가능합니다.
                     </p>
                   </div>
                 )}
               </div>
             </div>
           </TabsContent>

           <TabsContent value="learning" className="space-y-4">
            <div>
              <Label className="text-base font-medium">수강 요구사항</Label>
              <div className="space-y-2 mt-2">
                {courseData.requirements.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateListItem('requirements', index, e.target.value)}
                      placeholder="수강에 필요한 요구사항을 입력하세요"
                    />
                    {courseData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeListItem('requirements', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addListItem('requirements')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  항목 추가
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={form.handleSubmit(onSaveDraft)}
            disabled={loading}
            className="flex-1"
          >
            임시 저장
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "저장 중..." : courseId ? "수정하기" : "생성하기"}
          </Button>
        </div>
      </form>
    </Form>
  );
};