import { useState } from 'react';
import { Search, Filter, RotateCcw, Calendar, Gift, Coins } from 'lucide-react';
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
  marketingEmail: string;
  group?: string;
  joinDateStart?: Date;
  joinDateEnd?: Date;
}

interface UserSearchFilterProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onReset: () => void;
  onCouponDistribution?: () => void;
  onPointsDistribution?: () => void;
}

export const UserSearchFilter = ({
  filters,
  onFiltersChange,
  onReset,
  onCouponDistribution,
  onPointsDistribution
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
    if (filters.marketingEmail !== 'all') count++;
    if (filters.group && filters.group !== 'all') count++;
    if (filters.joinDateStart) count++;
    if (filters.joinDateEnd) count++;
    return count;
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        {/* 메인 검색 영역 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 이메일, 회원ID, 연락처로 검색..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10 h-11 text-base font-medium border-border/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-11 px-4 font-medium"
            >
              <Filter className="h-4 w-4 mr-2" />
              고급 필터
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            
            {onCouponDistribution && (
              <Button
                variant="outline"
                onClick={onCouponDistribution}
                className="h-11 px-4 font-medium"
              >
                <Gift className="h-4 w-4 mr-2" />
                쿠폰 지급
              </Button>
            )}
            
            {onPointsDistribution && (
              <Button
                variant="outline"
                onClick={onPointsDistribution}
                className="h-11 px-4 font-medium"
              >
                <Coins className="h-4 w-4 mr-2" />
                적립금 지급
              </Button>
            )}
            
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                onClick={onReset}
                className="h-11 px-4"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                초기화
              </Button>
            )}
          </div>
        </div>

        {/* 고급 필터 영역 */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t bg-muted/20 -mx-6 px-6 pb-6 rounded-b-lg">
            {/* 회원 상태 */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">회원 상태</label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="bg-background border-border/60 h-10">
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
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">그룹</label>
              <Select value={filters.group || 'all'} onValueChange={(value) => updateFilter('group', value)}>
                <SelectTrigger className="bg-background border-border/60 h-10">
                  <SelectValue placeholder="그룹 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 그룹</SelectItem>
                  <SelectItem value="vip">VIP 고객</SelectItem>
                  <SelectItem value="new">신규 회원</SelectItem>
                  <SelectItem value="inactive">장기 미접속</SelectItem>
                  <SelectItem value="completed">수강 완료자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 마케팅 수신 동의 */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">마케팅 수신동의</label>
              <Select value={filters.marketingEmail} onValueChange={(value) => updateFilter('marketingEmail', value)}>
                <SelectTrigger className="bg-background border-border/60 h-10">
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
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">가입일 범위</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-background border-border/60 h-10">
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
        )}
      </CardContent>
    </Card>
  );
};