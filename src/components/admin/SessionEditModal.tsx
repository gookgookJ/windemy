import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CourseSession {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
  is_free: boolean;
  is_preview: boolean;
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
    description: '',
    video_url: '',
    duration_minutes: 0,
    is_free: false,
    is_preview: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      setEditData({
        title: session.title,
        description: session.description || '',
        video_url: session.video_url || '',
        duration_minutes: session.duration_minutes || 0,
        is_free: session.is_free,
        is_preview: session.is_preview
      });
    }
  }, [session]);

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
          description: editData.description,
          video_url: editData.video_url,
          duration_minutes: editData.duration_minutes,
          is_free: editData.is_free,
          is_preview: editData.is_preview
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
            <Label htmlFor="edit-description">설명</Label>
            <Textarea
              id="edit-description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="세션 설명을 입력하세요"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="edit-video-url">Vimeo 영상 URL</Label>
            <Input
              id="edit-video-url"
              value={editData.video_url}
              onChange={(e) => setEditData({ ...editData, video_url: e.target.value })}
              placeholder="https://vimeo.com/123456789"
            />
          </div>
          <div>
            <Label htmlFor="edit-duration">재생 시간 (분)</Label>
            <Input
              id="edit-duration"
              type="number"
              value={editData.duration_minutes}
              onChange={(e) => setEditData({ ...editData, duration_minutes: parseInt(e.target.value) || 0 })}
              placeholder="60"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.is_free}
                onChange={(e) => setEditData({ ...editData, is_free: e.target.checked })}
              />
              <span>무료 세션</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.is_preview}
                onChange={(e) => setEditData({ ...editData, is_preview: e.target.checked })}
              />
              <span>미리보기</span>
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