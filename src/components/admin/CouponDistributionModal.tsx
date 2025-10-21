import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CouponDistributionModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
}

interface ExistingCoupon {
  id: string;
  name: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_until: string;
  valid_from: string;
  is_active: boolean;
  min_order_amount?: number;
  max_discount_amount?: number;
}

export const CouponDistributionModal = ({ open, onClose, selectedUsers }: CouponDistributionModalProps) => {
  const { user } = useAuth();
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [existingCoupons, setExistingCoupons] = useState<ExistingCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCouponData, setNewCouponData] = useState({
    name: '',
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    validUntil: null as Date | null,
    validFrom: new Date() as Date,
    usageLimit: '',
    description: '',
    minOrderAmount: '',
    maxDiscountAmount: ''
  });

  // Fetch existing active coupons
  useEffect(() => {
    if (open) {
      fetchExistingCoupons();
    }
  }, [open]);

  const fetchExistingCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingCoupons((data || []) as ExistingCoupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "쿠폰 목록 조회 실패",
        description: "쿠폰 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDistributeExisting = async () => {
    if (!selectedCoupon) {
      toast({
        title: "쿠폰을 선택해주세요",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // user_coupons 테이블에 쿠폰 할당 데이터 삽입
      const userCouponInserts = selectedUsers.map(userId => ({
        user_id: userId,
        coupon_id: selectedCoupon,
        assigned_by: user.id,
        is_used: false
      }));

      const { error } = await supabase
        .from('user_coupons')
        .insert(userCouponInserts);

      if (error) throw error;

      toast({
        title: "쿠폰이 지급되었습니다",
        description: `${selectedUsers.length}명에게 쿠폰을 지급했습니다.`
      });
      onClose();
    } catch (error) {
      console.error('Error distributing coupon:', error);
      toast({
        title: "쿠폰 지급 실패",
        description: "쿠폰 지급 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndDistribute = async () => {
    if (!newCouponData.name || !newCouponData.code || !newCouponData.discountValue || !newCouponData.validUntil) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "쿠폰명, 코드, 할인 값, 유효기간은 필수입니다.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. 새 쿠폰 생성
      const { data: newCoupon, error: couponError } = await supabase
        .from('coupons')
        .insert({
          name: newCouponData.name,
          code: newCouponData.code,
          discount_type: newCouponData.discountType,
          discount_value: parseFloat(newCouponData.discountValue),
          valid_from: newCouponData.validFrom.toISOString(),
          valid_until: newCouponData.validUntil.toISOString(),
          usage_limit: newCouponData.usageLimit ? parseInt(newCouponData.usageLimit) : null,
          min_order_amount: newCouponData.minOrderAmount ? parseFloat(newCouponData.minOrderAmount) : null,
          max_discount_amount: newCouponData.maxDiscountAmount ? parseFloat(newCouponData.maxDiscountAmount) : null,
          description: newCouponData.description || null,
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (couponError) throw couponError;

      // 2. 생성된 쿠폰을 사용자들에게 할당
      const userCouponInserts = selectedUsers.map(userId => ({
        user_id: userId,
        coupon_id: newCoupon.id,
        assigned_by: user.id,
        is_used: false
      }));

      const { error: assignError } = await supabase
        .from('user_coupons')
        .insert(userCouponInserts);

      if (assignError) throw assignError;

      toast({
        title: "쿠폰이 생성되고 지급되었습니다",
        description: `${selectedUsers.length}명에게 새 쿠폰을 지급했습니다.`
      });
      
      // Reset form
      setNewCouponData({
        name: '',
        code: '',
        discountType: 'percentage',
        discountValue: '',
        validUntil: null,
        validFrom: new Date(),
        usageLimit: '',
        description: '',
        minOrderAmount: '',
        maxDiscountAmount: ''
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error creating and distributing coupon:', error);
      toast({
        title: "쿠폰 생성 실패",
        description: error.message || "쿠폰 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
                  {existingCoupons.length === 0 ? (
                    <SelectItem value="none" disabled>사용 가능한 쿠폰이 없습니다</SelectItem>
                  ) : (
                    existingCoupons.map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{coupon.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {coupon.code} | {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()}원`} 할인
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
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
                          {coupon.discount_type === 'percentage' ? ` ${coupon.discount_value}%` : ` ${coupon.discount_value.toLocaleString()}원`}
                        </div>
                        <div><span className="font-medium">유효기간:</span> {format(new Date(coupon.valid_from), 'yyyy-MM-dd')} ~ {format(new Date(coupon.valid_until), 'yyyy-MM-dd')}</div>
                        {coupon.min_order_amount && (
                          <div><span className="font-medium">최소 주문금액:</span> {coupon.min_order_amount.toLocaleString()}원</div>
                        )}
                        {coupon.max_discount_amount && (
                          <div><span className="font-medium">최대 할인금액:</span> {coupon.max_discount_amount.toLocaleString()}원</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                취소
              </Button>
              <Button onClick={handleDistributeExisting} className="flex-1" disabled={loading || !selectedCoupon}>
                {loading ? '지급 중...' : '쿠폰 지급'}
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
                <Label>유효기간 *</Label>
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
                      selected={newCouponData.validUntil || undefined}
                      onSelect={(date) => setNewCouponData({ ...newCouponData, validUntil: date || null })}
                      disabled={(date) => date < new Date()}
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
                  placeholder="제한없음"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>최소 주문금액 (원)</Label>
                <Input
                  type="number"
                  value={newCouponData.minOrderAmount}
                  onChange={(e) => setNewCouponData({ ...newCouponData, minOrderAmount: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>최대 할인금액 (원)</Label>
                <Input
                  type="number"
                  value={newCouponData.maxDiscountAmount}
                  onChange={(e) => setNewCouponData({ ...newCouponData, maxDiscountAmount: e.target.value })}
                  placeholder="제한없음"
                  min="0"
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
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                취소
              </Button>
              <Button onClick={handleCreateAndDistribute} className="flex-1" disabled={loading}>
                {loading ? '처리 중...' : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    생성 후 지급
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};