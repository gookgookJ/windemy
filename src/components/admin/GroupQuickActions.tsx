import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  memberCount: number;
  color: string;
}

interface GroupQuickActionsProps {
  selectedUsers: string[];
  groups: Group[];
  selectedGroup: string;
  onGroupChange: (groupId: string) => void;
  onAssign: () => void;
}

export const GroupQuickActions = ({ 
  selectedUsers, 
  groups, 
  selectedGroup, 
  onGroupChange, 
  onAssign 
}: GroupQuickActionsProps) => {
  if (selectedUsers.length === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <UserPlus className="h-4 w-4 text-primary" />
        <Label className="font-medium text-primary">
          선택한 {selectedUsers.length}명을 그룹에 배정
        </Label>
      </div>
      
      <div className="flex gap-3">
        <Select value={selectedGroup} onValueChange={onGroupChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="그룹 선택" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${group.color.split(' ')[0]}`}></div>
                  {group.name} ({group.memberCount}명)
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onAssign} disabled={!selectedGroup}>
          배정
        </Button>
      </div>
    </div>
  );
};