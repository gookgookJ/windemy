import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  order_index: number;
  is_active: boolean;
  background_color: string;
  course?: {
    id: string;
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

const HeroSlides = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    course_id: '',
    background_color: 'from-blue-400 to-blue-600',
    is_active: true
  });

  const backgroundColors = [
    { label: '블루 그라데이션', value: 'from-blue-400 to-blue-600' },
    { label: '핑크 그라데이션', value: 'from-pink-400 to-red-400' },
    { label: '핑크 파스텔', value: 'from-pink-300 to-pink-500' },
    { label: '그린-블루', value: 'from-green-400 to-blue-500' },
    { label: '퍼플 그라데이션', value: 'from-purple-400 to-purple-600' },
    { label: '오렌지 그라데이션', value: 'from-orange-400 to-orange-600' }
  ];

  useEffect(() => {
    fetchSlides();
    fetchCourses();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select(`
          *,
          course:courses(id, title)
        `)
        .order('order_index');

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast({
        title: "오류",
        description: "슬라이드를 불러오는데 실패했습니다.",
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
        .select('id, title')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return null;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "오류",
        description: "파일 크기는 5MB 이하여야 합니다.",
        variant: "destructive"
      });
      return null;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `hero-slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "오류",
        description: "이미지 업로드에 실패했습니다.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, imageUrl?: string) => {
    e.preventDefault();
    
    if (!imageUrl && !editingSlide) {
      toast({
        title: "오류",
        description: "이미지를 업로드해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const slideData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        course_id: formData.course_id || null,
        background_color: formData.background_color,
        is_active: formData.is_active,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (editingSlide) {
        const { error } = await supabase
          .from('hero_slides')
          .update(slideData)
          .eq('id', editingSlide.id);

        if (error) throw error;
        toast({
          title: "성공",
          description: "슬라이드가 수정되었습니다."
        });
      } else {
        // 새 슬라이드의 order_index 계산
        const maxOrder = Math.max(...slides.map(s => s.order_index), 0);
        
        const { error } = await supabase
          .from('hero_slides')
          .insert({
            ...slideData,
            image_url: imageUrl!,
            order_index: maxOrder + 1
          });

        if (error) throw error;
        toast({
          title: "성공",
          description: "슬라이드가 추가되었습니다."
        });
      }

      resetForm();
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      toast({
        title: "오류",
        description: "슬라이드 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "성공",
        description: "슬라이드가 삭제되었습니다."
      });
      fetchSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        title: "오류",
        description: "슬라이드 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ order_index: newOrder })
        .eq('id', id);

      if (error) throw error;
      fetchSlides();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "오류",
        description: "순서 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    // 순서 교체
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    
    // 데이터베이스 업데이트
    updateOrder(newSlides[index].id, index + 1);
    updateOrder(newSlides[targetIndex].id, targetIndex + 1);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      course_id: '',
      background_color: 'from-blue-400 to-blue-600',
      is_active: true
    });
    setEditingSlide(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      course_id: slide.course_id || '',
      background_color: slide.background_color,
      is_active: slide.is_active
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">로딩중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">히어로 슬라이드 관리</h1>
          <p className="text-muted-foreground mt-2">
            메인페이지 히어로 섹션에 표시될 슬라이드를 관리합니다. (최대 10개)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSlide(null)} disabled={slides.length >= 10}>
              <Plus className="h-4 w-4 mr-2" />
              슬라이드 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? '슬라이드 수정' : '새 슬라이드 추가'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fileInput = document.getElementById('image-upload') as HTMLInputElement;
              const file = fileInput?.files?.[0];
              
              if (!editingSlide && !file) {
                toast({
                  title: "오류",
                  description: "이미지를 선택해주세요.",
                  variant: "destructive"
                });
                return;
              }

              if (file) {
                handleImageUpload(file).then((imageUrl) => {
                  if (imageUrl) {
                    handleSubmit(e, imageUrl);
                  }
                });
              } else {
                handleSubmit(e);
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subtitle">부제목</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="course">연결할 강의</Label>
                <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="강의를 선택하세요 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">연결 안함</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="background-color">배경 색상</Label>
                <Select value={formData.background_color} onValueChange={(value) => setFormData({ ...formData, background_color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {backgroundColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="image-upload">
                  이미지 업로드 {!editingSlide && '*'}
                  <span className="text-sm text-muted-foreground ml-2">
                    (권장: 760x340px, 최대 5MB)
                  </span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is-active">활성화</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? '업로드 중...' : editingSlide ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>슬라이드 목록 ({slides.length}/10)</CardTitle>
        </CardHeader>
        <CardContent>
          {slides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 슬라이드가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <div key={slide.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{slide.title}</h3>
                    {slide.subtitle && (
                      <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                    )}
                    {slide.course && (
                      <p className="text-xs text-blue-600">연결된 강의: {slide.course.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        순서: {slide.order_index}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        slide.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slide.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(slide)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroSlides;