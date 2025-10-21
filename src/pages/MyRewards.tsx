import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Coins, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface UserCoupon {
  id: string;
  is_used: boolean;
  used_at: string | null;
  assigned_at: string;
  coupons: Coupon;
}

interface PointsTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  expires_at: string | null;
}

const MyRewards = () => {
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchRewardsData();
  }, [user, navigate]);

  const fetchRewardsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('user_coupons')
        .select(`
          id,
          is_used,
          used_at,
          assigned_at,
          coupons (
            id,
            code,
            name,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount_amount,
            valid_from,
            valid_until,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false });

      if (couponsError) throw couponsError;
      setUserCoupons(couponsData || []);

      // Fetch points balance
      const { data: pointsData, error: pointsError } = await supabase
        .rpc('get_user_points_balance', { p_user_id: user.id });

      if (pointsError) throw pointsError;
      setPointsBalance(pointsData || 0);

      // Fetch points transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setPointsTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeUserCoupons = () => {
    const now = new Date();
    const available: UserCoupon[] = [];
    const used: UserCoupon[] = [];
    const expired: UserCoupon[] = [];

    userCoupons.forEach((uc) => {
      const coupon = uc.coupons;
      const validUntil = new Date(coupon.valid_until);
      const validFrom = new Date(coupon.valid_from);

      if (uc.is_used) {
        used.push(uc);
      } else if (validUntil < now || !coupon.is_active || validFrom > now) {
        expired.push(uc);
      } else {
        available.push(uc);
      }
    });

    return { available, used, expired };
  };

  const renderCouponCard = (userCoupon: UserCoupon, status: 'available' | 'used' | 'expired') => {
    const coupon = userCoupon.coupons;
    const discountText = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% 할인`
      : `${coupon.discount_value.toLocaleString()}원 할인`;

    return (
      <Card key={userCoupon.id} className={`relative overflow-hidden ${status !== 'available' ? 'opacity-60' : ''}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base md:text-lg">{coupon.name}</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-2">{discountText}</p>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">쿠폰 코드: {coupon.code}</p>
              {coupon.min_order_amount && (
                <p className="text-xs text-muted-foreground">
                  최소 주문금액: {coupon.min_order_amount.toLocaleString()}원
                </p>
              )}
              {coupon.max_discount_amount && (
                <p className="text-xs text-muted-foreground">
                  최대 할인금액: {coupon.max_discount_amount.toLocaleString()}원
                </p>
              )}
            </div>
            <Badge 
              variant={status === 'available' ? 'default' : status === 'used' ? 'secondary' : 'destructive'}
              className="shrink-0"
            >
              {status === 'available' ? '사용가능' : status === 'used' ? '사용완료' : '만료됨'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(coupon.valid_from), 'yyyy.MM.dd', { locale: ko })} ~ {format(new Date(coupon.valid_until), 'yyyy.MM.dd', { locale: ko })}
            </span>
          </div>
          {status === 'used' && userCoupon.used_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3" />
              <span>사용일: {format(new Date(userCoupon.used_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  const { available, used, expired } = categorizeUserCoupons();

  return (
    <div className="bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 hidden lg:block">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">쿠폰 & 포인트</h1>
                <p className="text-muted-foreground">보유 중인 쿠폰과 포인트를 관리하세요</p>
              </div>

              {/* Points Summary Card */}
              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center">
                        <Coins className="h-6 w-6 md:h-8 md:h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">보유 포인트</p>
                        <p className="text-3xl md:text-4xl font-bold">{pointsBalance.toLocaleString()}P</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Coupons and Points */}
              <Tabs defaultValue="coupons" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="coupons" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    <span>쿠폰</span>
                    <Badge variant="secondary" className="ml-1">{available.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="points" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <span>포인트 내역</span>
                  </TabsTrigger>
                </TabsList>

                {/* Coupons Tab */}
                <TabsContent value="coupons" className="space-y-6 mt-6">
                  {/* Available Coupons */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      사용 가능 쿠폰 ({available.length}개)
                    </h3>
                    {available.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">사용 가능한 쿠폰이 없습니다</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {available.map((uc) => renderCouponCard(uc, 'available'))}
                      </div>
                    )}
                  </div>

                  {/* Used Coupons */}
                  {used.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        사용 완료 쿠폰 ({used.length}개)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {used.map((uc) => renderCouponCard(uc, 'used'))}
                      </div>
                    </div>
                  )}

                  {/* Expired Coupons */}
                  {expired.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        만료된 쿠폰 ({expired.length}개)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {expired.map((uc) => renderCouponCard(uc, 'expired'))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Points Tab */}
                <TabsContent value="points" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        포인트 사용 내역
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pointsTransactions.length === 0 ? (
                        <div className="text-center py-8">
                          <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">포인트 거래 내역이 없습니다</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pointsTransactions.map((transaction) => (
                            <div 
                              key={transaction.id} 
                              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm md:text-base">{transaction.description}</p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(transaction.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                  </p>
                                  {transaction.expires_at && (
                                    <Badge variant="outline" className="text-xs w-fit">
                                      만료: {format(new Date(transaction.expires_at), 'yyyy.MM.dd', { locale: ko })}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className={`text-right ml-4 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <p className="font-bold text-base md:text-lg">
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}P
                                </p>
                                <Badge variant={transaction.type === 'earn' ? 'default' : 'secondary'} className="text-xs mt-1">
                                  {transaction.type === 'earn' ? '적립' : transaction.type === 'use' ? '사용' : transaction.type === 'admin_grant' ? '지급' : transaction.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyRewards;
