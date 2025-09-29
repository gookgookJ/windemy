import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedGroupId(null);
      setSuccessName(null);
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

  const filteredGroups = groups.filter((group) => {
    const q = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(q) ||
      (group.description ? group.description.toLowerCase().includes(q) : false)
    );
  });

  const handleAssignToGroup = async (groupId: string, groupNameParam?: string) => {
    if (selectedUsers.length === 0) return;

    try {
      setAssigning(true);
      
      // 먼저 기존 그룹 멤버십을 모두 삭제
      const { error: deleteError } = await supabase
        .from('user_group_memberships')
        .delete()
        .in('user_id', selectedUsers);

      if (deleteError) throw deleteError;

      // 새로운 그룹에 배정
      const memberships = selectedUsers.map(userId => ({
        user_id: userId,
        group_id: groupId
      }));

      const { error } = await supabase
        .from('user_group_memberships')
        .insert(memberships);

      if (error) throw error;

      const groupName = groupNameParam ?? groups.find(g => g.id === groupId)?.name ?? '선택한 그룹';
      setSuccessName(groupName);
      
      toast({
        title: "그룹 배정 완료",
        description: `${selectedUsers.length}명이 "${groupName}" 그룹에 배정되었습니다.`
      });

      // 콜백 호출하여 부모 컴포넌트의 데이터 새로고침 유도
      onGroupAssigned?.(groupId);
    } catch (error) {
      console.error('Error assigning users to group:', error);
      toast({
        title: "그룹 배정 실패",
        description: "사용자를 그룹에 배정하는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">그룹 배정</DialogTitle>
          <DialogDescription className="text-center">
            선택된 {selectedUsers.length}명의 사용자를 그룹에 배정하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {successName ? (
            <Alert>
              <AlertDescription>
                {selectedUsers.length}명이 "{successName}" 그룹에 배정되었습니다.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* 기존 그룹 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">배정할 그룹 선택</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="그룹 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground mt-2 text-sm">그룹 목록 로딩중...</p>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-56 overflow-y-auto">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group, index) => {
                        const selected = selectedGroupId === group.id;
                        return (
                          <button
                            type="button"
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`flex items-center justify-between w-full p-3 text-left transition-colors ${
                              selected ? 'bg-accent' : 'hover:bg-accent'
                            } ${index !== filteredGroups.length - 1 ? 'border-b' : ''}`}
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
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">
                          {searchTerm ? '검색 결과가 없습니다' : '등록된 그룹이 없습니다'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedGroupId ? `선택된 그룹: ${groups.find((g) => g.id === selectedGroupId)?.name ?? ''}` : '그룹을 선택하세요'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              닫기
            </Button>
            {!successName && (
              <Button
                onClick={() => {
                  if (!selectedGroupId) return;
                  const name = groups.find((g) => g.id === selectedGroupId)?.name;
                  handleAssignToGroup(selectedGroupId, name);
                }}
                disabled={!selectedGroupId || assigning}
                size="sm"
              >
                {assigning ? '배정 중...' : '배정하기'}
              </Button>
            )}
            {successName && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSuccessName(null);
                  setSelectedGroupId(null);
                }}
              >
                계속 배정
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
