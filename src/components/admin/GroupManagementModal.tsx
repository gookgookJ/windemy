import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Users, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GroupQuickActions } from './GroupQuickActions';
import { GroupCard } from './GroupCard';

interface GroupManagementModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers?: string[];
  onGroupAssigned?: (groupId: string) => void;
}

// Mock data for existing groups
const mockGroups = [
  {
    id: '1',
    name: 'VIP 고객',
    description: '프리미엄 고객 그룹',
    memberCount: 25,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    createdAt: '2024-03-01'
  },
  {
    id: '2',
    name: '신규 회원',
    description: '최근 1개월 내 가입 회원',
    memberCount: 120,
    color: 'bg-green-100 text-green-800 border-green-200',
    createdAt: '2024-03-15'
  },
  {
    id: '3',
    name: '장기 미접속',
    description: '30일 이상 미접속 회원',
    memberCount: 45,
    color: 'bg-red-100 text-red-800 border-red-200',
    createdAt: '2024-02-20'
  },
  {
    id: '4',
    name: '수강 완료자',
    description: '최소 1개 강의 완료한 회원',
    memberCount: 89,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    createdAt: '2024-01-10'
  }
];

const groupColors = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-orange-100 text-orange-800 border-orange-200'
];

export const GroupManagementModal = ({ 
  open, 
  onClose, 
  selectedUsers = [], 
  onGroupAssigned 
}: GroupManagementModalProps) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(groupColors[0]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickAssignGroup, setQuickAssignGroup] = useState<string>('');
  const { toast } = useToast();

  const filteredGroups = mockGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "그룹 이름을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    console.log('새 그룹 생성:', { 
      name: newGroupName, 
      description: newGroupDescription,
      color: selectedColor 
    });
    
    toast({
      title: "그룹이 생성되었습니다",
      description: `'${newGroupName}' 그룹이 성공적으로 생성되었습니다.`,
    });

    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedColor(groupColors[0]);
    setIsCreatingGroup(false);
  };

  const handleQuickAssign = () => {
    if (!quickAssignGroup || selectedUsers.length === 0) {
      toast({
        title: "그룹을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    const group = mockGroups.find(g => g.id === quickAssignGroup);
    if (group) {
      toast({
        title: "그룹 할당 완료",
        description: `${selectedUsers.length}명이 '${group.name}' 그룹에 할당되었습니다.`,
      });

      if (onGroupAssigned) {
        onGroupAssigned(quickAssignGroup);
      }
    }
  };

  const handleAssignToGroup = (groupId: string, groupName: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "선택된 사용자가 없습니다",
        description: "먼저 사용자를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    console.log('그룹 할당:', { groupId, userIds: selectedUsers });
    
    toast({
      title: "그룹 할당 완료",
      description: `${selectedUsers.length}명이 '${groupName}' 그룹에 할당되었습니다.`,
    });

    if (onGroupAssigned) {
      onGroupAssigned(groupId);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    console.log('그룹 삭제:', groupId);
    
    toast({
      title: "그룹이 삭제되었습니다",
      description: `'${groupName}' 그룹이 삭제되었습니다.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            그룹 관리
            {selectedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedUsers.length}명 선택됨
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Quick Assignment */}
          <GroupQuickActions
            selectedUsers={selectedUsers}
            groups={mockGroups}
            selectedGroup={quickAssignGroup}
            onGroupChange={setQuickAssignGroup}
            onAssign={handleQuickAssign}
          />

          {/* Create New Group */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                새 그룹 생성
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                variant={isCreatingGroup ? "outline" : "default"}
              >
                {isCreatingGroup ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </CardHeader>
            
            {isCreatingGroup && (
              <CardContent className="space-y-4 pt-0 border-t">
                <div className="space-y-3">
                  <Label htmlFor="groupName">그룹 이름 *</Label>
                  <Input
                    id="groupName"
                    placeholder="예: VIP 고객, 신규 회원"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>색상</Label>
                  <div className="flex gap-2">
                    {groupColors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${color.split(' ')[0]} ${
                          selectedColor === color ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleCreateGroup} className="w-full">
                  그룹 생성
                </Button>
              </CardContent>
            )}
          </Card>

          <Separator />

          {/* Existing Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                기존 그룹 ({mockGroups.length})
              </h3>
              
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="그룹 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  selectedUsers={selectedUsers}
                  onAssign={handleAssignToGroup}
                  onDelete={handleDeleteGroup}
                />
              ))}
            </div>

            {filteredGroups.length === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">검색된 그룹이 없습니다</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
