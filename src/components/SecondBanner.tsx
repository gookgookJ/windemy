import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Star, Award, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const SecondBanner = () => {
  const [email, setEmail] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleSubscribe = () => {
    if (email) {
      // TODO: 실제 구독 로직 구현
      console.log('구독:', email);
      setEmail('');
    }
  };

  const achievements = [
    {
      title: "1,000+ 성공 사례",
      description: "검증된 강의로 실제 성과를 거둔 수강생들"
    },
    {
      title: "98% 만족도",
      description: "수강생이 직접 평가한 높은 강의 퀄리티"
    },
    {
      title: "전문 강사진",
      description: "현업 전문가들의 실무 경험 공유"
    },
    {
      title: "24/7 지원",
      description: "언제든지 받을 수 있는 학습 지원"
    }
  ];

  // 캐러셀 슬라이드 데이터 (모바일/태블릿용)
  const carouselSlides = [
    {
      id: 1,
      component: (
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full min-h-[320px]">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">우리의 성과</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-primary mb-1">
                    {achievement.title}
                  </div>
                  <div className="text-xs text-foreground/70">
                    {achievement.description}
                  </div>
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
        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-xl text-white h-full min-h-[320px]">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="text-center mb-6">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 text-white/90" />
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold">프리미엄 강의 알림</div>
                <div className="text-xs sm:text-sm text-white/90">새로운 강의를 가장 먼저</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="이메일 주소 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60"
              />
              <Button 
                onClick={handleSubscribe}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base"
              >
                알림 받기
              </Button>
            </div>
            
            <div className="mt-4 text-xs sm:text-sm text-white/70 text-center">
              새로운 강의와 특별 할인<br />
              소식을 놓치지 마세요
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
    setTouchEnd(0);
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
    <section className="w-full py-10 bg-gradient-to-br from-indigo-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 중앙 강조 텍스트 */}
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            검증된 전문가와 함께하는<br className="sm:hidden" /> 온라인 학습 경험!
          </h2>
        </div>
        
        {/* PC View - 기존 그리드 레이아웃 */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            {/* 왼쪽 - 성과 및 통계 (더 넓게) */}
            <div className="lg:col-span-6">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-full">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">우리의 성과</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="text-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="text-xl font-bold text-primary mb-2">
                          {achievement.title}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {achievement.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 - 구독하기 */}
            <div className="lg:col-span-4">
              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-xl text-white h-full">
                <CardContent className="p-4">
                  <div className="text-center mb-3">
                    <Star className="h-7 w-7 mx-auto mb-2 text-white/90" />
                    <div className="space-y-1">
                      <div className="text-sm font-bold">프리미엄 강의 알림</div>
                      <div className="text-xs text-white/90">새로운 강의를 가장 먼저</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="이메일 주소 입력"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 text-sm"
                    />
                    <Button 
                      onClick={handleSubscribe}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm py-2"
                    >
                      알림 받기
                    </Button>
                  </div>
                  
                  <div className="mt-2 text-xs text-white/70 text-center">
                    새로운 강의와 특별 할인<br />
                    소식을 놓치지 마세요
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

export default SecondBanner;