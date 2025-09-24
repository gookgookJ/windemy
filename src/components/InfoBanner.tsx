import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Mail, TrendingUp, DollarSign, BarChart3, Gift, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import '@/utils/updateBlogPosts'; // 즉시 업데이트 실행

const InfoBanner = () => {
  const [email, setEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [bestPosts, setBestPosts] = useState([
    {
      title: "2025 타오바오 할인코드, 할인쿠폰 사용방법",
      url: "https://windly.cc/blog/2025-taobao-discount-coupon"
    },
    {
      title: "무신사(MUSINSA) 입점 방법ㅣ판매상품, 수수료, 정산 총정리",
      url: "https://windly.cc/blog/musinsa-onboading-guide"
    },
    {
      title: "일본판 아마존닷컴, 메루카리(Mercari) 초보자 직구 가이드ㅣ회원가입부터 실전까지",
      url: "https://windly.cc/blog/mercari-japan-guide"
    },
    {
      title: "'쿠팡 파트너스' 시작 가이드- 가입방법, 정산, 주의사항까지",
      url: "https://windly.cc/blog/kupang-pateuneoseu-sijag-gaideu-gaibbangbeob-jeongsan-juyisahangggaji"
    },
    {
      title: "떠오르는 유통업계 위기론, 사실일까?",
      url: "https://windly.cc/blog/ecommerce-crisis"
    }
  ]);

  // 블로그 포스트 자동 업데이트
  useEffect(() => {
    const updateBlogPosts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('update-blog-posts');
        
        if (data && data.success && data.posts && data.posts.length > 0) {
          setBestPosts(data.posts);
          console.log('블로그 포스트가 업데이트되었습니다:', data.posts);
        }
      } catch (error) {
        console.error('블로그 포스트 업데이트 실패:', error);
      }
    };

    // 컴포넌트 마운트 시 즉시 업데이트
    updateBlogPosts();

    // 24시간마다 자동 업데이트
    const interval = setInterval(updateBlogPosts, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  const handleSubscribe = () => {
    setIsSubscribeModalOpen(true);
  };

  // 캐러셀 슬라이드 데이터 (모바일/태블릿용)
  const carouselSlides = [
    {
      id: 1,
      component: (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full min-h-[320px]">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">최신 이커머스 시장 트렌드</h3>
            </div>
            <div className="space-y-2">
              {bestPosts.map((post, index) => (
                <div key={index} className="group">
                  <a 
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 2,
      component: (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white h-full min-h-[320px]">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-center mb-8">
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-white/90" />
              <div className="space-y-2">
                <div className="text-xl sm:text-2xl font-bold">돈 버는 이커머스 정보</div>
                <div className="text-base sm:text-lg text-white/90">무료로 받아보기</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <Dialog open={isSubscribeModalOpen} onOpenChange={setIsSubscribeModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleSubscribe}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 sm:py-5 text-lg sm:text-xl"
                  >
                    무료 구독하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] sm:max-h-[600px] p-0">
                  <iframe
                    src="https://page.stibee.com/subscriptions/155399"
                    className="w-full h-[500px] sm:h-[600px] border-0 rounded-lg"
                    title="무료 이커머스 정보 구독"
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="mt-6 text-sm sm:text-base text-white/70 text-center leading-relaxed">
              놓치면 후회하는 정보를<br />
              가장 먼저 받아보세요
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // 초기화
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section className="w-full py-10 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 중앙 강조 텍스트 */}
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            보기만해도 매출 상승하는<br className="sm:hidden" /> 이커머스 사업 꿀팁!
          </h2>
        </div>
        
        {/* PC View - 기존 그리드 레이아웃 */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            {/* 왼쪽 - 최신 트렌드 (더 넓게) */}
            <div className="lg:col-span-6">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">최신 이커머스 시장 트렌드</h3>
                  </div>
                  <div className="space-y-2">
                    {bestPosts.map((post, index) => (
                      <div key={index} className="group">
                        <a 
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-foreground/80 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 - 구독하기 */}
            <div className="lg:col-span-4">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white h-full">
                <CardContent className="p-4">
                  <div className="text-center mb-6">
                    <Mail className="h-8 w-8 mx-auto mb-3 text-white/90" />
                    <div className="space-y-1">
                      <div className="text-lg font-bold">돈 버는 이커머스 정보</div>
                      <div className="text-base text-white/90">무료로 받아보기</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Dialog open={isSubscribeModalOpen} onOpenChange={setIsSubscribeModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={handleSubscribe}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-base py-3"
                        >
                          무료 구독하기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] sm:max-h-[600px] p-0">
                        <iframe
                          src="https://bit.ly/3Vxd2Y4"
                          className="w-full h-[500px] sm:h-[600px] border-0 rounded-lg"
                          title="무료 이커머스 정보 구독"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="mt-4 text-sm text-white/70 text-center">
                    놓치면 후회하는 정보를<br />
                    가장 먼저 받아보세요
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View - 캐러셀 */}
        <div className="lg:hidden">
          <div className="relative">
            {/* 캐러셀 컨테이너 */}
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {carouselSlides.map((slide) => (
                  <div key={slide.id} className="w-full flex-shrink-0">
                    {slide.component}
                  </div>
                ))}
              </div>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center mt-4 gap-2">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    currentSlide === index 
                      ? "bg-white w-6" 
                      : "bg-white/50 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoBanner;