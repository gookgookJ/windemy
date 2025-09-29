import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupManagementModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
  onGroupAssigned?: (groupId: string) => void;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  member_count?: number;
}

export function GroupManagementModal({ 
  open, 
  onClose, 
  selectedUsers, 
  onGroupAssigned 
}: GroupManagementModalProps) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('user_groups')
        .select(`
          *,
          user_group_memberships(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCount = groupsData?.map(group => ({
        ...group,
        member_count: group.user_group_memberships?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "그룹 조회 실패",
        description: "그룹 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "그룹명 필요",
        description: "그룹명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    // 랜덤 색상 자동 선택
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert([{
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || null,
          color: randomColor
        }])
        .select()
        .single();

      if (error) throw error;

      setGroups([data, ...groups]);
      setNewGroup({ name: '', description: '' });
      
      // 새로 생성한 그룹에 바로 배정하고 모달 닫기
      if (selectedUsers.length > 0) {
        await handleAssignToGroup(data.id);
      } else {
        toast({
          title: "그룹 생성 완료",
          description: `"${data.name}" 그룹이 생성되었습니다.`
        });
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "그룹 생성 실패",
        description: error.message?.includes('duplicate') ? 
          "이미 존재하는 그룹명입니다." : 
          "그룹 생성에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleAssignToGroup = async (groupId: string) => {
    if (selectedUsers.length === 0) return;

    try {
      const memberships = selectedUsers.map(userId => ({
        user_id: userId,
        group_id: groupId
      }));

      const { error } = await supabase
        .from('user_group_memberships')
        .upsert(memberships, { onConflict: 'user_id,group_id' });

      if (error) throw error;

      const groupName = groups.find(g => g.id === groupId)?.name;
      
      toast({
        title: "그룹 배정 완료",
        description: `${selectedUsers.length}명의 사용자가 "${groupName}" 그룹에 배정되었습니다.`
      });

      onGroupAssigned?.(groupId);
      onClose(); // 배정 후 모달 자동 닫기
    } catch (error) {
      console.error('Error assigning users to group:', error);
      toast({
        title: "그룹 배정 실패",
        description: "사용자를 그룹에 배정하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">그룹 배정</DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            선택된 {selectedUsers.length}명의 사용자를 그룹에 배정하세요
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기존 그룹 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">기존 그룹 선택</Label>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2 text-sm">그룹 목록 로딩중...</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {groups.length > 0 ? (
                  groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleAssignToGroup(group.id)}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <p className="font-medium text-sm">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground">{group.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {group.member_count || 0}명
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">등록된 그룹이 없습니다</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 새 그룹 생성 */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">새 그룹 생성</Label>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="그룹명 입력"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newGroup.name.trim()) {
                    handleCreateGroup();
                  }
                }}
              />
              <Button 
                onClick={handleCreateGroup} 
                disabled={!newGroup.name.trim()}
                size="sm"
                className="h-9 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} size="sm">
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
