import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getVimeoVideoInfo, isValidVimeoUrl } from '@/utils/vimeoUtils';
import { Loader2 } from 'lucide-react';

interface CourseSession {
  id: string;
  title: string;
  video_url?: string;
  is_free: boolean;
  course: {
    title: string;
    id: string;
  };
}

interface SessionEditModalProps {
  session: CourseSession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SessionEditModal = ({ session, isOpen, onClose, onUpdate }: SessionEditModalProps) => {
  const [editData, setEditData] = useState({
    title: '',
    video_url: '',
    is_free: false
  });
  const [loadingVideoInfo, setLoadingVideoInfo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      setEditData({
        title: session.title,
        video_url: session.video_url || '',
        is_free: session.is_free
      });
    }
  }, [session]);

  const handleVideoUrlChange = async (url: string) => {
    setEditData({ ...editData, video_url: url });
    
    if (url && isValidVimeoUrl(url)) {
      setLoadingVideoInfo(true);
      try {
        const videoInfo = await getVimeoVideoInfo(url);
        if (videoInfo) {
          setEditData(prev => ({
            ...prev,
            title: prev.title || videoInfo.title // 제목이 없을 때만 자동 설정
          }));
          toast({
            title: "영상 정보 가져오기 완료",
            description: `제목이 자동으로 설정되었습니다.`
          });
        }
      } catch (error) {
        console.error('Error fetching video info:', error);
        toast({
          title: "알림",
          description: "영상 정보를 가져올 수 없었습니다.",
          variant: "default"
        });
      } finally {
        setLoadingVideoInfo(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!session || !editData.title) {
      toast({
        title: "오류",
        description: "제목을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('course_sessions')
        .update({
          title: editData.title,
          video_url: editData.video_url,
          is_free: editData.is_free
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "세션이 수정되었습니다."
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "오류",
        description: "세션 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>세션 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">세션 제목</Label>
            <Input
              id="edit-title"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="세션 제목을 입력하세요"
            />
          </div>
          <div>
            <Label htmlFor="edit-video-url">
              Vimeo 영상 URL
              {loadingVideoInfo && (
                <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />
              )}
            </Label>
            <Input
              id="edit-video-url"
              value={editData.video_url}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://vimeo.com/123456789"
              disabled={loadingVideoInfo}
            />
            {loadingVideoInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                영상 정보를 가져오는 중...
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.is_free}
                onChange={(e) => setEditData({ ...editData, is_free: e.target.checked })}
              />
              <span>무료 세션</span>
            </label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdate} className="flex-1">
              수정 완료
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