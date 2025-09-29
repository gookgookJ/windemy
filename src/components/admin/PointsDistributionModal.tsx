import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coins, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PointsDistributionModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
}

export const PointsDistributionModal = ({ open, onClose, selectedUsers }: PointsDistributionModalProps) => {
  const [pointsData, setPointsData] = useState({
    amount: '',
    reason: '',
    description: '',
    expiryDate: null as Date | null,
    expiryType: 'never' as 'never' | 'date' | 'days',
    expiryDays: ''
  });

  const handleDistribute = () => {
    if (!pointsData.amount || !pointsData.reason) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "적립금과 지급 사유를 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(pointsData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "올바른 금액을 입력해주세요",
        variant: "destructive"
      });
      return;
    }

    if (pointsData.expiryType === 'date' && !pointsData.expiryDate) {
      toast({
        title: "유효기간을 설정해주세요",
        variant: "destructive"
      });
      return;
    }

    if (pointsData.expiryType === 'days' && (!pointsData.expiryDays || parseInt(pointsData.expiryDays) <= 0)) {
      toast({
        title: "올바른 유효기간을 입력해주세요",
        variant: "destructive"
      });
      return;
    }

    // 적립금 지급 로직
    toast({
      title: "적립금이 지급되었습니다",
      description: `${selectedUsers.length}명에게 ${amount.toLocaleString()}원의 적립금을 지급했습니다.`
    });
    onClose();
  };

  const totalAmount = pointsData.amount ? parseInt(pointsData.amount) * selectedUsers.length : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            적립금 지급 ({selectedUsers.length}명)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>지급 금액 (원) *</Label>
            <Input
              type="number"
              value={pointsData.amount}
              onChange={(e) => setPointsData({ ...pointsData, amount: e.target.value })}
              placeholder="10000"
            />
            {pointsData.amount && (
              <p className="text-sm text-muted-foreground">
                총 지급 금액: {totalAmount.toLocaleString()}원
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>지급 사유 *</Label>
            <Select 
              value={pointsData.reason} 
              onValueChange={(value) => setPointsData({ ...pointsData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="지급 사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">이벤트 참여</SelectItem>
                <SelectItem value="compensation">서비스 보상</SelectItem>
                <SelectItem value="loyalty">고객 감사</SelectItem>
                <SelectItem value="promotion">프로모션</SelectItem>
                <SelectItem value="refund">환불 대신 적립</SelectItem>
                <SelectItem value="custom">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>상세 설명</Label>
            <Textarea
              value={pointsData.description}
              onChange={(e) => setPointsData({ ...pointsData, description: e.target.value })}
              placeholder="적립금 지급에 대한 상세 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>유효기간 설정</Label>
            <Select 
              value={pointsData.expiryType} 
              onValueChange={(value: 'never' | 'date' | 'days') => 
                setPointsData({ ...pointsData, expiryType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">무제한</SelectItem>
                <SelectItem value="date">특정 날짜까지</SelectItem>
                <SelectItem value="days">지급일로부터 N일</SelectItem>
              </SelectContent>
            </Select>

            {pointsData.expiryType === 'date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !pointsData.expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pointsData.expiryDate ? format(pointsData.expiryDate, 'yyyy-MM-dd') : '만료일 선택'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pointsData.expiryDate}
                    onSelect={(date) => setPointsData({ ...pointsData, expiryDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => date <= new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}

            {pointsData.expiryType === 'days' && (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={pointsData.expiryDays}
                  onChange={(e) => setPointsData({ ...pointsData, expiryDays: e.target.value })}
                  placeholder="30"
                />
                <p className="text-sm text-muted-foreground">
                  지급일로부터 {pointsData.expiryDays || '0'}일 후 만료
                </p>
              </div>
            )}
          </div>

          {totalAmount > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                총 {totalAmount.toLocaleString()}원의 적립금이 {selectedUsers.length}명에게 지급됩니다.
                {pointsData.expiryType === 'date' && pointsData.expiryDate && 
                  ` (${format(pointsData.expiryDate, 'yyyy-MM-dd')}까지 유효)`
                }
                {pointsData.expiryType === 'days' && pointsData.expiryDays && 
                  ` (${pointsData.expiryDays}일간 유효)`
                }
                {pointsData.expiryType === 'never' && ' (무제한 유효)'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={handleDistribute} className="flex-1">
            적립금 지급
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};