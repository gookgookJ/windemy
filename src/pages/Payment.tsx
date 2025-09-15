import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

const Payment = () => {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [courseOption, setCourseOption] = useState<CourseOption | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
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

  const applyCoupon = () => {
    // 쿠폰 적용 로직 (추후 구현)
    toast({
      title: "쿠폰 적용",
      description: "쿠폰 기능은 준비 중입니다.",
    });
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // 여기에 실제 결제 처리 로직이 들어갑니다
      // 현재는 수강 등록만 처리
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user?.id,
          course_id: courseId,
          progress: 0
        });
        
      if (error) throw error;
      
      toast({
        title: "결제 완료",
        description: "강의 결제가 완료되었습니다!",
      });
      
      // 학습 페이지로 이동
      navigate(`/learn/${courseId}`);
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
                <div className="space-y-4">
                  {/* Course Header with Badge */}
                  {courseOption?.tag && (
                    <div className="flex justify-start">
                      <Badge variant="destructive" className="text-xs font-medium">
                        {courseOption.tag}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Course Image and Info */}
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                        alt={courseData.title}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                      />
                    </div>
                    
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
                <CardTitle className="text-lg flex items-center gap-2">
                  🎫 할인 혜택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">쿠폰 적용 가능</span>
                      <span className="font-medium">0개</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="쿠폰 코드를 입력하세요"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-6"
                    >
                      적용
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points & Credits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💎 포인트 & 적립금
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
                <CardTitle className="text-lg flex items-center gap-2">
                  💳 결제 수단
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-16 bg-gradient-to-r from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 flex items-center justify-center gap-3 font-medium text-lg border-0"
                  >
                    💳 신용카드 · 체크카드
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-16 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 flex items-center justify-center gap-3 font-medium text-lg border border-blue-200"
                  >
                    🏦 실시간 계좌이체
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  🧾 주문 요약
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
                      <span>-0원</span>
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
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">최종 결제금액</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* Payment Button */}
                <Button 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      결제 처리 중...
                    </span>
                  ) : (
                    "💳 결제하기"
                  )}
                </Button>
                
                {/* Terms */}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  결제 진행 시 <span className="font-medium">이용약관</span> 및 <span className="font-medium">개인정보처리방침</span>에 동의한 것으로 간주됩니다.
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