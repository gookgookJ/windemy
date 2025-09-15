import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X } from 'lucide-react';

interface CourseSession {
  id: string;
  title: string;
  attachment_url?: string;
  attachment_name?: string;
  course: {
    title: string;
    id: string;
  };
}

interface SessionUploadModalProps {
  session: CourseSession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SessionUploadModal = ({ session, isOpen, onClose, onUpdate }: SessionUploadModalProps) => {
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
    if (!session || !selectedFile) {
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
      const fileName = `${session.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.course.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('course_sessions')
        .update({
          attachment_url: publicUrl,
          attachment_name: selectedFile.name
        })
        .eq('id', session.id);

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
    if (!session?.attachment_url) return;

    try {
      // 스토리지에서 파일 삭제
      if (session.attachment_url.includes('course-files')) {
        const filePath = session.attachment_url.split('/course-files/')[1];
        await supabase.storage
          .from('course-files')
          .remove([filePath]);
      }

      // 데이터베이스에서 파일 정보 제거
      const { error } = await supabase
        .from('course_sessions')
        .update({
          attachment_url: null,
          attachment_name: null
        })
        .eq('id', session.id);

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

  const replaceFile = async () => {
    if (!session || !selectedFile) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // 기존 파일이 있다면 삭제
      if (session.attachment_url && session.attachment_url.includes('course-files')) {
        const oldFilePath = session.attachment_url.split('/course-files/')[1];
        await supabase.storage
          .from('course-files')
          .remove([oldFilePath]);
      }

      // 새 파일 업로드
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${session.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.course.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('course_sessions')
        .update({
          attachment_url: publicUrl,
          attachment_name: selectedFile.name
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      toast({
        title: "성공",
        description: "파일이 교체되었습니다."
      });

      onUpdate();
      onClose();
      setSelectedFile(null);
    } catch (error) {
      console.error('Error replacing file:', error);
      toast({
        title: "오류",
        description: "파일 교체에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>자료 업로드</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {session?.title}에 첨부할 자료를 업로드하세요
            </p>
            
            {session?.attachment_url && (
              <div className="mb-4 p-3 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{session.attachment_name}</span>
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
            {session?.attachment_url && selectedFile ? (
              <Button 
                onClick={replaceFile} 
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? '교체 중...' : '파일 교체'}
              </Button>
            ) : (
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};