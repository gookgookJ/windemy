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
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  level: z.string().min(1, '난이도를 선택해주세요'),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  instructor_id: z.string().min(1, '강사를 선택해주세요'),
  thumbnail_path: z.string().optional(),
  detail_image_path: z.string().optional(),
  is_hot: z.boolean().optional(),
  is_new: z.boolean().optional(),
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
  email: string;
}

interface CourseOption {
  name: string;
  price: number;
  benefits: string[];
}

export const CourseForm: React.FC<CourseFormProps> = ({ courseId, onSuccess }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [courseData, setCourseData] = useState({
    title: '',
    price: 0,
    level: 'beginner',
    category_id: '',
    instructor_id: '',
    thumbnail_path: '',
    detail_image_path: '',
    is_hot: false,
    is_new: false,
    whatYouWillLearn: [''],
    requirements: [''],
    courseOptions: [{ name: '기본 패키지', price: 0, benefits: [''] }]
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
      is_hot: false,
      is_new: false,
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'instructor')
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

      // Set form values
      form.reset({
        title: courseData.title,
        price: courseData.price,
        level: courseData.level,
        category_id: courseData.category_id,
        instructor_id: courseData.instructor_id || '',
        thumbnail_path: courseData.thumbnail_path || '',
        detail_image_path: courseData.detail_image_path || '',
        is_hot: courseData.is_hot || false,
        is_new: courseData.is_new || false
      });

      setCourseData(prev => ({
        ...prev,
        title: courseData.title,
        price: courseData.price,
        level: courseData.level,
        category_id: courseData.category_id,
        instructor_id: courseData.instructor_id || '',
        thumbnail_path: courseData.thumbnail_path || '',
        detail_image_path: courseData.detail_image_path || '',
        is_hot: courseData.is_hot || false,
        is_new: courseData.is_new || false,
        whatYouWillLearn: courseData.what_you_will_learn || ['']
      }));

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "오류",
        description: "강의 데이터를 불러오는데 실패했습니다.",
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
        is_hot: values.is_hot,
        is_new: values.is_new,
        is_published: false,
        course_type: 'VOD',
        what_you_will_learn: courseData.whatYouWillLearn.filter(item => item.trim() !== '')
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

      // Save course options
      if (courseData.courseOptions.length > 0) {
        // First delete existing options if updating
        if (courseId) {
          await supabase
            .from('course_options')
            .delete()
            .eq('course_id', courseId);
        }

        const optionsToInsert = courseData.courseOptions
          .filter(option => option.name.trim() && option.price >= 0)
          .map(option => ({
            course_id: result.data.id,
            name: option.name,
            price: option.price,
            benefits: option.benefits.filter(benefit => benefit.trim())
          }));

        if (optionsToInsert.length > 0) {
          const { error: optionsError } = await supabase
            .from('course_options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }
      }

      toast({
        title: "성공",
        description: courseId ? "강의가 수정되었습니다." : "강의가 생성되었습니다.",
      });

      if (onSuccess) {
        onSuccess();
      }

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
        is_hot: values.is_hot,
        is_new: values.is_new,
        is_published: false,
        course_type: 'VOD',
        what_you_will_learn: courseData.whatYouWillLearn.filter(item => item.trim() !== '')
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
        description: "강의가 임시저장되었습니다.",
      });

    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "오류",
        description: "임시저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // List management functions
  const addListItem = (field: 'whatYouWillLearn' | 'requirements') => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateListItem = (field: 'whatYouWillLearn' | 'requirements', index: number, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field: 'whatYouWillLearn' | 'requirements', index: number) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Course options management
  const addCourseOption = () => {
    setCourseData(prev => ({
      ...prev,
      courseOptions: [...prev.courseOptions, { name: '', price: 0, benefits: [''] }]
    }));
  };

  const updateCourseOption = (index: number, field: keyof CourseOption, value: any) => {
    setCourseData(prev => ({
      ...prev,
      courseOptions: prev.courseOptions.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeCourseOption = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      courseOptions: prev.courseOptions.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = (optionIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      courseOptions: prev.courseOptions.map((option, i) => 
        i === optionIndex 
          ? { ...option, benefits: [...option.benefits, ''] }
          : option
      )
    }));
  };

  const updateBenefit = (optionIndex: number, benefitIndex: number, value: string) => {
    setCourseData(prev => ({
      ...prev,
      courseOptions: prev.courseOptions.map((option, i) => 
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
    setCourseData(prev => ({
      ...prev,
      courseOptions: prev.courseOptions.map((option, i) => 
        i === optionIndex 
          ? { ...option, benefits: option.benefits.filter((_, j) => j !== benefitIndex) }
          : option
      )
    }));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">기본 정보</TabsTrigger>
            <TabsTrigger value="learning">학습 내용</TabsTrigger>
            <TabsTrigger value="options">판매 옵션</TabsTrigger>
            <TabsTrigger value="media">미디어</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="강사를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.full_name} ({instructor.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="is_hot"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">인기 강의</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  name="is_new"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">신규 강의</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <div>
              <Label className="text-base font-medium">배울 내용</Label>
              <div className="space-y-2 mt-2">
                {courseData.whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateListItem('whatYouWillLearn', index, e.target.value)}
                      placeholder="학습자가 배울 내용을 입력하세요"
                    />
                    {courseData.whatYouWillLearn.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeListItem('whatYouWillLearn', index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem('whatYouWillLearn')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  항목 추가
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div>
              <Label className="text-base font-medium">판매 옵션</Label>
              <div className="space-y-4 mt-2">
                {courseData.courseOptions.map((option, optionIndex) => (
                  <div key={optionIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">옵션 #{optionIndex + 1}</h4>
                      {courseData.courseOptions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCourseOption(optionIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>옵션 이름</Label>
                        <Input
                          value={option.name}
                          onChange={(e) => updateCourseOption(optionIndex, 'name', e.target.value)}
                          placeholder="예: 기본 패키지"
                        />
                      </div>
                      <div>
                        <Label>가격</Label>
                        <Input
                          type="number"
                          value={option.price}
                          onChange={(e) => updateCourseOption(optionIndex, 'price', parseInt(e.target.value) || 0)}
                          placeholder="가격"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>포함 혜택</Label>
                      <div className="space-y-2 mt-2">
                        {option.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex gap-2">
                            <Input
                              value={benefit}
                              onChange={(e) => updateBenefit(optionIndex, benefitIndex, e.target.value)}
                              placeholder="포함 혜택을 입력하세요"
                            />
                            {option.benefits.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeBenefit(optionIndex, benefitIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addBenefit(optionIndex)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          혜택 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCourseOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 판매 옵션 추가
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="space-y-6">
              <FormField
                name="thumbnail_path"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>썸네일 이미지</FormLabel>
                    <FormControl>
                      <FileUpload
                        bucket="course-thumbnails"
                        accept="image/*"
                        maxSize={5}
                        onUpload={(url) => field.onChange(url)}
                        currentFile={field.value}
                        label="썸네일 이미지"
                        description="강의 목록에서 표시될 썸네일 이미지를 업로드하세요."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="detail_image_path"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상세 이미지</FormLabel>
                    <FormControl>
                      <FileUpload
                        bucket="course-detail-images"
                        accept="image/*"
                        maxSize={10}
                        onUpload={(url) => field.onChange(url)}
                        currentFile={field.value}
                        label="상세 이미지"
                        description="강의 상세페이지에서 표시될 이미지를 업로드하세요."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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