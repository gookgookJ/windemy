import React, { useState } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DetailImage {
  id?: string;
  image_url: string;
  image_name: string;
  section_title: string;
  order_index: number;
}

interface MultiImageUploadProps {
  bucket: string;
  images: DetailImage[];
  onImagesChange: (images: DetailImage[]) => void;
  accept?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  bucket,
  images,
  onImagesChange,
  accept = 'image/*'
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList) => {
    if (uploading) return;

    setUploading(true);
    
    try {
      // 파일을 이름 순서대로 정렬
      const sortedFiles = Array.from(files).sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      const uploadPromises = sortedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${index}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return {
          id: crypto.randomUUID(),
          image_url: data.publicUrl,
          image_name: file.name,
          section_title: '',
          order_index: images.length + index
        };
      });

      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);

      toast({
        title: '업로드 완료',
        description: `${newImages.length}개의 이미지가 업로드되었습니다.`
      });

    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: '업로드 실패',
        description: error.message || '파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => {
    const updatedImages = images
      .filter(img => img.id !== id)
      .map((img, index) => ({ ...img, order_index: index }));
    onImagesChange(updatedImages);
  };

  const updateSectionTitle = (id: string, title: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, section_title: title } : img
    );
    onImagesChange(updatedImages);
  };

  const moveImage = (id: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === images.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedImages = [...images];
    const [movedItem] = reorderedImages.splice(currentIndex, 1);
    reorderedImages.splice(newIndex, 0, movedItem);

    // 순서 업데이트
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order_index: index
    }));

    onImagesChange(updatedImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <Label>상세 이미지 섹션</Label>
      
      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading ? 'cursor-wait' : 'cursor-pointer'
        } ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (uploading) return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = accept;
          input.multiple = true;
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileSelect(files);
          };
          input.click();
        }}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                업로드 중입니다...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                잠시만 기다려주세요
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <div>
              <p className="text-sm font-medium">
                이미지를 선택하거나 드래그해서 업로드하세요
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                💡 파일명 순서대로 자동 정렬됩니다
              </p>
            </div>
            
            <Button variant="outline" size="sm" type="button">
              <Plus className="w-4 h-4 mr-2" />
              이미지 추가
            </Button>
          </div>
        )}
      </div>

      {/* 이미지 목록 */}
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((image, index) => (
            <Card key={image.id} className="transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* 순서 조정 버튼 */}
                  <div className="flex flex-col gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(image.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(image.id, 'down')}
                      disabled={index === images.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* 이미지 미리보기 */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={image.image_url}
                      alt={image.image_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 정보 입력 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        파일명: {image.image_name}
                      </Label>
                    </div>
                    
                    <div>
                      <Label htmlFor={`section-${image.id}`} className="text-sm">
                        섹션 제목
                      </Label>
                      <Input
                        id={`section-${image.id}`}
                        value={image.section_title}
                        onChange={(e) => updateSectionTitle(image.id, e.target.value)}
                        placeholder="이 이미지가 설명하는 섹션의 제목을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">아직 업로드된 이미지가 없습니다</p>
        </div>
      )}
    </div>
  );
};