import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Play, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoModal from "./VideoModal";

const SecondBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

  // 유튜브 영상 데이터
  const youtubeVideos = [
    {
      id: "kztEXMiPYzA",
      title: "AI 모델 배포와 운영의 모든 것",
      thumbnail: `https://img.youtube.com/vi/kztEXMiPYzA/maxresdefault.jpg`,
    },
    {
      id: "d3gz_uTNuX0",
      title: "분산 추론을 위한 멀티 머신 GPU 설정",
      thumbnail: `https://img.youtube.com/vi/d3gz_uTNuX0/maxresdefault.jpg`,
    },
    {
      id: "-AojEJLT338",
      title: "유튜브 제목 작성법, 조회수 늘리는 비법",
      thumbnail: `https://img.youtube.com/vi/-AojEJLT338/maxresdefault.jpg`,
    },
    {
      id: "ZKRadvhmrAM",
      title: "딥러닝 모델 최적화 기법",
      thumbnail: `https://img.youtube.com/vi/ZKRadvhmrAM/maxresdefault.jpg`,
    },
    {
      id: "zCscF4-cys0",
      title: "클라우드 인프라 구축 가이드",
      thumbnail: `https://img.youtube.com/vi/zCscF4-cys0/maxresdefault.jpg`,
    },
    {
      id: "lx1deqdvdes",
      title: "실전 MLOps 파이프라인 구축",
      thumbnail: `https://img.youtube.com/vi/lx1deqdvdes/maxresdefault.jpg`,
    },
    {
      id: "Kj1FGAL5ScM",
      title: "컨테이너 기반 서비스 배포",
      thumbnail: `https://img.youtube.com/vi/Kj1FGAL5ScM/maxresdefault.jpg`,
    },
    {
      id: "kewfIAYKuM0",
      title: "마이크로서비스 아키텍처 설계",
      thumbnail: `https://img.youtube.com/vi/kewfIAYKuM0/maxresdefault.jpg`,
    },
    {
      id: "CQL1wlJyr4A",
      title: "데이터 파이프라인 구축하기",
      thumbnail: `https://img.youtube.com/vi/CQL1wlJyr4A/maxresdefault.jpg`,
    },
    {
      id: "7cwMsPDqpBw",
      title: "실시간 데이터 처리 시스템",
      thumbnail: `https://img.youtube.com/vi/7cwMsPDqpBw/maxresdefault.jpg`,
    }
  ];

  const itemsPerPage = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  };

  const getItemsToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return itemsPerPage.desktop;
      if (window.innerWidth >= 768) return itemsPerPage.tablet;
    }
    return itemsPerPage.mobile;
  };

  const totalSlides = Math.ceil(youtubeVideos.length / getItemsToShow());

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleVideoClick = (video: { id: string; title: string }) => {
    setSelectedVideo(video);
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
    <section className="w-full py-16 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-left mb-12">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              상위 1% 셀러들의 판매 전략
            </h2>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">
            윈들리 유튜브를 통해 무료로 확인해보세요!
          </p>
        </div>
        
        {/* 데스크톱 뷰 - 3개씩 그리드 */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="grid grid-cols-3 gap-6 mb-8">
            {youtubeVideos.slice(currentSlide * 3, (currentSlide * 3) + 3).map((video) => (
              <Card 
                key={video.id} 
                className="group cursor-pointer overflow-hidden border-0 bg-background shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Play className="w-4 h-4 text-primary" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* 좌우 네비게이션 버튼 */}
          {Math.ceil(youtubeVideos.length / 3) > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background hover:bg-muted text-foreground rounded-full p-3 transition-colors shadow-lg border z-10"
                disabled={currentSlide === 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background hover:bg-muted text-foreground rounded-full p-3 transition-colors shadow-lg border z-10"
                disabled={currentSlide >= Math.ceil(youtubeVideos.length / 3) - 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* 하단 인디케이터 */}
          {Math.ceil(youtubeVideos.length / 3) > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: Math.ceil(youtubeVideos.length / 3) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    currentSlide === index 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

        {/* 태블릿 뷰 - 2개씩 그리드 */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-2 gap-6 mb-8">
            {youtubeVideos.slice(currentSlide * 2, (currentSlide * 2) + 2).map((video) => (
              <Card 
                key={video.id} 
                className="group cursor-pointer overflow-hidden border-0 bg-background shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Play className="w-4 h-4 text-primary" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* 네비게이션 */}
          {Math.ceil(youtubeVideos.length / 2) > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={prevSlide}
                className="bg-background hover:bg-muted text-foreground rounded-full p-2 transition-colors shadow-sm border"
                disabled={currentSlide === 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-muted-foreground px-4 py-2 text-sm">
                {currentSlide + 1} / {Math.ceil(youtubeVideos.length / 2)}
              </span>
              <button
                onClick={nextSlide}
                className="bg-background hover:bg-muted text-foreground rounded-full p-2 transition-colors shadow-sm border"
                disabled={currentSlide >= Math.ceil(youtubeVideos.length / 2) - 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 모바일 뷰 - 1개씩 캐러셀 */}
        <div className="md:hidden">
          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="w-full flex-shrink-0 px-4">
                    <Card 
                      className="group cursor-pointer overflow-hidden border-0 bg-background shadow-sm hover:shadow-xl transition-all duration-300"
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Play className="w-4 h-4 text-primary" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center mt-6 gap-2">
              {youtubeVideos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    currentSlide === index 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 비디오 모달 */}
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoId={selectedVideo?.id || ""}
          title={selectedVideo?.title || ""}
        />
      </div>
    </section>
  );
};

export default SecondBanner;