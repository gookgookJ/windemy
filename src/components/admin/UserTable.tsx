import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, ArrowUpDown, Mail, MessageSquare, Download, UserCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserTableData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  total_payment: number;
  status: string;
  avatar_url?: string;
  phone?: string;
}

interface UserTableProps {
  users: UserTableData[];
  loading?: boolean;
  onUserSelect: (userId: string) => void;
  onRoleChange: (userId: string, newRole: string) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
}

type SortField = 'created_at' | 'last_login' | 'total_payment' | 'full_name';
type SortDirection = 'asc' | 'desc';

export const UserTable = ({ 
  users, 
  loading, 
  onUserSelect, 
  onRoleChange,
  onBulkAction 
}: UserTableProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'instructor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'instructor':
        return '강사';
      default:
        return '학생';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">정상</Badge>;
      case 'inactive':
        return <Badge variant="secondary">휴면</Badge>;
      case 'suspended':
        return <Badge variant="destructive">이용정지</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">탈퇴</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'last_login':
        aValue = a.last_login ? new Date(a.last_login).getTime() : 0;
        bValue = b.last_login ? new Date(b.last_login).getTime() : 0;
        break;
      case 'total_payment':
        aValue = a.total_payment;
        bValue = b.total_payment;
        break;
      case 'full_name':
        aValue = a.full_name || '';
        bValue = b.full_name || '';
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          사용자 목록 ({users.length}명)
        </CardTitle>
        
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
                  <MessageSquare className="mr-2 h-4 w-4" />
                  메시지 발송
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('export', selectedUsers)}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV 내보내기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction('status_change', selectedUsers)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  상태 변경
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === users.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>회원 정보</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  가입일
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('last_login')}
              >
                <div className="flex items-center gap-1">
                  최근 접속
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('total_payment')}
              >
                <div className="flex items-center gap-1">
                  총 결제금액
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
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => onUserSelect(user.id)}
                  >
                    <div className="font-medium">{user.full_name || '이름 없음'}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), 'yyyy-MM-dd', { locale: ko })}
                </TableCell>
                <TableCell>
                  {user.last_login ? (
                    format(new Date(user.last_login), 'yyyy-MM-dd', { locale: ko })
                  ) : (
                    <span className="text-muted-foreground">기록 없음</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatCurrency(user.total_payment)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Select 
                      value={user.role} 
                      onValueChange={(newRole) => onRoleChange(user.id, newRole)}
                    >
                      <SelectTrigger className="w-[100px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">학생</SelectItem>
                        <SelectItem value="instructor">강사</SelectItem>
                        <SelectItem value="admin">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        상세 정보
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        메시지 발송
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        메모 확인
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            검색 조건에 맞는 사용자가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
};