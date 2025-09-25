import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, Plus, Trash2, Link } from 'lucide-react';

interface CourseMaterial {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  order_index: number;
}

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  courseId: string;
  sectionId?: string;
  sessionId?: string;
  existingMaterials?: CourseMaterial[];
}

export const MaterialUploadModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  courseId, 
  sectionId, 
  sessionId,
  existingMaterials = []
}: MaterialUploadModalProps) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>(existingMaterials);
  const [newMaterials, setNewMaterials] = useState<Array<{
    file?: File;
    title: string;
    type: 'file' | 'link';
    url?: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addNewMaterial = (type: 'file' | 'link') => {
    if (materials.length + newMaterials.length >= 10) {
      toast({
        title: "제한 초과",
        description: "최대 10개의 자료만 업로드할 수 있습니다.",
        variant: "destructive"
      });
      return;
    }
    
    setNewMaterials(prev => [...prev, { title: '', type }]);
  };

  const removeNewMaterial = (index: number) => {
    setNewMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const updateNewMaterial = (index: number, updates: Partial<typeof newMaterials[0]>) => {
    setNewMaterials(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleFileSelect = (index: number, file: File) => {
    updateNewMaterial(index, { 
      file, 
      title: newMaterials[index].title || file.name.replace(/\.[^/.]+$/, "")
    });
  };

  const removeMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      
      toast({
        title: "성공",
        description: "자료가 삭제되었습니다."
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "오류",
        description: "자료 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const generateSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-files')
        .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1년 만료

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    const validMaterials = newMaterials.filter(m => 
      (m.type === 'file' && m.file && m.title) || 
      (m.type === 'link' && m.url && m.title)
    );

    if (validMaterials.length === 0) {
      toast({
        title: "오류",
        description: "업로드할 자료를 추가해주세요.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = validMaterials.map(async (material, index) => {
        let fileUrl = '';
        let fileName = '';
        let fileSize = 0;
        let fileType = '';

        if (material.type === 'file' && material.file) {
          const fileExt = material.file.name.split('.').pop();
          const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${courseId}/${uniqueFileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('course-files')
            .upload(filePath, material.file);

          if (uploadError) throw uploadError;

          // Generate signed URL for private bucket
          fileUrl = await generateSignedUrl(filePath);
          fileName = material.file.name;
          fileSize = material.file.size;
          fileType = material.file.type;
        } else if (material.type === 'link') {
          fileUrl = material.url!;
          fileName = material.title;
          fileType = 'link';
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from('course_materials')
          .insert({
            course_id: courseId,
            section_id: sectionId || null,
            session_id: sessionId || null,
            title: material.title,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize || null,
            file_type: fileType || null,
            order_index: materials.length + index
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "성공",
        description: `${validMaterials.length}개의 자료가 업로드되었습니다.`
      });

      onUpdate();
      onClose();
      setNewMaterials([]);
    } catch (error) {
      console.error('Error uploading materials:', error);
      toast({
        title: "오류",
        description: "자료 업로드에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sectionId ? '섹션' : '세션'} 자료 관리 ({materials.length + newMaterials.length}/10)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 기존 자료들 */}
          {materials.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">기존 자료</h4>
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">{material.title}</div>
                        <div className="text-xs text-muted-foreground">{material.file_name}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(material.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새로 추가할 자료들 */}
          {newMaterials.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">새로운 자료</h4>
              <div className="space-y-4">
                {newMaterials.map((material, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {material.type === 'file' ? (
                          <Upload className="h-4 w-4 text-primary" />
                        ) : (
                          <Link className="h-4 w-4 text-secondary" />
                        )}
                        <span className="text-sm font-medium">
                          {material.type === 'file' ? '파일 업로드' : '링크 추가'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNewMaterial(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>제목</Label>
                        <Input
                          value={material.title}
                          onChange={(e) => updateNewMaterial(index, { title: e.target.value })}
                          placeholder="자료 제목을 입력하세요"
                          className="mt-1"
                        />
                      </div>

                    {material.type === 'file' ? (
                      <div>
                        <Label>파일 선택</Label>
                        {material.file ? (
                          <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  {material.file.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateNewMaterial(index, { file: undefined })}
                                className="h-6 w-6 p-0 hover:bg-red-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              크기: {Math.round(material.file.size / 1024)} KB
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt,.xlsx,.xls';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileSelect(index, file);
                              };
                              input.click();
                            }}
                            className="w-full h-12 mt-1 border-2 border-dashed hover:bg-muted/50"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            파일 선택 (최대 20MB)
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label>링크 URL</Label>
                        <Input
                          type="url"
                          value={material.url || ''}
                          onChange={(e) => updateNewMaterial(index, { url: e.target.value })}
                          placeholder="https://example.com/file.pdf"
                          className="mt-1"
                        />
                        {material.url && (
                          <div className="mt-1 text-xs text-blue-600">
                            ✓ 링크가 입력되었습니다
                          </div>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 자료 추가 버튼들 */}
        {materials.length + newMaterials.length < 10 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">자료 추가</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => addNewMaterial('file')}
                className="h-20 flex-col gap-2 text-center"
                disabled={uploading}
              >
                <Upload className="h-6 w-6 text-primary" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">파일 업로드</div>
                  <div className="text-xs text-muted-foreground">PDF, DOC, 이미지 등</div>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addNewMaterial('link')}
                className="h-20 flex-col gap-2 text-center"
                disabled={uploading}
              >
                <Link className="h-6 w-6 text-secondary" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">링크 추가</div>
                  <div className="text-xs text-muted-foreground">외부 링크, URL</div>
                </div>
              </Button>
            </div>
          </div>
        )}

          {/* 액션 버튼들 */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpload} 
              disabled={newMaterials.length === 0 || uploading}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : '업로드 완료'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};