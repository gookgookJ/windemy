import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface UserFilterOptions {
  searchTerm: string;
  status: string;
  role: string;
  startDate?: Date;
  endDate?: Date;
  lastLoginStart?: Date;
  lastLoginEnd?: Date;
  marketingEmail: string;
  marketingSms: string;
  enrolledCourse?: string;
}

interface UserFiltersProps {
  filters: UserFilterOptions;
  onFiltersChange: (filters: UserFilterOptions) => void;
  onReset: () => void;
  courseOptions?: Array<{ id: string; title: string }>;
}

export const UserFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  courseOptions = []
}: UserFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof UserFilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.role !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.lastLoginStart) count++;
    if (filters.lastLoginEnd) count++;
    if (filters.marketingEmail !== 'all') count++;
    if (filters.marketingSms !== 'all') count++;
    if (filters.enrolledCourse) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* 기본 검색 및 필터 */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 통합 검색창 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="이름, 이메일, 연락처, 회원 ID로 검색..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 기본 필터들 */}
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="회원 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="active">정상</SelectItem>
              <SelectItem value="inactive">휴면</SelectItem>
              <SelectItem value="suspended">이용정지</SelectItem>
              <SelectItem value="withdrawn">탈퇴</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.role} onValueChange={(value) => updateFilter('role', value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="권한" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 권한</SelectItem>
              <SelectItem value="student">학생</SelectItem>
              <SelectItem value="instructor">강사</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            고급 필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={onReset} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              초기화
            </Button>
          )}
        </div>

        {/* 고급 필터 */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            {/* 날짜 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">가입일 시작</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? format(filters.startDate, 'yyyy-MM-dd', { locale: ko }) : '선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => updateFilter('startDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">가입일 종료</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? format(filters.endDate, 'yyyy-MM-dd', { locale: ko }) : '선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => updateFilter('endDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">최근 접속 시작</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.lastLoginStart ? format(filters.lastLoginStart, 'yyyy-MM-dd', { locale: ko }) : '선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.lastLoginStart}
                      onSelect={(date) => updateFilter('lastLoginStart', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">최근 접속 종료</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.lastLoginEnd ? format(filters.lastLoginEnd, 'yyyy-MM-dd', { locale: ko }) : '선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.lastLoginEnd}
                      onSelect={(date) => updateFilter('lastLoginEnd', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 마케팅 동의 및 수강 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">이메일 마케팅 동의</label>
                <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">동의</SelectItem>
                    <SelectItem value="false">미동의</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">SMS 마케팅 동의</label>
                <Select value={filters.marketingSms} onValueChange={(value) => updateFilter('marketingSms', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="true">동의</SelectItem>
                    <SelectItem value="false">미동의</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">수강 강의</label>
                <Select value={filters.enrolledCourse || 'all'} onValueChange={(value) => updateFilter('enrolledCourse', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="특정 강의 수강자" />
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};