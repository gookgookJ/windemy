import { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, Download, Settings, Eye, Users2, Gift, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  status: 'active' | 'dormant';
  marketingEmail: boolean;
  group: string;
}

interface UserListTableProps {
  users: UserData[];
  loading: boolean;
  onUserSelect: (userId: string) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
  onStatusChange: (userId: string, newStatus: string) => void;
  onCouponDistribute: (userIds: string[]) => void;
  onPointsDistribute: (userIds: string[]) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}

const statusLabels = {
  active: '정상',
  dormant: '휴면'
};

const statusColors = {
  active: 'default',
  dormant: 'secondary'
} as const;

export const UserListTable = ({ 
  users, 
  loading, 
  onUserSelect, 
  onBulkAction, 
  onStatusChange,
  onCouponDistribute,
  onPointsDistribute,
  onDeleteUser,
  onResetPassword
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

  const handleDeselectAll = () => {
    setSelectedUsers([]);
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
    return format(new Date(dateString), 'yyyy-MM-dd', { locale: ko });
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
    <Card className="shadow-sm border-border/50">
      <CardHeader className="bg-muted/10 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            회원 목록 
            <span className="ml-2 text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              총 {users.length}명
            </span>
          </CardTitle>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                {selectedUsers.length}명 선택됨
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeselectAll}
                className="h-9 text-muted-foreground hover:text-foreground"
              >
                선택 해제
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-9 font-medium">
                    선택 작업
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onCouponDistribute(selectedUsers)}>
                    <Gift className="mr-2 h-4 w-4" />
                    쿠폰 지급
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPointsDistribute(selectedUsers)}>
                    <Coins className="mr-2 h-4 w-4" />
                    적립금 지급
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBulkAction('export', selectedUsers)}>
                    <Download className="mr-2 h-4 w-4" />
                    Excel 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('group_management', selectedUsers)}>
                    <Users2 className="mr-2 h-4 w-4" />
                    그룹 관리
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">회원 정보</TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center gap-1">
                    가입일
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center gap-1">
                    최근 접속
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">그룹</TableHead>
                <TableHead className="font-semibold text-muted-foreground">마케팅 수신</TableHead>
                <TableHead 
                  className="cursor-pointer text-right font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleSort('totalPayment')}
                >
                   <div className="flex items-center justify-end gap-1">
                    누적 결제액
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">상태</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/20 border-b border-border/30 transition-colors">
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                  <TableCell 
                    className="cursor-pointer hover:bg-primary/5 p-4 rounded-md transition-colors"
                    onClick={() => onUserSelect(user.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{user.name}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md">
                          {user.memberId}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-muted-foreground font-mono">{user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{formatDate(user.joinDate)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {user.lastLogin ? formatDate(user.lastLogin) : 
                        <span className="text-muted-foreground italic">미접속</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {user.group}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.marketingEmail ? "default" : "secondary"} 
                      className={`text-xs font-medium ${
                        user.marketingEmail 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {user.marketingEmail ? '수신동의' : '수신거부'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(user.totalPayment)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={statusColors[user.status]} 
                      className={`text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => onStatusChange(user.id, user.status === 'active' ? 'dormant' : 'active')}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          상태: {user.status === 'active' ? '휴면' : '정상'}으로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          비밀번호 초기화
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          계정 삭제
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
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-2">검색된 회원이 없습니다</div>
            <p className="text-sm text-muted-foreground">다른 검색어나 필터를 사용해보세요</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};