import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, User, Shield, GraduationCap } from 'lucide-react';

interface RoleChangeModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onSuccess?: () => void;
}

const roles = [
  { value: 'student', label: '학생', icon: User, color: 'bg-blue-100 text-blue-800' },
  { value: 'instructor', label: '강사', icon: GraduationCap, color: 'bg-green-100 text-green-800' },
  { value: 'admin', label: '관리자', icon: Shield, color: 'bg-red-100 text-red-800' },
];

export const RoleChangeModal = ({ open, onClose, user, onSuccess }: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (!user || !selectedRole) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "권한 변경 완료",
        description: `${user.name}님의 권한이 ${roles.find(r => r.value === selectedRole)?.label}로 변경되었습니다.`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('권한 변경 오류:', error);
      toast({
        title: "권한 변경 실패",
        description: error.message || "권한 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentRole = roles.find(r => r.value === user?.role);
  const selectedRoleInfo = roles.find(r => r.value === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            사용자 권한 변경
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            {/* 사용자 정보 */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">변경 대상 사용자</h4>
              <div className="space-y-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">현재 권한:</span>
                  {currentRole && (
                    <Badge variant="outline" className={currentRole.color}>
                      <currentRole.icon className="h-3 w-3 mr-1" />
                      {currentRole.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 권한 선택 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">새로운 권한 선택</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="권한을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4" />
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 변경 사항 미리보기 */}
            {selectedRole && selectedRole !== user.role && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span>권한이</span>
                  {currentRole && (
                    <Badge variant="outline" className={currentRole.color}>
                      <currentRole.icon className="h-3 w-3 mr-1" />
                      {currentRole.label}
                    </Badge>
                  )}
                  <span>에서</span>
                  {selectedRoleInfo && (
                    <Badge variant="outline" className={selectedRoleInfo.color}>
                      <selectedRoleInfo.icon className="h-3 w-3 mr-1" />
                      {selectedRoleInfo.label}
                    </Badge>
                  )}
                  <span>로 변경됩니다.</span>
                </div>
              </div>
            )}

            {/* 경고 메시지 */}
            {selectedRole === 'admin' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  관리자 권한을 부여하면 모든 시스템 기능에 접근할 수 있습니다. 신중하게 결정하세요.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button 
            onClick={handleRoleChange} 
            disabled={!selectedRole || selectedRole === user?.role || loading}
          >
            {loading ? '변경 중...' : '권한 변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};