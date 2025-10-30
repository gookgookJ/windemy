import React, { useState } from 'react';
import { Upload, X, Plus, Image as ImageIcon, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedImages = items.map((img, index) => ({
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div 
                className="space-y-3"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id!} index={index}>
                    {(provided, snapshot) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* 드래그 핸들 */}
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing mt-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>

                            {/* 이미지 미리보기 */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={image.image_url}
                                alt={image.image_name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            {/* 정보 입력 */}
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">
                                파일명: {image.image_name}
                              </Label>
                            </div>

                            {/* 삭제 버튼 */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(image.id!)}
                              className="text-destructive hover:text-destructive flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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