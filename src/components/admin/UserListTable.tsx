import { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, MessageCircle, Download, Settings, Eye, Clock, BookOpen, Award, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  // 교육 플랫폼 특화 데이터
  currentCourses: number;
  completedCourses: number;
  totalLearningTime: number; // 분 단위
  averageProgress: number; // 퍼센트
  expirationDate?: string;
  lastLearningDate?: string;
  certificatesEarned: number;
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
    
    if (key === 'joinDate' || key === 'lastLogin' || key === 'lastLearningDate' || key === 'expirationDate') {
      aValue = aValue ? new Date(aValue as string).getTime() : 0;
      bValue = bValue ? new Date(bValue as string).getTime() : 0;
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
    return format(new Date(dateString), 'MM/dd', { locale: ko });
  };

  const formatLearningTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (expirationDate?: string) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">회원 정보를 불러오는 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            회원 목록
            <Badge variant="outline" className="ml-2 font-normal">
              {users.length.toLocaleString()}명
            </Badge>
          </CardTitle>
          
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                <span className="font-semibold text-primary">{selectedUsers.length}명</span> 선택됨
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-9 bg-primary hover:bg-primary/90">
                    일괄 처리 <span className="ml-1">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onBulkAction('message', selectedUsers)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    선택 회원에게 알림 발송
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('export', selectedUsers)}>
                    <Download className="mr-2 h-4 w-4" />
                    회원 정보 Excel 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBulkAction('extend_access', selectedUsers)}>
                    <Clock className="mr-2 h-4 w-4" />
                    수강권 연장
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction('status_change', selectedUsers)}>
                    <Settings className="mr-2 h-4 w-4" />
                    상태 일괄 변경
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
              <TableRow className="bg-muted/30 border-b-2">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">회원정보</TableHead>
                <TableHead className="font-semibold">학습현황</TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold hover:bg-muted/50"
                  onClick={() => handleSort('lastLearningDate')}
                >
                  <div className="flex items-center gap-1">
                    최근학습
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer font-semibold hover:bg-muted/50"
                  onClick={() => handleSort('expirationDate')}
                >
                  <div className="flex items-center gap-1">
                    수강권만료
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right font-semibold hover:bg-muted/50"
                  onClick={() => handleSort('totalPayment')}
                >
                  <div className="flex items-center justify-end gap-1">
                    총 결제금액
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center">상태</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="hover:bg-blue-50 dark:hover:bg-blue-950/30 border-b transition-colors cursor-pointer"
                  onClick={() => onUserSelect(user.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  
                  {/* 회원정보 */}
                  <TableCell className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{user.name}</span>
                        <Badge variant="outline" className="text-xs font-mono bg-slate-100 dark:bg-slate-800">
                          {user.memberId}
                        </Badge>
                        {user.certificatesEarned > 0 && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">가입: {formatDate(user.joinDate)}</div>
                    </div>
                  </TableCell>

                  {/* 학습현황 */}
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{user.currentCourses}개 수강중</span>
                        <span className="text-muted-foreground">• {user.completedCourses}개 완주</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={user.averageProgress} className="w-20 h-2" />
                        <span className="text-xs font-medium">{user.averageProgress}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        총 {formatLearningTime(user.totalLearningTime)} 학습
                      </div>
                    </div>
                  </TableCell>

                  {/* 최근학습 */}
                  <TableCell>
                    <div className="text-sm">
                      {user.lastLearningDate ? (
                        <div className="space-y-1">
                          <div>{formatDate(user.lastLearningDate)}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.ceil((new Date().getTime() - new Date(user.lastLearningDate).getTime()) / (1000 * 60 * 60 * 24))}일 전
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* 수강권만료 */}
                  <TableCell>
                    {user.expirationDate ? (
                      <div className="flex items-center gap-2">
                        {isExpired(user.expirationDate) ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <div className="text-sm">
                              <div className="text-red-600 font-medium">만료됨</div>
                              <div className="text-xs text-muted-foreground">{formatDate(user.expirationDate)}</div>
                            </div>
                          </>
                        ) : isExpiringSoon(user.expirationDate) ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <div className="text-sm">
                              <div className="text-yellow-600 font-medium">곧 만료</div>
                              <div className="text-xs text-muted-foreground">{formatDate(user.expirationDate)}</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">활성</div>
                            <div className="text-xs text-muted-foreground">{formatDate(user.expirationDate)}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  {/* 총 결제금액 */}
                  <TableCell className="text-right">
                    <div className="font-semibold text-lg">{formatCurrency(user.totalPayment)}</div>
                  </TableCell>

                  {/* 상태 */}
                  <TableCell className="text-center">
                    <Badge variant={statusColors[user.status]} className="text-xs">
                      {statusLabels[user.status]}
                    </Badge>
                  </TableCell>

                  {/* 액션 */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onUserSelect(user.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세정보 보기
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          개별 메시지 발송
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Clock className="mr-2 h-4 w-4" />
                          수강권 연장
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onStatusChange(user.id, user.status === 'active' ? 'dormant' : 'active')}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          상태: {user.status === 'active' ? '휴면' : '정상'}으로 변경
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
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">검색된 회원이 없습니다</div>
            <p className="text-sm text-muted-foreground">검색어나 필터 조건을 변경해보세요</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};