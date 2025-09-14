import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/ui/file-upload';

const courseSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요'),
  short_description: z.string().min(1, '간단한 설명을 입력해주세요'),
  price: z.number().min(0, '가격은 0 이상이어야 합니다'),
  level: z.string().min(1, '난이도를 선택해주세요'),
  duration_hours: z.number().min(1, '시간을 입력해주세요'),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  instructor_id: z.string().min(1, '강사를 선택해주세요'),
  thumbnail_path: z.string().optional(),
  detail_image_path: z.string().optional(),
  is_hot: z.boolean().optional(),
  is_new: z.boolean().optional(),
});

interface CourseFormProps {
  courseId?: string;
  onSave?: () => void;
}

interface Category {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  disabled?: boolean;
}

interface CourseOption {
  id?: string;
  name: string;
  price: number;
  original_price?: number;
  benefits: string[];
}

const CourseForm = ({ courseId, onSave }: CourseFormProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([{
    name: '온라인 강의',
    price: 0,
    original_price: 0,
    benefits: ['']
  }]);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      short_description: '',
      price: 0,
      level: 'beginner',
      duration_hours: 1,
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
      // Source: instructors table
      const { data: instructorsRows, error: insErr } = await supabase
        .from('instructors')
        .select('id, full_name, email')
        .order('full_name');

      if (insErr) throw insErr;

      const emails = (instructorsRows || []).map((i: any) => i.email).filter(Boolean);
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, email')
        .in('email', emails);

      if (profErr) throw profErr;

      const profileByEmail = new Map<string, string>((profiles || []).map((p: any) => [p.email, p.id]));

      const finalList = (instructorsRows || []).map((i: any) => ({
        value: profileByEmail.get(i.email) || `create:${i.email}`,
        full_name: i.full_name,
        email: i.email,
      }));

      setInstructors(finalList as any);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleInstructorSelect = async (val: string) => {
    try {
      if (val.startsWith('create:')) {
        const email = val.slice(7);
        const target: any = (instructors as any[]).find((i: any) => i.email === email);
        const full_name = target?.full_name || email;
        const { data, error } = await supabase.functions.invoke('manage-instructor', {
          body: { email, full_name, role: 'instructor' },
        });
        if (error) throw error;
        const newId = (data as any)?.userId || (data as any)?.user_id || (data as any)?.id;
        if (newId) {
          form.setValue('instructor_id', newId, { shouldValidate: true });
          await fetchInstructors();
        }
      } else {
        form.setValue('instructor_id', val, { shouldValidate: true });
      }
    } catch (e: any) {
      console.error('Failed to set instructor:', e);
      toast({ title: '오류', description: '강사 선택에 실패했습니다.', variant: 'destructive' });
    }
  };
  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Set form values
      form.reset({
        title: courseData.title,
        description: courseData.description || '',
        short_description: courseData.short_description || '',
        price: courseData.price,
        level: courseData.level,
        duration_hours: courseData.duration_hours,
        category_id: courseData.category_id,
        instructor_id: courseData.instructor_id || '',
        thumbnail_path: courseData.thumbnail_path || '',
        detail_image_path: courseData.detail_image_path || '',
        is_hot: courseData.is_hot || false,
        is_new: courseData.is_new || false,
      });

      setWhatYouWillLearn(courseData.what_you_will_learn || ['']);
      setRequirements(courseData.requirements || ['']);

      // Fetch course options
      const { data: optionsData, error: optionsError } = await supabase
        .from('course_options')
        .select('*')
        .eq('course_id', courseId);

      if (optionsError) throw optionsError;
      setCourseOptions(optionsData || []);

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
    setSaving(true);
    try {
      const courseData = {
        title: values.title,
        description: values.description,
        short_description: values.short_description,
        price: values.price,
        level: values.level,
        duration_hours: values.duration_hours,
        category_id: values.category_id,
        instructor_id: values.instructor_id,
        thumbnail_path: values.thumbnail_path,
        detail_image_path: values.detail_image_path,
        what_you_will_learn: whatYouWillLearn.filter(item => item.trim()),
        requirements: requirements.filter(item => item.trim()),
        is_published: false,
        is_hot: values.is_hot || false,
        is_new: values.is_new || false,
      };

      let savedCourseId = courseId;

      if (courseId) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);

        if (error) throw error;
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;
        savedCourseId = data.id;
      }

      // Save course options
      if (savedCourseId) {
        // Delete existing options
        await supabase
          .from('course_options')
          .delete()
          .eq('course_id', savedCourseId);

        // Insert new options
        const optionsToSave = courseOptions.map(option => ({
          course_id: savedCourseId,
          name: option.name,
          price: option.price,
          original_price: option.original_price,
          benefits: option.benefits.filter(benefit => benefit.trim()),
        }));

        const { error: optionsError } = await supabase
          .from('course_options')
          .insert(optionsToSave);

        if (optionsError) throw optionsError;
      }

      toast({
        title: "성공",
        description: courseId ? "강의가 수정되었습니다." : "강의가 생성되었습니다.",
      });

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "오류",
        description: "강의 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const onSaveDraft = async (values: z.infer<typeof courseSchema>) => {
    setSavingDraft(true);
    try {
      const courseData = {
        title: values.title || '임시저장된 강의',
        description: values.description || '',
        short_description: values.short_description || '',
        price: values.price,
        level: values.level,
        duration_hours: values.duration_hours,
        category_id: values.category_id,
        instructor_id: values.instructor_id,
        thumbnail_path: values.thumbnail_path,
        detail_image_path: values.detail_image_path,
        what_you_will_learn: whatYouWillLearn.filter(item => item.trim()),
        requirements: requirements.filter(item => item.trim()),
        is_published: false,
        is_hot: values.is_hot || false,
        is_new: values.is_new || false,
      };

      let savedCourseId = courseId;

      if (courseId) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);

        if (error) throw error;
      } else {
        // Create new course as draft
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;
        savedCourseId = data.id;
      }

      // Save course options
      if (savedCourseId) {
        // Delete existing options
        await supabase
          .from('course_options')
          .delete()
          .eq('course_id', savedCourseId);

        // Insert new options
        const optionsToSave = courseOptions.map(option => ({
          course_id: savedCourseId,
          name: option.name,
          price: option.price,
          original_price: option.original_price,
          benefits: option.benefits.filter(benefit => benefit.trim()),
        }));

        const { error: optionsError } = await supabase
          .from('course_options')
          .insert(optionsToSave);

        if (optionsError) throw optionsError;
      }

      toast({
        title: "임시저장 완료",
        description: "강의가 임시저장되었습니다.",
      });

      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "오류",
        description: "임시저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const addWhatYouWillLearn = () => {
    setWhatYouWillLearn([...whatYouWillLearn, '']);
  };

  const removeWhatYouWillLearn = (index: number) => {
    setWhatYouWillLearn(whatYouWillLearn.filter((_, i) => i !== index));
  };

  const updateWhatYouWillLearn = (index: number, value: string) => {
    const updated = [...whatYouWillLearn];
    updated[index] = value;
    setWhatYouWillLearn(updated);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addCourseOption = () => {
    setCourseOptions([...courseOptions, {
      name: '',
      price: 0,
      original_price: 0,
      benefits: ['']
    }]);
  };

  const removeCourseOption = (index: number) => {
    setCourseOptions(courseOptions.filter((_, i) => i !== index));
  };

  const updateCourseOption = (index: number, field: keyof CourseOption, value: any) => {
    const updated = [...courseOptions];
    updated[index] = { ...updated[index], [field]: value };
    setCourseOptions(updated);
  };

  const addBenefit = (optionIndex: number) => {
    const updated = [...courseOptions];
    updated[optionIndex].benefits.push('');
    setCourseOptions(updated);
  };

  const removeBenefit = (optionIndex: number, benefitIndex: number) => {
    const updated = [...courseOptions];
    updated[optionIndex].benefits = updated[optionIndex].benefits.filter((_, i) => i !== benefitIndex);
    setCourseOptions(updated);
  };

  const updateBenefit = (optionIndex: number, benefitIndex: number, value: string) => {
    const updated = [...courseOptions];
    updated[optionIndex].benefits[benefitIndex] = value;
    setCourseOptions(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {courseId ? '강의 수정' : '새 강의 만들기'}
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            type="button"
            variant="outline"
            onClick={() => form.handleSubmit(onSaveDraft)()} 
            disabled={savingDraft || saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingDraft ? '임시저장 중...' : '임시저장'}
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={saving || savingDraft}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="content">강의 내용</TabsTrigger>
              <TabsTrigger value="pricing">가격 옵션</TabsTrigger>
              <TabsTrigger value="media">미디어</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
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

                  <FormField
                    control={form.control}
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>간단한 설명</FormLabel>
                        <FormControl>
                          <Input placeholder="강의에 대한 간단한 설명" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상세 설명</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="강의에 대한 상세한 설명을 입력하세요" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>카테고리</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="카테고리 선택" />
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
                      control={form.control}
                      name="instructor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>강사</FormLabel>
                          <Select onValueChange={handleInstructorSelect} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="강사 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {instructors.map((instructor: any) => (
                                <SelectItem key={instructor.value} value={instructor.value}>
                                  {instructor.full_name} ({instructor.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>난이도</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="난이도 선택" />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>총 시간 (시간)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="예: 10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>기본 가격 (원)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="예: 100000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>태그 설정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="is_hot"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>인기 강의 (BEST)</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  강의에 BEST 태그를 표시합니다
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_new"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>신규 강의 (NEW)</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  강의에 NEW 태그를 표시합니다
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="w-4 h-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>학습 목표</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {whatYouWillLearn.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="학습 목표를 입력하세요"
                        value={item}
                        onChange={(e) => updateWhatYouWillLearn(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeWhatYouWillLearn(index)}
                        disabled={whatYouWillLearn.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addWhatYouWillLearn}>
                    <Plus className="w-4 h-4 mr-2" />
                    학습 목표 추가
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>수강 요구사항</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requirements.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="요구사항을 입력하세요"
                        value={item}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                        disabled={requirements.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRequirement}>
                    <Plus className="w-4 h-4 mr-2" />
                    요구사항 추가
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              {courseOptions.map((option, optionIndex) => (
                <Card key={optionIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>가격 옵션 {optionIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCourseOption(optionIndex)}
                        disabled={courseOptions.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">옵션 이름</label>
                        <Input
                          placeholder="예: 온라인 강의"
                          value={option.name}
                          onChange={(e) => updateCourseOption(optionIndex, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">판매 가격</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={option.price}
                          onChange={(e) => updateCourseOption(optionIndex, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">정가</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={option.original_price || ''}
                          onChange={(e) => updateCourseOption(optionIndex, 'original_price', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">혜택</label>
                      <div className="space-y-2">
                        {option.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <Input
                              placeholder="혜택을 입력하세요"
                              value={benefit}
                              onChange={(e) => updateBenefit(optionIndex, benefitIndex, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBenefit(optionIndex, benefitIndex)}
                              disabled={option.benefits.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                  </CardContent>
                </Card>
              ))}
              
              <Button type="button" variant="outline" onClick={addCourseOption}>
                <Plus className="w-4 h-4 mr-2" />
                가격 옵션 추가
              </Button>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>미디어 파일</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Thumbnail Image Upload */}
                  <FormField
                    control={form.control}
                    name="thumbnail_path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>썸네일 이미지</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <FileUpload
                              bucket="course-thumbnails"
                              accept="image/*"
                              onUpload={(url) => field.onChange(url)}
                              currentFile={field.value}
                              label="썸네일 이미지 업로드"
                              description="강의 목록에서 표시될 썸네일 이미지를 업로드하세요."
                            />
                            {field.value && (
                              <div className="mt-4">
                                <img 
                                  src={field.value} 
                                  alt="썸네일 미리보기" 
                                  className="w-48 h-27 object-cover rounded-lg border"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Detail Image Upload */}
                  <FormField
                    control={form.control}
                    name="detail_image_path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상세페이지 이미지</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <FileUpload
                              bucket="course-detail-images"
                              accept="image/*"
                              onUpload={(url) => field.onChange(url)}
                              currentFile={field.value}
                              label="상세페이지 이미지 업로드"
                              description="강의 상세페이지에서 표시될 이미지를 업로드하세요."
                            />
                            {field.value && (
                              <div className="mt-4">
                                <img 
                                  src={field.value} 
                                  alt="상세 이미지 미리보기" 
                                  className="w-full max-w-md h-auto object-cover rounded-lg border"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

export default CourseForm;