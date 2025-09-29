import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; description: string | null }>({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedGroupId(null);
      setSuccessName(null);
      setEditingGroupId(null);
      setEditValues({ name: '', description: '' });
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
      
      if (selectedUsers.length > 0) {
        await handleAssignToGroup(data.id, data.name);
      } else {
        toast({
          title: "그룹 생성 완료",
          description: `"${data.name}" 그룹이 생성되었습니다.`
        });
        onClose();
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

  const handleAssignToGroup = async (groupId: string, groupNameParam?: string) => {
    if (selectedUsers.length === 0) return;

    try {
      setAssigning(true);
      const memberships = selectedUsers.map(userId => ({
        user_id: userId,
        group_id: groupId
      }));

      const { error } = await supabase
        .from('user_group_memberships')
        .upsert(memberships, { onConflict: 'user_id,group_id' });

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
                <Label className="text-sm font-medium">기존 그룹 선택</Label>
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
                        const isEditing = editingGroupId === group.id;
                        return (
                          <div
                            key={group.id}
                            className={`flex items-center justify-between w-full p-3 text-left transition-colors ${
                              selected ? 'bg-accent' : 'hover:bg-accent'
                            } ${index !== filteredGroups.length - 1 ? 'border-b' : ''}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color }}
                              />
                              <div className="flex-1 min-w-0">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editValues.name}
                                      onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))}
                                      className="h-8"
                                    />
                                    <Input
                                      placeholder="설명(선택)"
                                      value={editValues.description ?? ''}
                                      onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                                      className="h-8"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-medium text-sm truncate">{group.name}</p>
                                    {group.description && (
                                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              {!isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => {
                                      setEditingGroupId(group.id);
                                      setEditValues({ name: group.name, description: group.description ?? '' });
                                    }}
                                  >
                                    수정
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                    onClick={async () => {
                                      if (!confirm(`"${group.name}" 그룹을 삭제할까요?`)) return;
                                      const { error } = await supabase.from('user_groups').delete().eq('id', group.id);
                                      if (error) {
                                        toast({ title: '삭제 실패', description: '그룹 삭제에 실패했습니다.', variant: 'destructive' });
                                      } else {
                                        setGroups(prev => prev.filter(g => g.id !== group.id));
                                        toast({ title: '삭제 완료', description: '그룹이 삭제되었습니다.' });
                                      }
                                    }}
                                  >
                                    삭제
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 px-3"
                                    onClick={() => {
                                      setSelectedGroupId(group.id);
                                    }}
                                  >
                                    선택
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={async () => {
                                      if (!editValues.name.trim()) {
                                        toast({ title: '그룹명 필요', description: '그룹명을 입력하세요.', variant: 'destructive' });
                                        return;
                                      }
                                      const { error } = await supabase
                                        .from('user_groups')
                                        .update({ name: editValues.name.trim(), description: (editValues.description ?? '').trim() || null })
                                        .eq('id', group.id);
                                      if (error) {
                                        toast({ title: '수정 실패', description: error.message?.includes('duplicate') ? '이미 존재하는 그룹명입니다.' : '그룹 수정에 실패했습니다.', variant: 'destructive' });
                                      } else {
                                        setGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: editValues.name.trim(), description: (editValues.description ?? '').trim() || null } : g));
                                        setEditingGroupId(null);
                                        toast({ title: '수정 완료', description: '그룹 정보가 업데이트되었습니다.' });
                                      }
                                    }}
                                  >
                                    저장
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => {
                                      setEditingGroupId(null);
                                    }}
                                  >
                                    취소
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
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
                    onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newGroup.name.trim()) {
                        e.preventDefault();
                        handleCreateGroup();
                      }
                    }}
                  />
                  <Button onClick={handleCreateGroup} disabled={!newGroup.name.trim()} size="sm" className="h-9 px-3">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
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
