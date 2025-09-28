import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserSearchFilters {
  searchTerm: string;
  joinDateStart?: Date;
  joinDateEnd?: Date;
  lastLoginStart?: Date;
  lastLoginEnd?: Date;
  status: string;
  memberGrade: string;
  enrolledCourse: string;
  marketingEmail: string;
  marketingSms: string;
}

interface UserSearchFilterProps {
  filters: UserSearchFilters;
  onFiltersChange: (filters: UserSearchFilters) => void;
  onReset: () => void;
  courseOptions?: Array<{ id: string; title: string }>;
}

export const UserSearchFilter = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  courseOptions = []
}: UserSearchFilterProps) => {
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = (key: keyof UserSearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // 활성 필터 개수 계산
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.joinDateStart || filters.joinDateEnd) count++;
    if (filters.lastLoginStart || filters.lastLoginEnd) count++;
    if (filters.status !== 'all') count++;
    if (filters.memberGrade !== 'all') count++;
    if (filters.enrolledCourse !== 'all') count++;
    if (filters.marketingEmail !== 'all') count++;
    if (filters.marketingSms !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">사용자 검색 및 필터</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}개 필터 적용됨
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              고급 필터
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 통합 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 연락처, 회원 ID로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 기본 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">회원 상태</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">회원 등급</Label>
            <Select value={filters.memberGrade} onValueChange={(value) => updateFilter('memberGrade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="등급 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="normal">일반</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="premium">프리미엄</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">수강 강의</Label>
            <Select value={filters.enrolledCourse} onValueChange={(value) => updateFilter('enrolledCourse', value)}>
              <SelectTrigger>
                <SelectValue placeholder="강의 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 고급 필터 */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">고급 필터 옵션</h4>
            
            {/* 날짜 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">가입일 범위</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.joinDateStart ? format(filters.joinDateStart, 'yyyy-MM-dd', { locale: ko }) : '시작일'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.joinDateStart}
                        onSelect={(date) => updateFilter('joinDateStart', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">~</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.joinDateEnd ? format(filters.joinDateEnd, 'yyyy-MM-dd', { locale: ko }) : '종료일'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.joinDateEnd}
                        onSelect={(date) => updateFilter('joinDateEnd', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">최근 접속일 범위</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.lastLoginStart ? format(filters.lastLoginStart, 'yyyy-MM-dd', { locale: ko }) : '시작일'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.lastLoginStart}
                        onSelect={(date) => updateFilter('lastLoginStart', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">~</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.lastLoginEnd ? format(filters.lastLoginEnd, 'yyyy-MM-dd', { locale: ko }) : '종료일'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.lastLoginEnd}
                        onSelect={(date) => updateFilter('lastLoginEnd', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* 마케팅 수신 동의 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">이메일 마케팅 수신</Label>
                <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="수신 동의 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">동의</SelectItem>
                    <SelectItem value="false">미동의</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">SMS 마케팅 수신</Label>
                <Select value={filters.marketingSms} onValueChange={(value) => updateFilter('marketingSms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="수신 동의 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">동의</SelectItem>
                    <SelectItem value="false">미동의</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};