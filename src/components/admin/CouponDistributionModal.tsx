import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Gift, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface CouponDistributionModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
}

interface ExistingCoupon {
  id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: Date;
  usageLimit: number;
}

export const CouponDistributionModal = ({ open, onClose, selectedUsers }: CouponDistributionModalProps) => {
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [newCouponData, setNewCouponData] = useState({
    name: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    validUntil: null as Date | null,
    usageLimit: '',
    description: ''
  });

  // Mock existing coupons - 실제로는 API에서 가져올 데이터
  const existingCoupons: ExistingCoupon[] = [
    {
      id: '1',
      name: '신규회원 10% 할인',
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      validUntil: new Date('2024-12-31'),
      usageLimit: 1
    },
    {
      id: '2',
      name: '5000원 할인쿠폰',
      code: 'SAVE5000',
      discountType: 'fixed',
      discountValue: 5000,
      validUntil: new Date('2024-06-30'),
      usageLimit: 1
    }
  ];

  const handleDistributeExisting = () => {
    if (!selectedCoupon) {
      toast({
        title: "쿠폰을 선택해주세요",
        variant: "destructive"
      });
      return;
    }

    // 기존 쿠폰 지급 로직
    toast({
      title: "쿠폰이 지급되었습니다",
      description: `${selectedUsers.length}명에게 쿠폰을 지급했습니다.`
    });
    onClose();
  };

  const handleCreateAndDistribute = () => {
    if (!newCouponData.name || !newCouponData.code || !newCouponData.discountValue) {
      toast({
        title: "필수 정보를 입력해주세요",
        variant: "destructive"
      });
      return;
    }

    // 새 쿠폰 생성 및 지급 로직
    toast({
      title: "쿠폰이 생성되고 지급되었습니다",
      description: `${selectedUsers.length}명에게 새 쿠폰을 지급했습니다.`
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            쿠폰 지급 ({selectedUsers.length}명)
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">기존 쿠폰 지급</TabsTrigger>
            <TabsTrigger value="new">새 쿠폰 생성</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-3">
              <Label>지급할 쿠폰 선택</Label>
              <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                <SelectTrigger>
                  <SelectValue placeholder="쿠폰을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {existingCoupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{coupon.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {coupon.code} | {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`} 할인
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCoupon && (
                <div className="p-3 bg-muted rounded-lg">
                  {(() => {
                    const coupon = existingCoupons.find(c => c.id === selectedCoupon);
                    if (!coupon) return null;
                    return (
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">쿠폰명:</span> {coupon.name}</div>
                        <div><span className="font-medium">코드:</span> {coupon.code}</div>
                        <div>
                          <span className="font-medium">할인:</span> 
                          {coupon.discountType === 'percentage' ? ` ${coupon.discountValue}%` : ` ${coupon.discountValue.toLocaleString()}원`}
                        </div>
                        <div><span className="font-medium">유효기간:</span> {format(coupon.validUntil, 'yyyy-MM-dd')}</div>
                        <div><span className="font-medium">사용 제한:</span> {coupon.usageLimit}회</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                취소
              </Button>
              <Button onClick={handleDistributeExisting} className="flex-1">
                쿠폰 지급
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>쿠폰명 *</Label>
                <Input
                  value={newCouponData.name}
                  onChange={(e) => setNewCouponData({ ...newCouponData, name: e.target.value })}
                  placeholder="예: VIP 고객 특별 할인"
                />
              </div>
              <div className="space-y-2">
                <Label>쿠폰 코드 *</Label>
                <Input
                  value={newCouponData.code}
                  onChange={(e) => setNewCouponData({ ...newCouponData, code: e.target.value.toUpperCase() })}
                  placeholder="예: VIP2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>할인 유형 *</Label>
                <Select 
                  value={newCouponData.discountType} 
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setNewCouponData({ ...newCouponData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">퍼센트 할인</SelectItem>
                    <SelectItem value="fixed">고정 금액 할인</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  할인 값 * {newCouponData.discountType === 'percentage' ? '(%)' : '(원)'}
                </Label>
                <Input
                  type="number"
                  value={newCouponData.discountValue}
                  onChange={(e) => setNewCouponData({ ...newCouponData, discountValue: e.target.value })}
                  placeholder={newCouponData.discountType === 'percentage' ? '10' : '5000'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유효기간</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newCouponData.validUntil && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCouponData.validUntil ? format(newCouponData.validUntil, 'yyyy-MM-dd') : '날짜 선택'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCouponData.validUntil}
                      onSelect={(date) => setNewCouponData({ ...newCouponData, validUntil: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>사용 제한 횟수</Label>
                <Input
                  type="number"
                  value={newCouponData.usageLimit}
                  onChange={(e) => setNewCouponData({ ...newCouponData, usageLimit: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>쿠폰 설명</Label>
              <Textarea
                value={newCouponData.description}
                onChange={(e) => setNewCouponData({ ...newCouponData, description: e.target.value })}
                placeholder="쿠폰에 대한 상세 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                취소
              </Button>
              <Button onClick={handleCreateAndDistribute} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                생성 후 지급
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};