import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CourseData {
  id: string;
  title: string;
  thumbnail_path?: string;
  price: number;
  profiles?: {
    full_name?: string;
  };
}

interface CourseOption {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  benefits: string[];
  tag?: string;
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
}

const Payment = () => {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseOption, setCourseOption] = useState<CourseOption | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const [searchParams] = useSearchParams();
  const optionId = searchParams.get('option');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (courseId) {
      fetchCourseData();
      fetchAvailableCoupons();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          thumbnail_path,
          price,
          profiles:instructor_id(full_name)
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourseData(course);

      // Fetch course option if specified
      if (optionId) {
        const { data: option, error: optionError } = await supabase
          .from('course_options')
          .select('*')
          .eq('id', optionId)
          .single();

        if (optionError) throw optionError;
        setCourseOption(option);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "강의 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCoupons = async () => {
    if (!user) return;
    
    try {
      // 현재 날짜보다 유효 기간이 남아있고 활성화된 쿠폰들을 가져옴
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString());

      if (error) throw error;
      setAvailableCoupons(coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const applyCoupon = (couponId: string) => {
    const coupon = availableCoupons.find(c => c.id === couponId);
    if (!coupon) return;

    setSelectedCoupon(coupon);
    setSelectedCouponId(couponId);
    toast({
      title: "쿠폰 적용 완료",
      description: `${coupon.name} 쿠폰이 적용되었습니다.`,
    });
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // 주문 생성
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_amount: totalPrice,
          status: 'completed',
          payment_method: 'card' // 기본값으로 카드 설정
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 주문 아이템 생성
      const { error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          course_id: courseId,
          price: finalPrice
        });

      if (orderItemError) throw orderItemError;

      // 수강 등록
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user?.id,
          course_id: courseId,
          progress: 0
        });
        
      if (enrollmentError) throw enrollmentError;
      
      toast({
        title: "결제 완료",
        description: "강의 결제가 완료되었습니다!",
      });
      
      // 구매 내역 페이지로 이동
      navigate('/purchase-history');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "결제 실패",
        description: "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">결제 정보를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">강의를 찾을 수 없습니다</h1>
            <Button onClick={() => navigate('/courses')}>
              강의 목록으로 돌아가기
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const finalPrice = courseOption ? courseOption.price : courseData.price;
  const originalPrice = courseOption?.original_price || courseData.price;
  
  // 쿠폰 할인 계산
  const couponDiscount = selectedCoupon ? (() => {
    const price = finalPrice;
    if (selectedCoupon.min_order_amount && price < selectedCoupon.min_order_amount) {
      return 0; // 최소 주문 금액 미달
    }
    
    let discount = 0;
    if (selectedCoupon.discount_type === 'percentage') {
      discount = Math.floor(price * (selectedCoupon.discount_value / 100));
    } else {
      discount = selectedCoupon.discount_value;
    }
    
    // 최대 할인 금액 제한
    if (selectedCoupon.max_discount_amount && discount > selectedCoupon.max_discount_amount) {
      discount = selectedCoupon.max_discount_amount;
    }
    
    return discount;
  })() : 0;
  
  const totalPrice = finalPrice - couponDiscount - pointsToUse;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold">주문결제</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info & Payment Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Information */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6 items-center">
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                      alt={courseData.title}
                      className="w-72 h-48 object-contain bg-muted/30 rounded-lg"
                    />
                  </div>
                  
                  {/* Course Details */}
                  <div className="flex-1 space-y-3">
                    {/* Badge */}
                    {courseOption?.tag && (
                      <div className="flex justify-start">
                        <Badge variant="destructive" className="text-xs font-medium">
                          {courseOption.tag}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Course Info */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-xl leading-tight">{courseData.title}</h3>
                      <p className="text-muted-foreground">
                        {courseData.profiles?.full_name || "강사명"}
                      </p>
                      <div className="text-2xl font-bold text-primary">
                        {finalPrice.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount & Coupon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  할인 혜택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">보유 쿠폰</span>
                      <span className="font-medium">{availableCoupons.length}개</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Select value={selectedCouponId} onValueChange={applyCoupon}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="쿠폰을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {availableCoupons.length === 0 ? (
                          <SelectItem value="none" disabled>사용 가능한 쿠폰이 없습니다</SelectItem>
                        ) : (
                          availableCoupons.map((coupon) => (
                            <SelectItem key={coupon.id} value={coupon.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{coupon.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {coupon.discount_type === 'percentage' 
                                    ? `${coupon.discount_value}% 할인` 
                                    : `${coupon.discount_value.toLocaleString()}원 할인`
                                  }
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {selectedCoupon && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-green-800">{selectedCoupon.name}</div>
                          <div className="text-green-600">
                            {couponDiscount.toLocaleString()}원 할인 적용
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points & Credits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  포인트 & 적립금
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 적립금 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">적립금</Label>
                    <span className="text-sm text-muted-foreground">보유: 0원</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="사용할 적립금을 입력하세요" 
                      disabled
                      className="flex-1"
                    />
                    <Button variant="outline" disabled className="px-6">
                      전액사용
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* 포인트 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">포인트</Label>
                    <span className="text-sm text-muted-foreground">보유: 0P</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="사용할 포인트를 입력하세요" 
                      disabled
                      className="flex-1"
                    />
                    <Button variant="outline" disabled className="px-6">
                      전액사용
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * 결제 금액의 50%까지 사용 가능
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  결제 수단
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-3 font-medium border-slate-900"
                  >
                    신용카드 · 체크카드
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 hover:bg-muted/50 flex items-center justify-center gap-3 font-medium"
                  >
                    실시간 계좌이체
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl">
                  주문 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Price Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base">강의 금액</span>
                    <span className="text-lg font-semibold">{finalPrice.toLocaleString()}원</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>쿠폰 할인</span>
                      <span>-{couponDiscount.toLocaleString()}원</span>
                    </div>
                    
                    <div className="flex justify-between text-muted-foreground">
                      <span>적립금 사용</span>
                      <span>-0원</span>
                    </div>
                    
                    <div className="flex justify-between text-muted-foreground">
                      <span>포인트 사용</span>
                      <span>-0원</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Final Amount */}
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">최종 결제금액</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* Payment Button */}
                <Button 
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      결제 처리 중...
                    </span>
                  ) : (
                    "결제하기"
                  )}
                </Button>
                
                {/* Terms */}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  결제 진행 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Payment;