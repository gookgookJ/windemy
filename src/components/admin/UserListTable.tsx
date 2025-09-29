import { useState } from 'react';
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Download, 
  Settings, 
  Eye, 
  Users2, 
  Gift, 
  Coins, 
  FileText, 
  UserCog, 
  Plus,
  Shield,
  User,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  role?: string; // 사용자 역할 (admin, student 등)
  group?: string; // 그룹 분류
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
  onAddNote: (userId: string, userEmail: string) => void;
  onGroupAssign: (userIds: string[], triggerElement: HTMLElement) => void;
  onGroupCreate: (triggerElement: HTMLElement) => void;
  onExportData: (userIds: string[], triggerElement: HTMLElement) => void;
  onRoleChange: (userId: string, userName: string, userEmail: string, currentRole: string) => void;
  onRefresh: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedUsers: string[];
  onSelectedUsersChange: (users: string[]) => void;
}

const statusLabels = {
  active: '정상',
  dormant: '휴면'
};

const statusColors = {
  active: 'default',
  dormant: 'secondary'
} as const;

const roles = [
  { value: 'student', label: '학생', icon: User, color: 'bg-blue-100 text-blue-800' },
  { value: 'instructor', label: '강사', icon: GraduationCap, color: 'bg-green-100 text-green-800' },
  { value: 'admin', label: '관리자', icon: Shield, color: 'bg-red-100 text-red-800' },
];

export const UserListTable = ({ 
  users = [], 
  loading, 
  onUserSelect, 
  onBulkAction, 
  onStatusChange,
  onCouponDistribute,
  onPointsDistribute,
  onDeleteUser,
  onResetPassword,
  onAddNote,
  onGroupAssign,
  onGroupCreate,
  onExportData,
  onRoleChange,
  onRefresh,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedUsers = [],
  onSelectedUsersChange
}: UserListTableProps) => {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserData;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedUsersChange(paginatedUsers.map(user => user.id));
    } else {
      onSelectedUsersChange([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectedUsersChange([...selectedUsers, userId]);
    } else {
      onSelectedUsersChange(selectedUsers.filter(id => id !== userId));
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

  // Pagination calculations
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, totalItems);

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

  const handleRoleChangeInline = async (userId: string, newRole: string) => {
    console.log('권한 변경 시작:', { userId, newRole });
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select('*');

      if (error) {
        console.error('Supabase 오류:', error);
        throw error;
      }

      console.log('권한 변경 성공:', data);

      toast({
        title: "권한 변경 완료",
        description: `사용자 권한이 ${roles.find(r => r.value === newRole)?.label}로 변경되었습니다.`,
      });

      // 즉시 UI 업데이트를 위해 onRefresh 호출
      onRefresh();
    } catch (error: any) {
      console.error('권한 변경 오류:', error);
      toast({
        title: "권한 변경 실패",
        description: error.message || "권한 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
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
      <CardHeader className="bg-muted/10 border-b border-border/30 space-y-4">
        {/* 테이블 제목 */}
        <CardTitle className="text-lg font-semibold text-foreground">
          회원 목록 
          <span className="ml-2 text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            총 {totalItems}명
          </span>
        </CardTitle>
        
        {/* 일괄 작업 툴바 - 항상 표시 */}
        <div className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg px-4 py-3">
          {/* 선택 상태 영역 */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
              selectedUsers.length > 0 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              {selectedUsers.length > 0 ? `${selectedUsers.length}명 선택됨` : '선택된 회원 없음'}
            </span>
            {selectedUsers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectedUsersChange([])}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                선택 해제
              </Button>
            )}
          </div>
          
          {/* 작업 툴바 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('status_change', selectedUsers)}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Settings className="h-4 w-4 mr-1.5" />
              상태변경
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCouponDistribute(selectedUsers)}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Gift className="h-4 w-4 mr-1.5" />
              쿠폰 지급
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPointsDistribute(selectedUsers)}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Coins className="h-4 w-4 mr-1.5" />
              포인트 지급
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                onGroupAssign(selectedUsers, e.currentTarget);
              }}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Users2 className="h-4 w-4 mr-1.5" />
              그룹 배정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                onGroupCreate(e.currentTarget);
              }}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              그룹 생성
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                onExportData(selectedUsers, e.currentTarget);
              }}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1.5" />
              내보내기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('role_change', selectedUsers)}
              disabled={selectedUsers.length === 0}
              className="h-8"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              권한변경
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b-2 border-border/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">회원 정보</TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground transition-colors min-w-[100px] text-center"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    가입일
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground transition-colors min-w-[100px] text-center"
                  onClick={() => handleSort('lastLogin')}
                >
                  <div className="flex items-center justify-center gap-1">
                    최근 접속
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground min-w-[80px] text-center">그룹</TableHead>
                <TableHead className="font-semibold text-muted-foreground min-w-[100px] text-center">권한</TableHead>
                <TableHead className="font-semibold text-muted-foreground min-w-[80px] text-center">마케팅 수신</TableHead>
                <TableHead 
                  className="cursor-pointer text-right font-semibold text-muted-foreground hover:text-foreground transition-colors min-w-[120px]"
                  onClick={() => handleSort('totalPayment')}
                >
                   <div className="flex items-center justify-end gap-1">
                    누적 결제액
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground min-w-[60px] text-center">상태</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
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
                    <div className="space-y-1.5">
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
                  <TableCell className="text-center">
                    <div className="text-sm font-medium">{formatDate(user.joinDate)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm font-medium">
                      {user.lastLogin ? formatDate(user.lastLogin) : 
                        <span className="text-muted-foreground italic">미접속</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {user.group || '미분류'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={user.role || 'student'}
                      onValueChange={(newRole) => {
                        console.log('권한 변경 시도:', { userId: user.id, newRole, currentRole: user.role });
                        handleRoleChangeInline(user.id, newRole);
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value} className="text-xs">
                            <div className="flex items-center gap-2">
                              <role.icon className="h-3 w-3" />
                              <span>{role.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={user.marketingEmail ? "default" : "secondary"} 
                      className={`text-xs font-medium ${
                        user.marketingEmail 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      } pointer-events-none`}
                    >
                      {user.marketingEmail ? '동의' : '거부'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(user.totalPayment)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={statusColors[user.status]} 
                      className={`text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-warning/10 text-warning border-warning/20'
                      } pointer-events-none`}
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
                        <DropdownMenuItem onClick={() => onUserSelect(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          회원 상세정보
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          비밀번호 초기화
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNote(user.id, user.email)}>
                          <FileText className="mr-2 h-4 w-4" />
                          관리자 메모 추가
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRoleChange(user.id, user.name, user.email, user.role || 'student')}>
                          <Shield className="mr-2 h-4 w-4" />
                          권한 변경
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

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {startItem}-{endItem} / {totalItems}명
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">페이지당</span>
                <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">개</span>
              </div>
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) onPageChange(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onPageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) onPageChange(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
        
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