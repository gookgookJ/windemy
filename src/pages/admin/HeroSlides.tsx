import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Upload, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [previewCurrentSlide, setPreviewCurrentSlide] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    course_id: 'none',
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

  // 미리보기 자동 슬라이드
  useEffect(() => {
    if (!isPreviewPlaying || slides.length === 0) return;
    
    const timer = setInterval(() => {
      setPreviewCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length, isPreviewPlaying]);

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
        course_id: formData.course_id === 'none' ? null : formData.course_id || null,
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
      course_id: 'none',
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
      course_id: slide.course_id || 'none',
      background_color: slide.background_color,
      is_active: slide.is_active
    });
    setIsDialogOpen(true);
  };

  const getSlideIndex = (offset: number) => {
    return (previewCurrentSlide + offset + slides.length) % slides.length;
  };

  const activeSlides = slides.filter(slide => slide.is_active);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-medium text-muted-foreground">로딩중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">히어로 슬라이드 관리</h1>
              <p className="text-gray-600">
                메인페이지 히어로 섹션에 표시될 슬라이드를 관리합니다. (최대 10개)
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingSlide(null)} 
                  disabled={slides.length >= 10}
                  size="lg"
                  className="shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  슬라이드 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">
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
                }} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="title" className="text-sm font-medium">제목 *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subtitle" className="text-sm font-medium">부제목</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="course" className="text-sm font-medium">연결할 강의</Label>
                      <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="강의를 선택하세요 (선택사항)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">연결 안함</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium">설명</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="background-color" className="text-sm font-medium">배경 색상</Label>
                      <Select value={formData.background_color} onValueChange={(value) => setFormData({ ...formData, background_color: value })}>
                        <SelectTrigger className="mt-1">
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
                      <Label htmlFor="image-upload" className="text-sm font-medium">
                        이미지 업로드 {!editingSlide && '*'}
                        <span className="text-xs text-gray-500 ml-2">
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

                    <div className="md:col-span-2 flex items-center space-x-3 pt-2">
                      <Switch
                        id="is-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is-active" className="text-sm font-medium">활성화</Label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      취소
                    </Button>
                    <Button type="submit" disabled={uploading} className="min-w-[100px]">
                      {uploading ? '업로드 중...' : editingSlide ? '수정' : '추가'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 미리보기 섹션 */}
        {activeSlides.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                실시간 미리보기
                <span className="text-sm font-normal text-muted-foreground">
                  (메인페이지에서 보이는 모습)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[280px] overflow-hidden bg-white rounded-lg border">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="flex w-full items-center justify-center">
                    
                    {/* Left Panel */}
                    <div className="flex-1 relative opacity-40 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-r-lg"
                         onClick={() => setPreviewCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
                         style={{ height: '240px' }}>
                      <div className="absolute -right-16 top-0 w-[500px] h-[240px] rounded-lg overflow-hidden shadow-md">
                        <div className={cn("absolute inset-0 bg-gradient-to-br rounded-lg", activeSlides[getSlideIndex(-1)]?.background_color)}>
                          <div className="flex items-center h-full">
                            <div className="text-white space-y-2 px-8 flex-1">
                              <h3 className="text-lg font-bold">
                                {activeSlides[getSlideIndex(-1)]?.title}
                              </h3>
                              <p className="text-sm opacity-90">
                                {activeSlides[getSlideIndex(-1)]?.subtitle}
                              </p>
                            </div>
                            <div className="pr-8">
                              <img
                                src={activeSlides[getSlideIndex(-1)]?.image_url}
                                alt={activeSlides[getSlideIndex(-1)]?.title}
                                className="w-24 h-32 object-cover rounded-lg shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Panel */}
                    <div className="relative z-10 mx-3">
                      <div className="relative w-[500px] h-[240px] rounded-lg overflow-hidden shadow-lg">
                        <div className={cn("absolute inset-0 bg-gradient-to-br", activeSlides[previewCurrentSlide]?.background_color)}>
                          <div className="flex items-center h-full">
                            <div className="text-white space-y-3 px-8 flex-1">
                              <h2 className="text-xl font-bold leading-tight">
                                {activeSlides[previewCurrentSlide]?.title}
                              </h2>
                              <h3 className="text-base font-medium opacity-90">
                                {activeSlides[previewCurrentSlide]?.subtitle}
                              </h3>
                              <p className="text-xs opacity-80">
                                {activeSlides[previewCurrentSlide]?.description}
                              </p>
                            </div>
                            <div className="pr-8">
                              <img
                                src={activeSlides[previewCurrentSlide]?.image_url}
                                alt={activeSlides[previewCurrentSlide]?.title}
                                className="w-32 h-40 object-cover rounded-lg shadow-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 relative opacity-40 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-l-lg"
                         onClick={() => setPreviewCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
                         style={{ height: '240px' }}>
                      <div className="absolute -left-16 top-0 w-[500px] h-[240px] rounded-lg overflow-hidden shadow-md">
                        <div className={cn("absolute inset-0 bg-gradient-to-br rounded-lg", activeSlides[getSlideIndex(1)]?.background_color)}>
                          <div className="flex items-center h-full">
                            <div className="text-white space-y-2 px-8 flex-1">
                              <h3 className="text-lg font-bold">
                                {activeSlides[getSlideIndex(1)]?.title}
                              </h3>
                              <p className="text-sm opacity-90">
                                {activeSlides[getSlideIndex(1)]?.subtitle}
                              </p>
                            </div>
                            <div className="pr-8">
                              <img
                                src={activeSlides[getSlideIndex(1)]?.image_url}
                                alt={activeSlides[getSlideIndex(1)]?.title}
                                className="w-24 h-32 object-cover rounded-lg shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative w-[500px]">
                    <div className="absolute bottom-3 right-6 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
                        className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                        className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      
                      <div className="bg-black/50 rounded-full px-2 py-1 text-white text-xs font-medium">
                        {previewCurrentSlide + 1} / {activeSlides.length}
                      </div>
                      
                      <button
                        onClick={() => setPreviewCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
                        className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 슬라이드 목록 */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>슬라이드 목록 ({slides.length}/10)</CardTitle>
          </CardHeader>
          <CardContent>
            {slides.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">등록된 슬라이드가 없습니다</p>
                <p className="text-sm">첫 번째 히어로 슬라이드를 추가해보세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="flex items-center gap-4 p-6 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === slides.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{slide.subtitle}</p>
                      )}
                      {slide.course && (
                        <p className="text-xs text-blue-600 mt-2 truncate">
                          📚 연결된 강의: {slide.course.title}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                          순서: {slide.order_index}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          slide.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {slide.is_active ? '✓ 활성' : '✕ 비활성'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(slide)}
                        className="h-9 px-3"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(slide.id)}
                        className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
};

export default HeroSlides;