import { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, MessageCircle, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserData {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
  lastLogin?: string;
  totalPayment: number;
  status: 'active' | 'dormant' | 'suspended' | 'withdrawn';
  role: 'student' | 'instructor' | 'admin';
}

interface UserListTableProps {
  users: UserData[];
  loading: boolean;
  onUserSelect: (userId: string) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
  onStatusChange: (userId: string, newStatus: string) => void;
}

const statusLabels = {
  active: '정상',
  dormant: '휴면',
  suspended: '이용정지',
  withdrawn: '탈퇴'
};

const statusColors = {
  active: 'default',
  dormant: 'secondary',
  suspended: 'destructive',
  withdrawn: 'outline'
} as const;

const roleLabels = {
  student: '학생',
  instructor: '강사',
  admin: '관리자'
};

export const UserListTable = ({
  users,
  loading,
  onUserSelect,
  onBulkAction,
  onStatusChange
}: UserListTableProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserData;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSort = (key: keyof UserData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue = a[key];
    let bValue = b[key];
    
    if (key === 'joinDate' || key === 'lastLogin') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'yyyy.MM.dd', { locale: ko });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>사용자 목록 ({users.length}명)</CardTitle>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.length}명 선택됨
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    일괄 처리
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onBulkAction('message', selectedUsers)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    메시지 발송
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('export', selectedUsers)}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBulkAction('status_change', selectedUsers)}>
                    <Settings className="mr-2 h-4 w-4" />
                    상태 변경
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>회원 ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center gap-1">
                    가입일
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center gap-1">
                    최근 접속일
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('totalPayment')}
                >
                  <div className="flex items-center justify-end gap-1">
                    총 결제 금액
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>상태</TableHead>
                <TableHead>권한</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell 
                    className="font-mono text-sm cursor-pointer hover:text-primary"
                    onClick={() => onUserSelect(user.id)}
                  >
                    {user.memberId}
                  </TableCell>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary"
                    onClick={() => onUserSelect(user.id)}
                  >
                    {user.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.joinDate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(user.totalPayment)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[user.status]}>
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUserSelect(user.id)}>
                          상세 정보 보기
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <div className="w-full">
                            <Select onValueChange={(value) => onStatusChange(user.id, value)}>
                              <SelectTrigger className="w-full h-6 text-xs">
                                <SelectValue placeholder="상태 변경" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">정상</SelectItem>
                                <SelectItem value="dormant">휴면</SelectItem>
                                <SelectItem value="suspended">이용정지</SelectItem>
                                <SelectItem value="withdrawn">탈퇴</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">검색 조건에 맞는 사용자가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};