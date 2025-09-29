import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupCreateModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export function GroupCreateModal({ open, onClose, onGroupCreated }: GroupCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: ''
  });
  const { toast } = useToast();

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "그룹명 필요",
        description: "그룹명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 랜덤 색상 자동 선택
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('user_groups')
        .insert([{
          name: newGroup.name.trim(),
          color: randomColor
        }])
        .select()
        .single();

      if (error) throw error;

      setNewGroup({ name: '' });
      
      toast({
        title: "그룹 생성 완료",
        description: `"${data.name}" 그룹이 생성되었습니다.`
      });

      onGroupCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "그룹 생성 실패",
        description: error.message?.includes('duplicate') ? 
          "이미 존재하는 그룹명입니다." : 
          "그룹 생성에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 그룹 생성</DialogTitle>
          <DialogDescription>
            새로운 사용자 그룹을 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName" className="text-sm font-medium">그룹명 *</Label>
            <Input
              id="groupName"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: VIP 고객, 신규 회원"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroup.name.trim() && !loading) {
                  e.preventDefault();
                  handleCreateGroup();
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={!newGroup.name.trim() || loading}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                그룹 생성
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}