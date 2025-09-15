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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Course Info & Payment Options */}
          <div className="space-y-6">
            {/* Course Information */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  {courseOption?.tag && (
                    <Badge variant="destructive" className="text-xs">
                      {courseOption.tag}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={courseData.thumbnail_path || '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png'}
                    alt={courseData.title}
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{courseData.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {courseData.profiles?.full_name || "강사명"}
                    </p>
                    <div className="text-lg font-bold text-primary">
                      {finalPrice.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">쿠폰</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="사용 가능한 쿠폰이 없어요"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={applyCoupon}
                    disabled={!couponCode.trim()}
                  >
                    쿠폰 적용
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Points & Credits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">상품권 · 포인트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 상품권 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="radio" id="gift-card" name="points" className="rounded" />
                    <Label htmlFor="gift-card">상품권</Label>
                    <span className="text-sm text-muted-foreground ml-auto">사용 가능 0</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="0" 
                      disabled
                      className="flex-1"
                    />
                    <Button variant="outline" disabled>전액 사용</Button>
                  </div>
                </div>

                {/* 포인트 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="radio" id="points" name="points" className="rounded" />
                    <Label htmlFor="points">포인트</Label>
                    <span className="text-sm text-muted-foreground ml-auto">사용 가능 0</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="0" 
                      disabled
                      className="flex-1"
                    />
                    <Button variant="outline" disabled>전액 사용</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">* 실 결제 금액의 50%까지 사용 가능</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">결제 수단</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-12 bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    💳 신용 · 체크 카드
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex items-center justify-center gap-2"
                  >
                    💬 카카오페이
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex items-center justify-center gap-2"
                  >
                    📱 토스페이
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex items-center justify-center gap-2"
                  >
                    🔵 최재영 아이엠
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button 
                    variant="outline" 
                    className="h-12 flex items-center justify-center gap-2"
                  >
                    📱 토스페이
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex items-center justify-center gap-2 text-blue-600"
                  >
                    🏪 최재영아이엠 <span className="text-xs">1%적립액!</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">결제 금액</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>총 클래스 금액</span>
                    <span>{finalPrice.toLocaleString()}원</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>쿠폰 사용</span>
                    <span>0원</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>상품권 사용</span>
                    <span>0원</span>
                  </div>
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>포인트 사용</span>
                    <span>0원</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>총 결제 금액</span>
                  <span className="text-primary">{totalPrice.toLocaleString()}원</span>
                </div>
                
                <Button 
                  className="w-full h-12 text-lg font-semibold"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? "결제 처리 중..." : "결제하기"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  결제 및 결제 정보를 확인했으며, 소상공법 및 민원대장의 동의합니다.
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