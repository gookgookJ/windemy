import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, File, X, Check, AlertCircle, FolderOpen } from 'lucide-react';

interface BulkUploadFile {
  id: string;
  file: File;
  title: string;
  sectionId: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface CourseSection {
  id: string;
  title: string;
  course_id: string;
  course?: {
    title: string;
  };
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  sections: CourseSection[];
}

export const BulkUploadModal = ({ isOpen, onClose, onUpdate, sections }: BulkUploadModalProps) => {
  const [files, setFiles] = useState<BulkUploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: BulkUploadFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      sectionId: '',
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<BulkUploadFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const uploadFile = async (uploadFile: BulkUploadFile): Promise<void> => {
    const section = sections.find(s => s.id === uploadFile.sectionId);
    if (!section) {
      throw new Error('섹션을 찾을 수 없습니다.');
    }

    updateFile(uploadFile.id, { status: 'uploading', progress: 0 });

    // Upload to Supabase Storage
    const fileExt = uploadFile.file.name.split('.').pop();
    const fileName = `${uploadFile.id}.${fileExt}`;
    const filePath = `${section.course_id}/${section.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, uploadFile.file);

    if (uploadError) {
      throw uploadError;
    }

    updateFile(uploadFile.id, { progress: 50 });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    updateFile(uploadFile.id, { progress: 75 });

    // Save to database
    const { error: dbError } = await supabase
      .from('course_materials')
      .insert({
        course_id: section.course_id,
        section_id: section.id,
        title: uploadFile.title,
        file_name: uploadFile.file.name,
        file_url: urlData.publicUrl,
        file_type: uploadFile.file.type,
        file_size: uploadFile.file.size,
        order_index: 0
      });

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage.from('course-files').remove([filePath]);
      throw dbError;
    }

    updateFile(uploadFile.id, { status: 'success', progress: 100 });
  };

  const handleBulkUpload = async () => {
    const validFiles = files.filter(f => f.sectionId && f.status === 'pending');
    
    if (validFiles.length === 0) {
      toast({
        title: "업로드할 파일이 없습니다",
        description: "모든 파일에 섹션을 지정해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const file of validFiles) {
      try {
        await uploadFile(file);
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        updateFile(file.id, { 
          status: 'error', 
          error: error instanceof Error ? error.message : '업로드 실패' 
        });
        errorCount++;
      }
    }

    setIsUploading(false);

    toast({
      title: "업로드 완료",
      description: `성공: ${successCount}개, 실패: ${errorCount}개`,
      variant: errorCount > 0 ? "destructive" : "default"
    });

    if (successCount > 0) {
      onUpdate();
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onClose();
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const completedFiles = files.filter(f => f.status !== 'pending');
  const overallProgress = files.length > 0 ? 
    (files.reduce((acc, f) => acc + f.progress, 0) / files.length) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            자료 일괄 업로드
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-sm text-muted-foreground mb-4">
              PDF, DOC, PPT, 이미지 등 다양한 형식 지원
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-file-input"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif"
            />
            <Button asChild variant="outline">
              <label htmlFor="bulk-file-input" className="cursor-pointer">
                파일 선택
              </label>
            </Button>
          </div>

          {/* Progress */}
          {files.length > 0 && isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전체 진행률</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">업로드 대기 중인 파일</h3>
              <div className="space-y-3">
                {pendingFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <Input
                        value={file.title}
                        onChange={(e) => updateFile(file.id, { title: e.target.value })}
                        placeholder="자료 제목"
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {file.file.name} ({(file.file.size / 1024 / 1024).toFixed(1)}MB)
                      </p>
                    </div>

                    <div className="w-48">
                      <Select
                        value={file.sectionId}
                        onValueChange={(value) => updateFile(file.id, { sectionId: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="섹션 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              <div className="text-left">
                                <div className="font-medium text-sm">{section.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {section.course?.title}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Files */}
          {completedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">업로드 결과</h3>
              <div className="space-y-2">
                {completedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {file.status === 'success' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    )}
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.file.name}
                        {file.error && ` - ${file.error}`}
                      </p>
                    </div>

                    <Badge variant={
                      file.status === 'success' ? 'default' : 
                      file.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {file.status === 'success' ? '완료' : 
                       file.status === 'error' ? '실패' : '업로드중'}
                    </Badge>

                    {file.status === 'uploading' && (
                      <div className="w-24">
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {isUploading ? '업로드 중...' : '닫기'}
            </Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={pendingFiles.length === 0 || isUploading}
            >
              {isUploading ? '업로드 중...' : `${pendingFiles.length}개 파일 업로드`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};