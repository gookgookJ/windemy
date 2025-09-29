import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupAssignmentDropdownProps {
  selectedUsers: string[];
  onClose: () => void;
  onGroupAssigned?: (groupId: string) => void;
  position?: { top: number; left: number };
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  member_count?: number;
}

export function GroupAssignmentDropdown({ 
  selectedUsers, 
  onClose, 
  onGroupAssigned,
  position = { top: 0, left: 0 }
}: GroupAssignmentDropdownProps) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm('');
    setSelectedGroupId(null);
    fetchGroups();

    // 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

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

  const handleAssignToGroup = async (groupId: string) => {
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

      const groupName = groups.find(g => g.id === groupId)?.name ?? '선택한 그룹';
      
      toast({
        title: "그룹 배정 완료",
        description: `${selectedUsers.length}명이 "${groupName}" 그룹에 배정되었습니다.`
      });

      // 콜백 호출하여 부모 컴포넌트의 데이터 새로고침 유도
      onGroupAssigned?.(groupId);
      onClose();
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
    <div 
      ref={dropdownRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg w-80"
      style={{ 
        top: position.top + 10, 
        left: Math.max(10, position.left - 160) // 화면 왼쪽 가장자리에서 최소 10px 떨어뜨림
      }}
    >
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">그룹 배정</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* 선택된 사용자 수 */}
        <div className="mb-3">
          <Badge variant="secondary" className="text-xs">
            {selectedUsers.length}명 선택됨
          </Badge>
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="그룹 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        {/* 그룹 목록 */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-1 text-xs">로딩중...</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-md">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group, index) => {
                const selected = selectedGroupId === group.id;
                return (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`flex items-center justify-between w-full p-2 text-left transition-colors text-sm ${
                      selected ? 'bg-accent' : 'hover:bg-accent'
                    } ${index !== filteredGroups.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="truncate">
                        <p className="font-medium text-xs">{group.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {group.member_count || 0}
                      {selected && <Check className="w-3 h-3 text-primary ml-1" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-xs">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 그룹이 없습니다'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
          <div className="text-xs text-muted-foreground flex-1 min-w-0">
            {selectedGroupId ? (
              <span className="truncate block">
                {groups.find((g) => g.id === selectedGroupId)?.name ?? ''}
              </span>
            ) : (
              '그룹을 선택하세요'
            )}
          </div>
          <Button
            onClick={() => {
              if (!selectedGroupId) return;
              handleAssignToGroup(selectedGroupId);
            }}
            disabled={!selectedGroupId || assigning}
            size="sm"
            className="h-7"
          >
            {assigning ? '배정 중...' : '배정하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}