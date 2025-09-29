import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PointsDistributionModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
}

interface PointsData {
  amount: number;
  type: 'earned' | 'admin_adjustment';
  description: string;
  expiryType: 'none' | 'date' | 'days';
  expiryDate?: Date;
  expiryDays?: number;
}

const POINT_REASONS = [
  { value: 'welcome_bonus', label: '가입 축하 적립금' },
  { value: 'event_participation', label: '이벤트 참여 보상' },
  { value: 'review_reward', label: '리뷰 작성 보상' },
  { value: 'referral_bonus', label: '추천인 보상' },
  { value: 'compensation', label: '보상금' },
  { value: 'special_event', label: '특별 이벤트' },
  { value: 'admin_adjustment', label: '관리자 수동 지급' },
  { value: 'other', label: '기타' }
];

export function PointsDistributionModal({ open, onClose, selectedUsers }: PointsDistributionModalProps) {
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState<PointsData>({
    amount: 0,
    type: 'earned',
    description: '',
    expiryType: 'none'
  });
  const [selectedReason, setSelectedReason] = useState('');
  const { toast } = useToast();

  const handleDistribute = async () => {
    if (!pointsData.amount || pointsData.amount <= 0) {
      toast({
        title: "금액 입력 필요",
        description: "적립금 금액을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!pointsData.description.trim()) {
      toast({
        title: "설명 입력 필요",
        description: "적립금 지급 사유를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (pointsData.expiryType === 'date' && !pointsData.expiryDate) {
      toast({
        title: "만료일 선택 필요",
        description: "적립금 만료일을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (pointsData.expiryType === 'days' && (!pointsData.expiryDays || pointsData.expiryDays <= 0)) {
      toast({
        title: "만료 기간 입력 필요",
        description: "적립금 만료 기간을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let expiresAt: string | null = null;
      
      if (pointsData.expiryType === 'date' && pointsData.expiryDate) {
        expiresAt = pointsData.expiryDate.toISOString();
      } else if (pointsData.expiryType === 'days' && pointsData.expiryDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pointsData.expiryDays);
        expiresAt = expiry.toISOString();
      }

      const transactions = selectedUsers.map(userId => ({
        user_id: userId,
        amount: pointsData.amount,
        type: pointsData.type,
        description: pointsData.description.trim(),
        expires_at: expiresAt
      }));

      const { error } = await supabase
        .from('points_transactions')
        .insert(transactions);

      if (error) throw error;

      toast({
        title: "적립금 지급 완료",
        description: `${selectedUsers.length}명에게 ${pointsData.amount.toLocaleString()}원의 적립금이 지급되었습니다.`
      });

      // 초기화
      setPointsData({
        amount: 0,
        type: 'earned',
        description: '',
        expiryType: 'none'
      });
      setSelectedReason('');
      onClose();

    } catch (error: any) {
      console.error('Error distributing points:', error);
      toast({
        title: "적립금 지급 실패",
        description: "적립금 지급에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReasonChange = (reason: string) => {
    setSelectedReason(reason);
    const reasonData = POINT_REASONS.find(r => r.value === reason);
    if (reasonData) {
      setPointsData(prev => ({
        ...prev,
        description: reasonData.label,
        type: reason === 'admin_adjustment' ? 'admin_adjustment' : 'earned'
      }));
    }
  };

  const totalAmount = pointsData.amount * selectedUsers.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>적립금 지급</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              선택된 {selectedUsers.length}명의 사용자에게 적립금을 지급합니다.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="amount">지급 금액 (원) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              value={pointsData.amount || ''}
              onChange={(e) => setPointsData(prev => ({ 
                ...prev, 
                amount: parseInt(e.target.value) || 0 
              }))}
              placeholder="지급할 적립금 금액"
            />
          </div>

          <div>
            <Label htmlFor="reason">지급 사유</Label>
            <Select value={selectedReason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="지급 사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {POINT_REASONS.map(reason => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">상세 설명 *</Label>
            <Textarea
              id="description"
              value={pointsData.description}
              onChange={(e) => setPointsData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              placeholder="적립금 지급에 대한 상세 설명"
              rows={3}
            />
          </div>

          <div>
            <Label>만료 설정</Label>
            <Select 
              value={pointsData.expiryType} 
              onValueChange={(value: 'none' | 'date' | 'days') => 
                setPointsData(prev => ({ ...prev, expiryType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">만료 없음</SelectItem>
                <SelectItem value="date">만료일 지정</SelectItem>
                <SelectItem value="days">만료 기간 지정</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pointsData.expiryType === 'date' && (
            <div>
              <Label>만료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pointsData.expiryDate ? (
                      format(pointsData.expiryDate, 'PPP', { locale: ko })
                    ) : (
                      <span>만료일을 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pointsData.expiryDate}
                    onSelect={(date) => setPointsData(prev => ({ 
                      ...prev, 
                      expiryDate: date 
                    }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {pointsData.expiryType === 'days' && (
            <div>
              <Label htmlFor="expiryDays">만료 기간 (일)</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                value={pointsData.expiryDays || ''}
                onChange={(e) => setPointsData(prev => ({ 
                  ...prev, 
                  expiryDays: parseInt(e.target.value) || 0 
                }))}
                placeholder="예: 30 (30일 후 만료)"
              />
            </div>
          )}

          {pointsData.amount > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <div>개별 지급액: {pointsData.amount.toLocaleString()}원</div>
                  <div>총 지급액: {totalAmount.toLocaleString()}원</div>
                  <div>대상자: {selectedUsers.length}명</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleDistribute} 
              disabled={loading || !pointsData.amount || !pointsData.description.trim()}
            >
              {loading ? '지급 중...' : '적립금 지급'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}