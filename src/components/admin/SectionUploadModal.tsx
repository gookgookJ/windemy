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
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
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
    if (!section) {
      toast({
        title: "오류",
        description: "섹션을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (uploadType === 'file' && !selectedFile) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (uploadType === 'link' && (!linkUrl || !linkName)) {
      toast({
        title: "오류",
        description: "링크 URL과 제목을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let attachmentUrl = '';
      let attachmentName = '';

      if (uploadType === 'file') {
        const fileExt = selectedFile!.name.split('.').pop();
        const fileName = `section-${section.id}-${Date.now()}.${fileExt}`;
        const filePath = `${section.course_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-files')
          .upload(filePath, selectedFile!);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('course-files')
          .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentName = selectedFile!.name;
      } else {
        // 링크 업로드
        attachmentUrl = linkUrl;
        attachmentName = linkName;
      }

      const { error: updateError } = await supabase
        .from('course_sections')
        .update({
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })
        .eq('id', section.id);

      if (updateError) throw updateError;

      toast({
        title: "성공",
        description: `${uploadType === 'file' ? '파일' : '링크'}이 업로드되었습니다.`
      });

      onUpdate();
      onClose();
      setSelectedFile(null);
      setLinkUrl('');
      setLinkName('');
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "오류",
        description: `${uploadType === 'file' ? '파일' : '링크'} 업로드에 실패했습니다.`,
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
              "{section?.title}" 섹션에 첨부할 자료를 업로드하거나 링크를 추가하세요
            </p>

            {/* 업로드 타입 선택 */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={uploadType === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUploadType('file');
                  setLinkUrl('');
                  setLinkName('');
                }}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                파일 업로드
              </Button>
              <Button
                type="button"
                variant={uploadType === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUploadType('link');
                  setSelectedFile(null);
                }}
                className="flex-1"
              >
                <File className="h-4 w-4 mr-1" />
                링크 추가
              </Button>
            </div>
            
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

            
            {/* 파일 업로드 영역 */}
            {uploadType === 'file' && (
              <>
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
              </>
            )}

            {/* 링크 입력 영역 */}
            {uploadType === 'link' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="link-name">자료 제목</Label>
                  <Input
                    id="link-name"
                    placeholder="예: 강의 자료 PDF, 참고 사이트 등"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="link-url">링크 URL</Label>
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpload} 
              disabled={(uploadType === 'file' && !selectedFile) || (uploadType === 'link' && (!linkUrl || !linkName)) || uploading}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : `${uploadType === 'file' ? '파일' : '링크'} 업로드`}
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