import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, ChevronUp, ChevronDown, BookOpen, Target, Zap, Crown, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/layouts/AdminLayout';

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  icon_type: 'emoji' | 'lucide' | 'custom';
  icon_value: string;
  section_type: string;
  filter_type: 'manual' | 'category' | 'tag' | 'hot_new';
  filter_value?: string;
  display_limit: number;
  order_index: number;
  is_active: boolean;
  selected_courses?: Course[];
}

interface Course {
  id: string;
  title: string;
  thumbnail_url?: string;
  instructor_name?: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
}

const HomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    icon_type: 'emoji' as 'emoji' | 'lucide' | 'custom',
    icon_value: '📚',
    section_type: 'custom',
    filter_type: 'manual' as 'manual' | 'category' | 'tag' | 'hot_new',
    filter_value: '',
    display_limit: 8,
    is_active: true
  });

  useEffect(() => {
    fetchSections();
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('order_index');

      if (error) throw error;

      // Fetch selected courses for each section
      const sectionsWithCourses = await Promise.all(
        (data || []).map(async (section: any) => {
          if (section.filter_type === 'manual') {
            const { data: sectionCourses } = await supabase
              .from('homepage_section_courses')
              .select(`
                course_id,
                order_index,
                courses:course_id(id, title, thumbnail_url, price, profiles:instructor_id(full_name))
              `)
              .eq('section_id', section.id)
              .order('order_index');

            const selected_courses = (sectionCourses || []).map((sc: any) => ({
              ...sc.courses,
              instructor_name: sc.courses?.profiles?.full_name
            }));

            return { ...section, selected_courses };
          }
          return section;
        })
      );

      setSections(sectionsWithCourses);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "오류",
        description: "섹션을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          thumbnail_url,
          thumbnail_path,
          price,
          profiles:instructor_id(full_name)
        `)
        .eq('is_published', true)
        .order('title');

      if (error) throw error;

      const processedCourses = (data || []).map(course => ({
        ...course,
        instructor_name: course.profiles?.full_name || '운영진',
        thumbnail_url: course.thumbnail_url || course.thumbnail_path
      }));

      setCourses(processedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sectionData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        icon_type: formData.icon_type,
        icon_value: formData.icon_value,
        section_type: formData.section_type,
        filter_type: formData.filter_type,
        filter_value: formData.filter_value || null,
        display_limit: formData.display_limit,
        is_active: formData.is_active
      };

      let sectionId: string;

      if (editingSection) {
        const { error } = await supabase
          .from('homepage_sections')
          .update(sectionData)
          .eq('id', editingSection.id);

        if (error) throw error;
        sectionId = editingSection.id;

        toast({
          title: "성공",
          description: "섹션이 수정되었습니다."
        });
      } else {
        // 새 섹션의 order_index 계산
        const maxOrder = Math.max(...sections.map(s => s.order_index), 0);
        
        const { data: newSection, error } = await supabase
          .from('homepage_sections')
          .insert({
            ...sectionData,
            order_index: maxOrder + 1
          })
          .select()
          .single();

        if (error) throw error;
        sectionId = newSection.id;

        toast({
          title: "성공",
          description: "섹션이 추가되었습니다."
        });
      }

      // 수동 선택 모드인 경우 선택된 강의들 저장
      if (formData.filter_type === 'manual' && selectedCourses.length > 0) {
        // 기존 강의들 삭제
        await supabase
          .from('homepage_section_courses')
          .delete()
          .eq('section_id', sectionId);

        // 새 강의들 추가
        const coursesToInsert = selectedCourses.map((courseId, index) => ({
          section_id: sectionId,
          course_id: courseId,
          order_index: index
        }));

        const { error: coursesError } = await supabase
          .from('homepage_section_courses')
          .insert(coursesToInsert);

        if (coursesError) throw coursesError;
      }

      resetForm();
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "오류",
        description: "섹션 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('homepage_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "성공",
        description: "섹션이 삭제되었습니다."
      });
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "오류",
        description: "섹션 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // 순서 교체
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    try {
      // 데이터베이스 업데이트
      await supabase
        .from('homepage_sections')
        .update({ order_index: index + 1 })
        .eq('id', newSections[index].id);

      await supabase
        .from('homepage_sections')
        .update({ order_index: targetIndex + 1 })
        .eq('id', newSections[targetIndex].id);

      fetchSections();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "오류",
        description: "순서 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      icon_type: 'emoji',
      icon_value: '📚',
      section_type: 'custom',
      filter_type: 'manual',
      filter_value: '',
      display_limit: 8,
      is_active: true
    });
    setSelectedCourses([]);
    setEditingSection(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (section: HomepageSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      icon_type: section.icon_type,
      icon_value: section.icon_value,
      section_type: section.section_type,
      filter_type: section.filter_type,
      filter_value: section.filter_value || '',
      display_limit: section.display_limit,
      is_active: section.is_active
    });
    
    if (section.filter_type === 'manual' && section.selected_courses) {
      setSelectedCourses(section.selected_courses.map(c => c.id));
    } else {
      setSelectedCourses([]);
    }
    
    setIsDialogOpen(true);
  };

  const getIconDisplay = (section: HomepageSection) => {
    if (section.icon_type === 'emoji') {
      return <span className="text-2xl">{section.icon_value}</span>;
    } else if (section.icon_type === 'lucide') {
      const iconMap: Record<string, React.ComponentType<any>> = {
        Zap,
        Crown,
        Monitor,
        BookOpen,
        Target
      };
      const IconComponent = iconMap[section.icon_value] || BookOpen;
      return <IconComponent className="w-6 h-6 text-blue-500" />;
    }
    return <span className="text-2xl">📚</span>;
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-medium text-muted-foreground">로딩중...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">메인 페이지 섹션 관리</h1>
              <p className="text-gray-600">
                메인 페이지에 표시될 강의 섹션을 관리합니다.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingSection(null)} 
                  size="lg"
                  className="shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  섹션 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingSection ? '섹션 수정' : '새 섹션 추가'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title" className="text-sm font-medium">제목 *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="mt-1"
                        placeholder="지금 가장 주목받는 강의"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="subtitle" className="text-sm font-medium">부제목</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="mt-1"
                        placeholder="선택사항"
                      />
                    </div>

                    <div>
                      <Label htmlFor="icon-type" className="text-sm font-medium">아이콘 타입</Label>
                      <Select value={formData.icon_type} onValueChange={(value: any) => setFormData({ ...formData, icon_type: value, icon_value: value === 'emoji' ? '📚' : 'BookOpen' })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emoji">이모지</SelectItem>
                          <SelectItem value="lucide">아이콘</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="icon-value" className="text-sm font-medium">아이콘 값</Label>
                      {formData.icon_type === 'emoji' ? (
                        <Input
                          id="icon-value"
                          value={formData.icon_value}
                          onChange={(e) => setFormData({ ...formData, icon_value: e.target.value })}
                          className="mt-1"
                          placeholder="🔥"
                        />
                      ) : (
                        <Select value={formData.icon_value} onValueChange={(value) => setFormData({ ...formData, icon_value: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BookOpen">책</SelectItem>
                            <SelectItem value="Zap">번개</SelectItem>
                            <SelectItem value="Crown">왕관</SelectItem>
                            <SelectItem value="Monitor">모니터</SelectItem>
                            <SelectItem value="Target">타겟</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="filter-type" className="text-sm font-medium">필터 방식</Label>
                      <Select value={formData.filter_type} onValueChange={(value: any) => setFormData({ ...formData, filter_type: value, filter_value: '' })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">수동 선택</SelectItem>
                          <SelectItem value="category">카테고리별</SelectItem>
                          <SelectItem value="hot_new">인기/신규</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.filter_type === 'category' && (
                      <div>
                        <Label htmlFor="filter-value" className="text-sm font-medium">카테고리</Label>
                        <Select value={formData.filter_value} onValueChange={(value) => setFormData({ ...formData, filter_value: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="카테고리 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="display-limit" className="text-sm font-medium">표시 강의 수</Label>
                      <Input
                        id="display-limit"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.display_limit}
                        onChange={(e) => setFormData({ ...formData, display_limit: parseInt(e.target.value) || 8 })}
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center space-x-3 pt-2">
                      <Switch
                        id="is-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is-active" className="text-sm font-medium">활성화</Label>
                    </div>

                    {/* 수동 선택 모드인 경우 강의 선택 */}
                    {formData.filter_type === 'manual' && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium mb-3 block">표시할 강의 선택</Label>
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-2">
                            {courses.map((course) => (
                              <div 
                                key={course.id}
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedCourses.includes(course.id) 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => toggleCourseSelection(course.id)}
                              >
                                <img 
                                  src={course.thumbnail_url || '/placeholder.svg'} 
                                  alt={course.title}
                                  className="w-12 h-8 object-cover rounded mr-3"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{course.title}</p>
                                  <p className="text-xs text-muted-foreground">{course.instructor_name}</p>
                                </div>
                                <div className="text-right ml-2">
                                  <p className="text-sm font-semibold">{course.price.toLocaleString()}원</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          선택된 강의: {selectedCourses.length}개
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      취소
                    </Button>
                    <Button type="submit" className="min-w-[100px]">
                      {editingSection ? '수정' : '추가'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getIconDisplay(section)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        {!section.is_active && (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                        <Badge variant="outline">
                          {section.filter_type === 'manual' ? '수동 선택' :
                           section.filter_type === 'category' ? '카테고리별' :
                           section.filter_type === 'hot_new' ? '인기/신규' : section.filter_type}
                        </Badge>
                      </div>
                      {section.subtitle && (
                        <p className="text-sm text-muted-foreground mb-2">{section.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>표시 수: {section.display_limit}개</span>
                        {section.filter_value && (
                          <span>필터: {section.filter_value}</span>
                        )}
                        {section.selected_courses && (
                          <span>선택된 강의: {section.selected_courses.length}개</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 선택된 강의들 미리보기 */}
                {section.selected_courses && section.selected_courses.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">선택된 강의:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {section.selected_courses.slice(0, 6).map((course) => (
                        <div key={course.id} className="flex items-center p-2 bg-muted/50 rounded">
                          <img 
                            src={course.thumbnail_url || '/placeholder.svg'} 
                            alt={course.title}
                            className="w-8 h-6 object-cover rounded mr-2"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{course.title}</p>
                          </div>
                        </div>
                      ))}
                      {section.selected_courses.length > 6 && (
                        <div className="flex items-center p-2 bg-muted/30 rounded">
                          <span className="text-xs text-muted-foreground">
                            +{section.selected_courses.length - 6}개 더
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {sections.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">섹션이 없습니다</h3>
                <p className="text-muted-foreground">첫 번째 섹션을 추가해보세요.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default HomepageSections;