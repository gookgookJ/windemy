import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupCreateDropdownProps {
  onClose: () => void;
  onGroupCreated?: () => void;
  position?: { top: number; left: number };
}

export function GroupCreateDropdown({ 
  onClose, 
  onGroupCreated,
  position = { top: 0, left: 0 }
}: GroupCreateDropdownProps) {
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // 입력 필드에 자동 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
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
          name: newGroupName.trim(),
          color: randomColor
        }])
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      
      toast({
        title: "그룹 생성 완료",
        description: `"${data.name}" 그룹이 생성되었습니다.`
      });

      onGroupCreated?.();
      
      // 2초 후 자동으로 닫기
      setTimeout(() => {
        onClose();
      }, 2000);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newGroupName.trim() && !loading && !success) {
      e.preventDefault();
      handleCreateGroup();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg w-72"
      style={{ 
        top: position.top + 5, 
        left: Math.max(10, position.left - 30) // 버튼에서 30px 왼쪽으로, 최소 10px 여백
      }}
    >
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">새 그룹 생성</span>
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

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-success">그룹이 생성되었습니다!</p>
            <p className="text-xs text-muted-foreground mt-1">곧 창이 닫힙니다...</p>
          </div>
        ) : (
          <>
            {/* 그룹명 입력 */}
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-sm font-medium">그룹명</Label>
              <Input
                ref={inputRef}
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: VIP 고객, 신규 회원"
                className="h-8 text-sm"
                disabled={loading}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="h-7"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || loading}
                size="sm"
                className="h-7"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-3 h-3 border-2 border-background border-t-transparent rounded-full mr-1.5" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1.5" />
                    생성
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}