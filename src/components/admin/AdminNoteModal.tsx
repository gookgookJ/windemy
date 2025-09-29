import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminNoteModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onNoteSaved?: () => void;
}

export function AdminNoteModal({ 
  open, 
  onClose, 
  userId, 
  userEmail, 
  onNoteSaved 
}: AdminNoteModalProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast({
        title: "메모 입력 필요",
        description: "메모 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_notes')
        .insert([{
          user_id: userId,
          note: note.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        }]);

      if (error) throw error;

      toast({
        title: "메모 저장 완료",
        description: "관리자 메모가 성공적으로 저장되었습니다."
      });

      setNote('');
      onNoteSaved?.();
      onClose();

    } catch (error: any) {
      console.error('Error saving admin note:', error);
      toast({
        title: "메모 저장 실패",
        description: "메모 저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">관리자 메모 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">대상 사용자</div>
            <div className="font-medium">{userEmail}</div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="adminNote" className="text-sm font-medium">
              메모 내용 *
            </Label>
            <Textarea
              id="adminNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="이 사용자에 대한 관리자 메모를 입력하세요..."
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {note.length}/1000자
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="h-10 px-6">
              취소
            </Button>
            <Button 
              onClick={handleSaveNote} 
              disabled={loading || !note.trim()}
              className="h-10 px-6"
            >
              {loading ? '저장 중...' : '메모 저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}