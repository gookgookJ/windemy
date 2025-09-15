import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X } from 'lucide-react';

interface CourseSection {
  id: string;
  title: string;
  attachment_url?: string;
  attachment_name?: string;
  course_id: string;
}

interface SectionUploadModalProps {
  section: CourseSection | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SectionUploadModal = ({ section, isOpen, onClose, onUpdate }: SectionUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!section || !selectedFile) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `section-${section.id}-${Date.now()}.${fileExt}`;
      const filePath = `${section.course_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('course_sections')
        .update({
          attachment_url: publicUrl,
          attachment_name: selectedFile.name
        })
        .eq('id', section.id);

      if (updateError) throw updateError;

      toast({
        title: "성공",
        description: "파일이 업로드되었습니다."
      });

      onUpdate();
      onClose();
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "오류",
        description: "파일 업로드에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeCurrentFile = async () => {
    if (!section?.attachment_url) return;

    try {
      const { error } = await supabase
        .from('course_sections')
        .update({
          attachment_url: null,
          attachment_name: null
        })
        .eq('id', section.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "첨부파일이 삭제되었습니다."
      });

      onUpdate();
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "오류",
        description: "파일 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>섹션 자료 업로드</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              "{section?.title}" 섹션에 첨부할 자료를 업로드하세요
            </p>
            
            {section?.attachment_url && (
              <div className="mb-4 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{section.attachment_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCurrentFile}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                클릭하여 파일을 선택하거나 드래그하여 업로드
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, PPT, 이미지 등 (최대 10MB)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
              className="hidden"
            />

            {selectedFile && (
              <div className="mt-3 p-3 bg-primary/10 rounded-md">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};