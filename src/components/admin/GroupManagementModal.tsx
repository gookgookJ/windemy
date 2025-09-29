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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<string>('');
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

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      toast({
        title: "그룹 생성 완료",
        description: `"${data.name}" 그룹이 생성되었습니다.`
      });
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

  const handleQuickAssign = async () => {
    if (!selectedGroupForAssign || selectedUsers.length === 0) return;

    try {
      const memberships = selectedUsers.map(userId => ({
        user_id: userId,
        group_id: selectedGroupForAssign
      }));

      const { error } = await supabase
        .from('user_group_memberships')
        .upsert(memberships, { onConflict: 'user_id,group_id' });

      if (error) throw error;

      const groupName = groups.find(g => g.id === selectedGroupForAssign)?.name;
      
      toast({
        title: "그룹 배정 완료",
        description: `${selectedUsers.length}명의 사용자가 "${groupName}" 그룹에 배정되었습니다.`
      });

      onGroupAssigned?.(selectedGroupForAssign);
    } catch (error) {
      console.error('Error assigning users to group:', error);
      toast({
        title: "그룹 배정 실패",
        description: "사용자를 그룹에 배정하는데 실패했습니다.",
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
    } catch (error) {
      console.error('Error assigning users to group:', error);
      toast({
        title: "그룹 배정 실패",
        description: "사용자를 그룹에 배정하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`"${groupName}" 그룹을 삭제하시겠습니까? 그룹에 속한 사용자들의 배정도 모두 해제됩니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.filter(g => g.id !== groupId));
      
      toast({
        title: "그룹 삭제 완료",
        description: `"${groupName}" 그룹이 삭제되었습니다.`
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "그룹 삭제 실패",
        description: "그룹 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const colorOptions = [
    { value: '#3b82f6', label: '블루' },
    { value: '#10b981', label: '그린' },
    { value: '#f59e0b', label: '옐로우' },
    { value: '#ef4444', label: '레드' },
    { value: '#8b5cf6', label: '퍼플' },
    { value: '#06b6d4', label: '사이안' },
    { value: '#84cc16', label: '라임' },
    { value: '#f97316', label: '오렌지' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>그룹 관리</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 빠른 배정 섹션 */}
          {selectedUsers.length > 0 && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-4">빠른 그룹 배정</h3>
              <Alert className="mb-6">
                <AlertDescription className="text-base">
                  선택된 {selectedUsers.length}명의 사용자를 그룹에 배정합니다.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Select value={selectedGroupForAssign} onValueChange={setSelectedGroupForAssign}>
                  <SelectTrigger className="flex-1 h-11">
                    <SelectValue placeholder="그룹을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleQuickAssign} 
                  disabled={!selectedGroupForAssign}
                  className="h-11 px-6"
                >
                  배정하기
                </Button>
              </div>
            </div>
          )}

          {/* 새 그룹 생성 섹션 */}
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-6">새 그룹 생성</h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="groupName" className="text-sm font-medium mb-2 block">그룹명 *</Label>
                <Input
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: VIP 고객, 신규 회원"
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="groupDescription" className="text-sm font-medium mb-2 block">설명</Label>
                <Textarea
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="그룹에 대한 설명을 입력하세요"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <Button 
                onClick={handleCreateGroup} 
                disabled={!newGroup.name.trim()}
                className="h-10 px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                그룹 생성
              </Button>
            </div>
          </div>

          {/* 기존 그룹 목록 */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">기존 그룹 ({groups.length}개)</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="그룹 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 h-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-4 text-base">그룹을 불러오는 중...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map(group => (
                    <div key={group.id} className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: group.color }}
                          />
                          <div>
                            <h4 className="font-semibold text-base">{group.name}</h4>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs px-3 py-1">
                          <Users className="w-3 h-3 mr-1" />
                          {group.member_count || 0}명
                        </Badge>
                        
                        {selectedUsers.length > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleAssignToGroup(group.id)}
                            className="h-8 px-4"
                          >
                            이 그룹에 배정
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 text-center py-12">
                    <p className="text-muted-foreground text-base">
                      {searchTerm ? '검색 결과가 없습니다.' : '생성된 그룹이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} className="h-10 px-6">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
