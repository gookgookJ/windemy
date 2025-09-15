import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { File, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FileDownloadButtonProps {
  fileUrl: string;
  fileName: string;
  sessionId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const FileDownloadButton = ({ 
  fileUrl, 
  fileName, 
  sessionId, 
  variant = "outline", 
  size = "default",
  className = ""
}: FileDownloadButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "파일을 다운로드하려면 로그인해주세요.",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    try {
      // 다운로드 로그 기록
      await supabase
        .from('session_file_downloads')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          file_name: fileName
        });

      // 파일 다운로드
      window.open(fileUrl, '_blank');
      
      toast({
        title: "다운로드 시작",
        description: "파일 다운로드가 시작되었습니다.",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {downloading ? '다운로드 중...' : fileName}
    </Button>
  );
};