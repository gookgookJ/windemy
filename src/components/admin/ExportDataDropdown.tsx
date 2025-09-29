import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, X, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportField {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface ExportDataDropdownProps {
  selectedUsers: string[];
  onClose: () => void;
  onExport: (selectedFields: string[], selectedUsers: string[]) => void;
  triggerElement?: HTMLElement | null;
}

export function ExportDataDropdown({ 
  selectedUsers, 
  onClose, 
  onExport,
  triggerElement 
}: ExportDataDropdownProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tier1 필드들 (기본 선택)
  const tier1Fields: ExportField[] = [
    { key: 'full_name', label: '전체 이름', description: '사용자 식별 기본 정보', category: 'basic' },
    { key: 'email', label: '이메일', description: '연락 및 식별 정보', category: 'basic' },
    { key: 'phone', label: '연락처', description: '연락 정보', category: 'basic' },
    { key: 'role', label: '역할', description: '수강생/강사/관리자 구분', category: 'basic' },
    { key: 'created_at', label: '가입일', description: '가입 시점', category: 'basic' },
    { key: 'marketing_consent', label: '마케팅 수신동의', description: '법적 준수 필수 정보', category: 'basic' },
    { key: 'total_payment', label: '누적 결제 금액', description: '총 지불 금액', category: 'payment' },
    { key: 'latest_order_date', label: '최근 주문일', description: '최근 활동성 지표', category: 'payment' },
    { key: 'active_courses_count', label: '수강 중인 강의 수', description: '현재 수강 강의 개수', category: 'learning' },
    { key: 'group_name', label: '그룹명', description: '기수, 기업 등 그룹 관리', category: 'group' },
    { key: 'latest_admin_note', label: '최근 관리자 메모', description: 'VIP, 블랙리스트 등 특이사항', category: 'note' }
  ];

  // Tier2 필드들 (선택 옵션)
  const tier2Fields: ExportField[] = [
    { key: 'course_list', label: '수강 강의 목록', description: '전체 수강 강의 리스트', category: 'learning' },
    { key: 'enrollment_details', label: '수강 상세 정보', description: '시작일, 진도율, 완료일', category: 'learning' },
    { key: 'order_history', label: '주문 내역', description: '결제 관련 상세 내역', category: 'payment' },
    { key: 'points_balance', label: '현재 보유 포인트', description: '포인트 잔액', category: 'points' },
    { key: 'points_history', label: '포인트 변동 내역', description: '포인트 획득/사용 내역', category: 'points' },
    { key: 'coupon_usage', label: '쿠폰 사용 내역', description: '쿠폰 지급/사용 현황', category: 'coupon' },
    { key: 'recent_activity', label: '최근 활동', description: '로그인, 강의 시청 등', category: 'activity' },
    { key: 'ip_address', label: 'IP 주소', description: '부정 사용 방지', category: 'activity' },
    { key: 'support_history', label: '문의 내역', description: '고객 지원 이력', category: 'support' }
  ];

  useEffect(() => {
    // 위치 계산
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }

    // Tier1 필드들을 기본 선택
    setSelectedFields(tier1Fields.map(field => field.key));

    // 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [triggerElement]);

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldKey]);
    } else {
      setSelectedFields(selectedFields.filter(key => key !== fieldKey));
    }
  };

  const handleSelectAllTier1 = (checked: boolean) => {
    const tier1Keys = tier1Fields.map(field => field.key);
    if (checked) {
      const newFields = [...new Set([...selectedFields, ...tier1Keys])];
      setSelectedFields(newFields);
    } else {
      setSelectedFields(selectedFields.filter(key => !tier1Keys.includes(key)));
    }
  };

  const handleSelectAllTier2 = (checked: boolean) => {
    const tier2Keys = tier2Fields.map(field => field.key);
    if (checked) {
      const newFields = [...new Set([...selectedFields, ...tier2Keys])];
      setSelectedFields(newFields);
    } else {
      setSelectedFields(selectedFields.filter(key => !tier2Keys.includes(key)));
    }
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "필드 선택 필요",
        description: "내보낼 데이터 필드를 최소 1개 이상 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    onExport(selectedFields, selectedUsers);
    onClose();
  };

  const tier1SelectedCount = tier1Fields.filter(field => selectedFields.includes(field.key)).length;
  const tier2SelectedCount = tier2Fields.filter(field => selectedFields.includes(field.key)).length;

  return (
    <div 
      ref={dropdownRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg"
      style={{ 
        top: position.top + 5, 
        left: Math.max(10, position.left - 200),
        width: '800px', // 가로로 넓게
        maxHeight: '600px'
      }}
    >
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">데이터 내보내기</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 선택된 사용자 수 */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm">
            {selectedUsers.length}명의 데이터 내보내기
          </Badge>
        </div>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Tier 1: 필수 데이터 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">Tier 1</span>
                  필수 데이터 (기본 선택)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  사용자 식별 및 기본 비즈니스 지표
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tier1SelectedCount}/{tier1Fields.length}개 선택
                </span>
                <Checkbox
                  checked={tier1SelectedCount === tier1Fields.length}
                  onCheckedChange={handleSelectAllTier1}
                />
                <span className="text-sm font-medium">전체 선택</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tier1Fields.map((field) => (
                <div key={field.key} className="flex items-start space-x-3 p-3 border border-border/50 rounded-md bg-primary/5">
                  <Checkbox
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground">{field.label}</div>
                    <div className="text-xs text-muted-foreground">{field.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2: 운영/CS 데이터 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-bold">Tier 2</span>
                  운영/CS 데이터 (선택 옵션)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  문제 해결 및 상세 관리용 정보
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tier2SelectedCount}/{tier2Fields.length}개 선택
                </span>
                <Checkbox
                  checked={tier2SelectedCount === tier2Fields.length}
                  onCheckedChange={handleSelectAllTier2}
                />
                <span className="text-sm font-medium">전체 선택</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {tier2Fields.map((field) => (
                <div key={field.key} className="flex items-start space-x-3 p-3 border border-border/50 rounded-md hover:bg-accent/50 transition-colors">
                  <Checkbox
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground">{field.label}</div>
                    <div className="text-xs text-muted-foreground">{field.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            총 {selectedFields.length}개 필드 선택됨
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9"
            >
              취소
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0}
              className="h-9"
            >
              <Download className="w-4 h-4 mr-2" />
              데이터 추출하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}