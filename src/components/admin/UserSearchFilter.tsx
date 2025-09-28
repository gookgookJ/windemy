import { useState } from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';
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
  userGrade: string;
  enrolledCourse: string;
  marketingEmail: string;
  marketingSms: string;
  joinDateStart?: Date;
  joinDateEnd?: Date;
  lastLoginStart?: Date;
  lastLoginEnd?: Date;
}

interface UserSearchFilterProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export const UserSearchFilter = ({
  filters,
  onFiltersChange,
  onReset
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
    if (filters.userGrade !== 'all') count++;
    if (filters.enrolledCourse !== 'all') count++;
    if (filters.marketingEmail !== 'all') count++;
    if (filters.marketingSms !== 'all') count++;
    if (filters.joinDateStart) count++;
    if (filters.joinDateEnd) count++;
    if (filters.lastLoginStart) count++;
    if (filters.lastLoginEnd) count++;
    return count;
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* 기본 검색 영역 */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 이메일, 연락처, 회원 ID로 검색..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            고급 필터
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </Button>
        </div>

        {/* 고급 필터 영역 */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* 회원 상태 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">회원 상태</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">정상</SelectItem>
                  <SelectItem value="dormant">휴면</SelectItem>
                  <SelectItem value="suspended">이용정지</SelectItem>
                  <SelectItem value="withdrawn">탈퇴</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 회원 등급 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">회원 등급</label>
              <Select value={filters.userGrade} onValueChange={(value) => updateFilter('userGrade', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="instructor">강사</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 이메일 마케팅 수신 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">이메일 마케팅</label>
              <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">수신동의</SelectItem>
                  <SelectItem value="false">수신거부</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SMS 마케팅 수신 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">SMS 마케팅</label>
              <Select value={filters.marketingSms} onValueChange={(value) => updateFilter('marketingSms', value)}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">가입일 시작</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.joinDateStart ? format(filters.joinDateStart, 'yyyy-MM-dd', { locale: ko }) : "시작일 선택"}
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
              <label className="text-sm font-medium">가입일 종료</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.joinDateEnd ? format(filters.joinDateEnd, 'yyyy-MM-dd', { locale: ko }) : "종료일 선택"}
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

            {/* 최근 접속일 범위 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">최근 접속일 시작</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.lastLoginStart ? format(filters.lastLoginStart, 'yyyy-MM-dd', { locale: ko }) : "시작일 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.lastLoginStart}
                    onSelect={(date) => updateFilter('lastLoginStart', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">최근 접속일 종료</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.lastLoginEnd ? format(filters.lastLoginEnd, 'yyyy-MM-dd', { locale: ko }) : "종료일 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.lastLoginEnd}
                    onSelect={(date) => updateFilter('lastLoginEnd', date)}
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