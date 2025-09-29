import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Trash2, Edit, UserPlus, Search, Tag, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
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
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            그룹 관리
            {selectedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-3 px-3 py-1 text-sm">
                {selectedUsers.length}명 선택됨
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <div className="space-y-8">
            {/* Quick Assignment Section - Only show when users are selected */}
            {selectedUsers.length > 0 && (
              <Card className="border-2 border-primary/30 bg-primary/10 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-3 text-primary">
                    <UserPlus className="h-5 w-5" />
                    선택한 사용자 빠른 할당
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="quickAssign" className="text-base font-medium mb-3 block">
                        {selectedUsers.length}명을 그룹에 일괄 할당
                      </Label>
                      <Select value={quickAssignGroup} onValueChange={setQuickAssignGroup}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="할당할 그룹을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-3 py-1">
                                <div className={`w-4 h-4 rounded-full ${group.color.split(' ')[0]}`}></div>
                                <span className="font-medium">{group.name}</span>
                                <span className="text-muted-foreground">({group.memberCount}명)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleQuickAssign} className="px-8 h-12 text-base">
                      할당하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create New Group Section */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3">
                  <Plus className="h-5 w-5 text-primary" />
                  새 그룹 생성
                </CardTitle>
                <Button 
                  size="lg" 
                  onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                  variant={isCreatingGroup ? "outline" : "default"}
                  className="px-6"
                >
                  {isCreatingGroup ? '취소' : '새 그룹 만들기'}
                </Button>
              </CardHeader>
              
              {isCreatingGroup && (
                <CardContent className="space-y-6 pt-0 border-t">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="groupName" className="text-base font-medium">
                        그룹 이름 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="groupName"
                        placeholder="예: VIP 고객, 신규 회원, 특별 관리 대상"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="groupDescription" className="text-base font-medium">그룹 설명</Label>
                      <Input
                        id="groupDescription"
                        placeholder="그룹의 용도나 특성을 간단히 설명"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">그룹 색상 선택</Label>
                    <div className="flex gap-3 flex-wrap">
                      {groupColors.map((color, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`w-10 h-10 rounded-full border-2 transition-all ${color.split(' ')[0]} ${
                            selectedColor === color 
                              ? 'ring-4 ring-primary ring-offset-2 scale-110' 
                              : 'hover:scale-105'
                          }`}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleCreateGroup} className="flex-1 h-12 text-base">
                      <Plus className="h-5 w-5 mr-2" />
                      그룹 생성하기
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Existing Groups */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  기존 그룹 목록
                  <Badge variant="outline" className="ml-2">
                    총 {mockGroups.length}개
                  </Badge>
                </h3>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="그룹명 또는 설명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 w-72 h-11"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-lg transition-all duration-200 border hover:border-primary/30">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Group Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${group.color.split(' ')[0]}`}></div>
                              <h4 className="font-bold text-lg">{group.name}</h4>
                            </div>
                            <Badge className={`${group.color} font-medium`} variant="secondary">
                              {group.memberCount}명
                            </Badge>
                            <p className="text-muted-foreground leading-relaxed">{group.description}</p>
                          </div>
                        </div>
                        
                        {/* Group Info */}
                        <div className="text-sm text-muted-foreground border-t pt-3">
                          생성일: {group.createdAt}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {selectedUsers.length > 0 && (
                            <Button 
                              size="sm" 
                              className="flex-1 h-10"
                              onClick={() => handleAssignToGroup(group.id, group.name)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {selectedUsers.length}명 할당
                            </Button>
                          )}
                          
                          <Button size="sm" variant="outline" className="h-10 px-4">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-10 px-4 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredGroups.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground text-xl mb-3">검색된 그룹이 없습니다</div>
                  <p className="text-muted-foreground">다른 검색어를 사용해보세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t flex justify-end">
          <Button variant="outline" onClick={onClose} className="px-8 h-12">
            완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
