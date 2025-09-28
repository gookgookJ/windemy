import { useState } from 'react';
import { Search, Filter, RotateCcw, Calendar, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserFilters {
  searchTerm: string;
  status: string;
  learningStatus: string;
  marketingEmail: string;
  joinDateStart?: Date;
  joinDateEnd?: Date;
  expirationFilter: string;
}

interface UserSearchFilterProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onReset: () => void;
  totalUsers: number;
  filteredUsers: number;
}

export const UserSearchFilter = ({
  filters,
  onFiltersChange,
  onReset,
  totalUsers,
  filteredUsers
}: UserSearchFilterProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const updateFilter = (key: keyof UserFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.learningStatus !== 'all') count++;
    if (filters.marketingEmail !== 'all') count++;
    if (filters.expirationFilter !== 'all') count++;
    if (filters.joinDateStart) count++;
    if (filters.joinDateEnd) count++;
    return count;
  };

  return (
    <Card className="shadow-sm border-0 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardContent className="pt-6">
        {/* 검색 결과 표시 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>총 {totalUsers.toLocaleString()}명 중</span>
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {filteredUsers.toLocaleString()}명 표시
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Excel 내보내기
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              새로고침
            </Button>
          </div>
        </div>

        {/* 메인 검색 영역 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="회원명, 이메일, 연락처로 빠른 검색..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10 h-11 text-base border-0 bg-white dark:bg-slate-800 shadow-sm"
            />
          </div>
          
          <Button
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="h-11 px-4 bg-white dark:bg-slate-800 border-0 shadow-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            상세필터
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
          
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="h-11 px-4 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
          )}
        </div>

        {/* 상세 필터 영역 */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t bg-white/50 dark:bg-slate-800/50 -mx-6 px-6 pb-4 rounded-b-lg">
            {/* 회원 상태 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">회원 상태</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">정상</SelectItem>
                  <SelectItem value="dormant">휴면 (30일 미접속)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 학습 현황 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">학습 현황</label>
              <Select value={filters.learningStatus} onValueChange={(value) => updateFilter('learningStatus', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="learning">수강 중</SelectItem>
                  <SelectItem value="completed">완주</SelectItem>
                  <SelectItem value="not_started">미시작</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 수강권 만료 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">수강권 만료</label>
              <Select value={filters.expirationFilter} onValueChange={(value) => updateFilter('expirationFilter', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="expiring_soon">7일 내 만료</SelectItem>
                  <SelectItem value="expired">만료됨</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 마케팅 수신동의 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">마케팅 수신</label>
              <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">수신동의</SelectItem>
                  <SelectItem value="false">수신거부</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 가입일 범위 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">가입일 (시작)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.joinDateStart ? format(filters.joinDateStart, 'yyyy-MM-dd') : "시작일 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.joinDateStart}
                    onSelect={(date) => updateFilter('joinDateStart', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">가입일 (종료)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.joinDateEnd ? format(filters.joinDateEnd, 'yyyy-MM-dd') : "종료일 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.joinDateEnd}
                    onSelect={(date) => updateFilter('joinDateEnd', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};