import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Mail, 
  Download, 
  UserX, 
  UserCheck,
  Eye,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserListData {
  id: string;
  memberId: string;
  name: string;
  email: string;
  joinDate: string;
  lastLogin?: string;
  totalPayment: number;
  status: 'active' | 'dormant' | 'suspended' | 'withdrawn';
  grade: string;
  phone?: string;
  avatar?: string;
}

interface UserListTableProps {
  users: UserListData[];
  loading?: boolean;
  onUserSelect: (userId: string) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
  onStatusChange: (userId: string, newStatus: string) => void;
}

type SortField = 'name' | 'joinDate' | 'lastLogin' | 'totalPayment';
type SortDirection = 'asc' | 'desc';

export const UserListTable = ({ 
  users, 
  loading, 
  onUserSelect, 
  onBulkAction,
  onStatusChange 
}: UserListTableProps) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('joinDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: '정상' },
      dormant: { variant: 'secondary' as const, label: '휴면' },
      suspended: { variant: 'destructive' as const, label: '정지' },
      withdrawn: { variant: 'outline' as const, label: '탈퇴' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getGradeBadge = (grade: string) => {
    const variants = {
      normal: { variant: 'outline' as const, label: '일반' },
      vip: { variant: 'default' as const, label: 'VIP' },
      premium: { variant: 'secondary' as const, label: '프리미엄' }
    };
    
    const config = variants[grade as keyof typeof variants] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // 날짜 필드 처리
    if (sortField === 'joinDate' || sortField === 'lastLogin') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }

    // 숫자 필드 처리
    if (sortField === 'totalPayment') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    // 문자열 필드 처리
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>사용자 목록</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              총 {users.length}명의 사용자
              {selectedUsers.size > 0 && ` • ${selectedUsers.size}명 선택됨`}
            </p>
          </div>
          
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('message', Array.from(selectedUsers))}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                메시지 발송
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('export', Array.from(selectedUsers))}
              >
                <Download className="h-4 w-4 mr-1" />
                내보내기
              </Button>
              <Select onValueChange={(value) => onBulkAction('status_change', Array.from(selectedUsers))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태 변경" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">정상</SelectItem>
                  <SelectItem value="dormant">휴면</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                </SelectContent>
              </Select>
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
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>회원 ID</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    이름
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead>이메일</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center gap-1">
                    가입일
                    <SortIcon field="joinDate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center gap-1">
                    최근 접속
                    <SortIcon field="lastLogin" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('totalPayment')}
                >
                  <div className="flex items-center gap-1">
                    총 결제금액
                    <SortIcon field="totalPayment" />
                  </div>
                </TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등급</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    검색 조건에 맞는 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{user.memberId}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => onUserSelect(user.id)}
                        className="text-left hover:text-primary hover:underline font-medium"
                      >
                        {user.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(user.joinDate), 'yyyy-MM-dd', { locale: ko })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.lastLogin 
                        ? format(new Date(user.lastLogin), 'yyyy-MM-dd', { locale: ko })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {user.totalPayment.toLocaleString()}원
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getGradeBadge(user.grade)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onUserSelect(user.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            상세 정보
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            메시지 발송
                          </DropdownMenuItem>
                          {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => onStatusChange(user.id, 'suspended')}>
                              <UserX className="h-4 w-4 mr-2" />
                              계정 정지
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onStatusChange(user.id, 'active')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              계정 활성화
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};