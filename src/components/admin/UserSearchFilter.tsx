import { Search, RotateCcw, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

export interface UserFilters {
  searchTerm: string;
  status: string;
  marketingEmail: string;
  group?: string;
  joinDateStart?: Date;
  joinDateEnd?: Date;
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    if (filters.marketingEmail !== 'all') count++;
    if (filters.group && filters.group !== 'all') count++;
    if (filters.joinDateStart) count++;
    if (filters.joinDateEnd) count++;
    return count;
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* 메인 검색 영역 */}
          <div className="flex gap-3">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 이메일, 회원ID, 연락처로 검색..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10 h-10 text-sm border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            
            <div className="flex gap-2 ml-auto">
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  onClick={onReset}
                  size="sm"
                  className="h-10 px-3"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
              )}
              
              <CollapsibleTrigger asChild>
                <Button 
                  variant="default"
                  size="sm" 
                  className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  상세 필터
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-background/20 text-primary-foreground">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* 펼쳐지는 필터 영역 */}
          <CollapsibleContent>
            <div className="mt-4 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 회원 상태 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">회원 상태</label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                    <SelectTrigger className="bg-background border-border/60 h-10 focus:border-primary focus:ring-1 focus:ring-primary/20">
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 상태</SelectItem>
                      <SelectItem value="active">정상 회원</SelectItem>
                      <SelectItem value="dormant">휴면 회원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 그룹 필터 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">그룹</label>
                  <Select value={filters.group || 'all'} onValueChange={(value) => updateFilter('group', value)}>
                    <SelectTrigger className="bg-background border-border/60 h-10 focus:border-primary focus:ring-1 focus:ring-primary/20">
                      <SelectValue placeholder="그룹 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 그룹</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="instructor">강사</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 마케팅 수신 동의 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">마케팅 수신동의</label>
                  <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                    <SelectTrigger className="bg-background border-border/60 h-10 focus:border-primary focus:ring-1 focus:ring-primary/20">
                      <SelectValue placeholder="수신동의 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="true">수신 동의</SelectItem>
                      <SelectItem value="false">수신 거부</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 가입일 필터 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">가입일 범위</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-background border-border/60 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20">
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
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};