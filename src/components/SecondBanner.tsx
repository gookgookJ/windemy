import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const SecondBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // 유튜브 영상 데이터
  const youtubeVideos = [
    {
      id: "kztEXMiPYzA",
      title: "윈들리 채널 영상 1",
      thumbnail: `https://img.youtube.com/vi/kztEXMiPYzA/maxresdefault.jpg`,
      url: "https://youtu.be/kztEXMiPYzA"
    },
    {
      id: "d3gz_uTNuX0",
      title: "윈들리 채널 영상 2",
      thumbnail: `https://img.youtube.com/vi/d3gz_uTNuX0/maxresdefault.jpg`,
      url: "https://youtu.be/d3gz_uTNuX0"
    },
    {
      id: "-AojEJLT338",
      title: "윈들리 채널 영상 3",
      thumbnail: `https://img.youtube.com/vi/-AojEJLT338/maxresdefault.jpg`,
      url: "https://youtu.be/-AojEJLT338"
    },
    {
      id: "ZKRadvhmrAM",
      title: "윈들리 채널 영상 4",
      thumbnail: `https://img.youtube.com/vi/ZKRadvhmrAM/maxresdefault.jpg`,
      url: "https://youtu.be/ZKRadvhmrAM"
    },
    {
      id: "zCscF4-cys0",
      title: "윈들리 채널 영상 5",
      thumbnail: `https://img.youtube.com/vi/zCscF4-cys0/maxresdefault.jpg`,
      url: "https://youtu.be/zCscF4-cys0"
    },
    {
      id: "lx1deqdvdes",
      title: "윈들리 채널 영상 6",
      thumbnail: `https://img.youtube.com/vi/lx1deqdvdes/maxresdefault.jpg`,
      url: "https://youtu.be/lx1deqdvdes"
    },
    {
      id: "Kj1FGAL5ScM",
      title: "윈들리 채널 영상 7",
      thumbnail: `https://img.youtube.com/vi/Kj1FGAL5ScM/maxresdefault.jpg`,
      url: "https://youtu.be/Kj1FGAL5ScM"
    },
    {
      id: "kewfIAYKuM0",
      title: "윈들리 채널 영상 8",
      thumbnail: `https://img.youtube.com/vi/kewfIAYKuM0/maxresdefault.jpg`,
      url: "https://youtu.be/kewfIAYKuM0"
    },
    {
      id: "CQL1wlJyr4A",
      title: "윈들리 채널 영상 9",
      thumbnail: `https://img.youtube.com/vi/CQL1wlJyr4A/maxresdefault.jpg`,
      url: "https://youtu.be/CQL1wlJyr4A"
    },
    {
      id: "7cwMsPDqpBw",
      title: "윈들리 채널 영상 10",
      thumbnail: `https://img.youtube.com/vi/7cwMsPDqpBw/maxresdefault.jpg`,
      url: "https://youtu.be/7cwMsPDqpBw"
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

  const getCurrentVideos = () => {
    const itemsToShow = getItemsToShow();
    const startIndex = currentSlide * itemsToShow;
    return youtubeVideos.slice(startIndex, startIndex + itemsToShow);
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
        <div className="text-center mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            윈들리 유튜브 채널<br className="sm:hidden" /> 최신 영상들
          </h2>
          <p className="text-white/80 text-sm sm:text-base">
            전문가들의 유용한 인사이트를 만나보세요
          </p>
        </div>
        
        {/* 데스크톱 뷰 - 4개씩 그리드 */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {getCurrentVideos().map((video, index) => (
                <Card key={video.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-6 h-6 text-primary" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <a 
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      유튜브에서 보기
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 네비게이션 버튼 */}
            {totalSlides > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={prevSlide}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white/80 px-4 py-2 text-sm">
                  {currentSlide + 1} / {totalSlides}
                </span>
                <button
                  onClick={nextSlide}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 태블릿 뷰 - 2개씩 그리드 */}
        <div className="hidden md:block lg:hidden">
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {getCurrentVideos().map((video, index) => (
                <Card key={video.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-6 h-6 text-primary" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <a 
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      유튜브에서 보기
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 네비게이션 버튼 */}
            {totalSlides > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={prevSlide}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white/80 px-4 py-2 text-sm">
                  {currentSlide + 1} / {totalSlides}
                </span>
                <button
                  onClick={nextSlide}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
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
                  <div key={video.id} className="w-full flex-shrink-0">
                    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden mx-2">
                      <div className="relative aspect-video">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3">
                            <Play className="w-6 h-6 text-primary" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <a 
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          유튜브에서 보기
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center mt-4 gap-2">
              {youtubeVideos.map((_, index) => (
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