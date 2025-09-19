import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Play, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
      title: "",
      thumbnail: `https://img.youtube.com/vi/kztEXMiPYzA/maxresdefault.jpg`,
    },
    {
      id: "d3gz_uTNuX0",
      title: "",
      thumbnail: `https://img.youtube.com/vi/d3gz_uTNuX0/maxresdefault.jpg`,
    },
    {
      id: "-AojEJLT338",
      title: "",
      thumbnail: `https://img.youtube.com/vi/-AojEJLT338/maxresdefault.jpg`,
    },
    {
      id: "ZKRadvhmrAM",
      title: "",
      thumbnail: `https://img.youtube.com/vi/ZKRadvhmrAM/maxresdefault.jpg`,
    },
    {
      id: "zCscF4-cys0",
      title: "",
      thumbnail: `https://img.youtube.com/vi/zCscF4-cys0/maxresdefault.jpg`,
    },
    {
      id: "lx1deqdvdes",
      title: "",
      thumbnail: `https://img.youtube.com/vi/lx1deqdvdes/maxresdefault.jpg`,
    },
    {
      id: "Kj1FGAL5ScM",
      title: "",
      thumbnail: `https://img.youtube.com/vi/Kj1FGAL5ScM/maxresdefault.jpg`,
    },
    {
      id: "kewfIAYKuM0",
      title: "",
      thumbnail: `https://img.youtube.com/vi/kewfIAYKuM0/maxresdefault.jpg`,
    },
    {
      id: "CQL1wlJyr4A",
      title: "",
      thumbnail: `https://img.youtube.com/vi/CQL1wlJyr4A/maxresdefault.jpg`,
    },
    {
      id: "7cwMsPDqpBw",
      title: "",
      thumbnail: `https://img.youtube.com/vi/7cwMsPDqpBw/maxresdefault.jpg`,
    }
  ];

  const getItemsToShow = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3.5;
      if (window.innerWidth >= 768) return 2.5;
    }
    return 1.5;
  };

  const nextSlide = () => {
    const itemsToShow = getItemsToShow();
    const maxSlide = Math.max(0, youtubeVideos.length - itemsToShow);
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handleVideoClick = (video: { id: string; title: string }) => {
    setSelectedVideo(video);
  };

  // 터치/마우스 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setTouchEnd(0);
    if ('touches' in e) {
      setTouchStart(e.touches[0].clientX);
    } else {
      setTouchStart(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      setTouchEnd(e.touches[0].clientX);
    } else {
      setTouchEnd(e.clientX);
    }
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
      {/* 헤더 - 다른 섹션과 정렬 맞춤 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div className="text-left flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              상위 1% 셀러의 판매법
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              윈들리 유튜브에서 지금 확인해보세요!
            </p>
          </div>
          <Button
            asChild
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-full flex items-center gap-1 sm:gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base whitespace-nowrap"
          >
            <a 
              href="https://www.youtube.com/@windly/videos" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-2"
            >
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">구독</span>
              <span className="xs:hidden">구독</span>
            </a>
          </Button>
        </div>
      </div>

      {/* 비디오 컨텐츠 - 전체 width 사용 */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* 데스크톱 뷰 - 3.5개씩 */}
        <div className="hidden lg:block">
          <div className="relative max-w-7xl mx-auto">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentSlide * (100 / 3.5)}%)` }}
              >
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="flex-none w-[calc(100%/3.5-18px)] mr-6">
                    <Card 
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
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 좌우 네비게이션 버튼 */}
            {youtubeVideos.length > 3.5 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute -left-6 top-[45%] -translate-y-1/2 bg-background hover:bg-muted text-foreground rounded-full p-3 transition-colors shadow-lg border z-10"
                  disabled={currentSlide === 0}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-6 top-[45%] -translate-y-1/2 bg-background hover:bg-muted text-foreground rounded-full p-3 transition-colors shadow-lg border z-10"
                  disabled={currentSlide >= youtubeVideos.length - 3.5}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 태블릿 뷰 - 2.5개씩 */}
        <div className="hidden md:block lg:hidden">
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                style={{ transform: `translateX(-${currentSlide * (100 / 2.5)}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="flex-none w-[calc(100%/2.5-16px)] mr-6">
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
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: Math.max(1, Math.ceil(youtubeVideos.length - 2.5 + 1)) }).map((_, index) => (
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

        {/* 모바일 뷰 - 1.5개씩 */}
        <div className="md:hidden">
          <div className="relative max-w-sm mx-auto">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                style={{ transform: `translateX(-${currentSlide * (100 / 1.5)}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {youtubeVideos.map((video) => (
                  <div key={video.id} className="flex-none w-[calc(100%/1.5-16px)] mr-4">
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
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: Math.max(1, Math.ceil(youtubeVideos.length - 1.5 + 1)) }).map((_, index) => (
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
      </div>

      {/* 비디오 모달 */}
      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoId={selectedVideo?.id || ""}
        title={selectedVideo?.title || ""}
      />
    </section>
  );
};

export default SecondBanner;