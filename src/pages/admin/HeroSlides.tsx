import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Upload, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, Eye, ExternalLink, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/layouts/AdminLayout';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  link_url?: string;
  link_type: 'course' | 'url';
  order_index: number;
  is_active: boolean;
  is_draft?: boolean;
  published_at?: string;
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
    link_url: '',
    link_type: 'course' as 'course' | 'url',
    is_active: true
  });

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
      // Fetch draft slides for editing
      const { data, error } = await supabase
        .from('hero_slides')
        .select(`
          *,
          course:courses(id, title)
        `)
        .eq('is_draft', true)
        .order('order_index');

      if (error) throw error;

      let draftSlides = (data || []).map((slide: any) => ({   
        ...slide,
        link_type: (slide.link_type || 'course') as 'course' | 'url'
      }));

      // If no draft slides exist, create them from published slides
      if (draftSlides.length === 0) {
        const { data: publishedSlides } = await supabase
          .from('hero_slides')
          .select(`
            *,
            course:courses(id, title)
          `)
          .eq('is_draft', false)
          .order('order_index');

        if (publishedSlides && publishedSlides.length > 0) {
          // Create draft versions
          const draftVersions = publishedSlides.map(slide => ({
            title: slide.title,
            subtitle: slide.subtitle,
            description: slide.description,
            image_url: slide.image_url,
            course_id: slide.course_id,
            link_url: slide.link_url,
            link_type: slide.link_type || 'course',
            order_index: slide.order_index,
            is_active: slide.is_active,
            is_draft: true
          }));

          const { data: newDrafts } = await supabase
            .from('hero_slides')
            .insert(draftVersions)
            .select(`
              *,
              course:courses(id, title)
            `);

          if (newDrafts) {
            draftSlides = newDrafts.map((slide: any) => ({
              ...slide,
              link_type: (slide.link_type || 'course') as 'course' | 'url'
            }));
          }
        }
      }

      setSlides(draftSlides);
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
        course_id: formData.link_type === 'course' && formData.course_id !== 'none' ? formData.course_id : null,
        link_url: formData.link_type === 'url' ? formData.link_url : null,
        link_type: formData.link_type,
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
            order_index: maxOrder + 1,
            is_draft: true
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

  const publishSlides = async () => {
    try {
      // Check if published versions exist
      const { data: publishedSlides } = await supabase
        .from('hero_slides')
        .select('id')
        .eq('is_draft', false);

      if (publishedSlides && publishedSlides.length > 0) {
        // Delete existing published slides
        await supabase
          .from('hero_slides')
          .delete()
          .eq('is_draft', false);
      }

      // Create published versions from drafts
      const publishedVersions = slides.map(slide => ({
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        image_url: slide.image_url,
        course_id: slide.course_id,
        link_url: slide.link_url,
        link_type: slide.link_type,
        order_index: slide.order_index,
        is_active: slide.is_active,
        is_draft: false,
        published_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('hero_slides')
        .insert(publishedVersions);

      if (error) throw error;

      toast({
        title: "성공",
        description: "히어로 슬라이드가 라이브에 적용되었습니다."
      });
    } catch (error) {
      console.error('Error publishing slides:', error);
      toast({
        title: "오류",
        description: "슬라이드 적용에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      course_id: 'none',
      link_url: '',
      link_type: 'course',
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
      link_url: slide.link_url || '',
      link_type: slide.link_type || 'course',
      is_active: slide.is_active
    });
    setIsDialogOpen(true);
  };

  const getSlideIndex = (offset: number) => {
    return (previewCurrentSlide + offset + activeSlides.length) % activeSlides.length;
  };

  const activeSlides = slides.filter(slide => slide.is_active);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">히어로 슬라이드 관리</h1>
              <p className="text-gray-600">
                메인페이지 히어로 섹션에 표시될 슬라이드를 관리합니다. (최대 10개)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={publishSlides}
                className="bg-green-600 hover:bg-green-700"
                disabled={slides.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                적용
              </Button>
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
                      <Label htmlFor="link-type" className="text-sm font-medium">연결 방식</Label>
                      <Select value={formData.link_type} onValueChange={(value: 'course' | 'url') => setFormData({ ...formData, link_type: value, course_id: 'none', link_url: '' })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">강의 연결</SelectItem>
                          <SelectItem value="url">링크 연결</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.link_type === 'course' ? (
                      <div>
                        <Label htmlFor="course" className="text-sm font-medium">연결할 강의</Label>
                        <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="강의를 선택하세요" />
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
                    ) : (
                      <div>
                        <Label htmlFor="link-url" className="text-sm font-medium">링크 URL</Label>
                        <Input
                          id="link-url"
                          type="url"
                          value={formData.link_url}
                          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                          placeholder="https://example.com"
                          className="mt-1"
                        />
                      </div>
                    )}

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

                    <div className="md:col-span-2">
                      <Label htmlFor="image-upload" className="text-sm font-medium">
                        이미지 업로드 {!editingSlide && '*'}
                        <span className="text-xs text-gray-500 ml-2">
                          (권장: 1920x400px, 최대 5MB)
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
              <div className="relative h-[380px] overflow-hidden bg-white rounded-lg border">
                {/* Three Panel Layout - 실제 메인페이지와 동일한 구조 */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="flex w-full items-center justify-center">
                    
                    {/* Left Panel (Previous Slide) - Partially visible */}
                    <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-r-2xl"
                         onClick={() => setPreviewCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
                         style={{ height: '340px' }}>
                      <div className="absolute -right-20 top-0 w-[760px] h-[340px] rounded-2xl overflow-hidden">
                        <div className="relative w-full h-full">
                          <img
                            src={activeSlides[getSlideIndex(-1)]?.image_url}
                            alt={activeSlides[getSlideIndex(-1)]?.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center">
                            <div className="text-white space-y-4 px-12 flex-1">
                              <h3 className="text-2xl font-bold drop-shadow-lg">
                                {activeSlides[getSlideIndex(-1)]?.title}
                              </h3>
                              <p className="text-lg opacity-90 drop-shadow-lg">
                                {activeSlides[getSlideIndex(-1)]?.subtitle}
                              </p>
                              <p className="text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg">
                                {activeSlides[getSlideIndex(-1)]?.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center Panel (Current Slide) - Full visible */}
                    <div className="relative z-10 mx-4">
                      <div className="relative w-[760px] h-[340px] rounded-2xl overflow-hidden cursor-pointer">
                        <img
                          src={activeSlides[previewCurrentSlide]?.image_url}
                          alt={activeSlides[previewCurrentSlide]?.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center">
                          <div className="text-white space-y-4 px-12 flex-1">
                            <h2 className="text-3xl font-bold leading-tight drop-shadow-lg">
                              {activeSlides[previewCurrentSlide]?.title}
                            </h2>
                            <h3 className="text-xl font-medium opacity-90 drop-shadow-lg">
                              {activeSlides[previewCurrentSlide]?.subtitle}
                            </h3>
                            <p className="text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg">
                              {activeSlides[previewCurrentSlide]?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel (Next Slide) - Partially visible */}
                    <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-l-2xl"
                         onClick={() => setPreviewCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
                         style={{ height: '340px' }}>
                      <div className="absolute -left-20 top-0 w-[760px] h-[340px] rounded-2xl overflow-hidden">
                        <div className="relative w-full h-full">
                          <img
                            src={activeSlides[getSlideIndex(1)]?.image_url}
                            alt={activeSlides[getSlideIndex(1)]?.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center">
                            <div className="text-white space-y-4 px-12 flex-1">
                              <h3 className="text-2xl font-bold drop-shadow-lg">
                                {activeSlides[getSlideIndex(1)]?.title}
                              </h3>
                              <p className="text-lg opacity-90 drop-shadow-lg">
                                {activeSlides[getSlideIndex(1)]?.subtitle}
                              </p>
                              <p className="text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg">
                                {activeSlides[getSlideIndex(1)]?.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons positioned at center panel bottom right */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative w-[760px]">
                    <div className="absolute bottom-4 right-8 flex items-center gap-3">
                      
                      {/* Navigation Arrows */}
                      <button
                        onClick={() => setPreviewCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
                        className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {/* Play/Pause Button */}
                      <button
                        onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                        className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        {isPreviewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      
                      {/* Slide Counter */}
                      <div className="bg-black/50 rounded-full px-3 py-1.5 text-white text-sm font-medium">
                        {previewCurrentSlide + 1} / {activeSlides.length}
                      </div>
                      
                      <button
                        onClick={() => setPreviewCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
                        className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
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

                    <div className="relative">
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-32 h-20 object-cover rounded-lg shadow-sm"
                      />
                      {!slide.is_active && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-medium">비활성</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{slide.title}</h3>
                        {slide.course && (
                          <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <BookOpen className="h-4 w-4" />
                            <span>강의 연결</span>
                          </div>
                        )}
                        {slide.link_url && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <ExternalLink className="h-4 w-4" />
                            <span>링크 연결</span>
                          </div>
                        )}
                      </div>
                      {slide.subtitle && (
                        <p className="text-gray-600">{slide.subtitle}</p>
                      )}
                      {slide.course && (
                        <p className="text-sm text-gray-500">
                          연결된 강의: {slide.course.title}
                        </p>
                      )}
                      {slide.link_url && (
                        <p className="text-sm text-gray-500">
                          링크: {slide.link_url}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        slide.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {slide.is_active ? '활성' : '비활성'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(slide)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(slide.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
    </AdminLayout>
  );
};

export default HeroSlides;