import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const slides = [
    {
      image: heroSlide1,
      title: "실시간 강의 50개 완전 무료",
      subtitle: "지금 가장 주목받는 강의",
      description: "실시간 줌코딩 50개 강의 무료 >",
      bgColor: "from-pink-400 to-red-400"
    },
    {
      image: heroSlide2,
      title: "신혼부부가 1억으로",
      subtitle: "서울에서 내집마련하는 법",
      description: "실시간 줌코딩 50개 강의 무료 >",
      bgColor: "from-pink-300 to-pink-500"
    },
    {
      image: heroSlide3,
      title: "집 사기 전 꼭 알아야 할 A to Z",
      subtitle: "나나쌤의 내집마련 기초편",
      description: "추천인이 내집마련하는 법 알려드립니다 →",
      bgColor: "from-green-400 to-blue-500"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getSlideIndex = (offset: number) => {
    return (currentSlide + offset + slides.length) % slides.length;
  };

  return (
    <section className="relative h-[380px] overflow-hidden bg-white">
      {/* Three Panel Layout */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex w-full items-center justify-center">
          
          {/* Left Panel (Previous Slide) - Partially visible */}
          <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-r-2xl"
               onClick={prevSlide}
               style={{ height: '340px' }}>
            <div className="absolute -right-20 top-0 w-[760px] h-[340px] rounded-2xl overflow-hidden shadow-lg">
              <div className={cn("absolute inset-0 bg-gradient-to-br rounded-2xl", slides[getSlideIndex(-1)].bgColor)}>
                <div className="flex items-center h-full">
                  <div className="text-white space-y-4 px-12 flex-1">
                    <h3 className="text-2xl font-bold">
                      {slides[getSlideIndex(-1)].title}
                    </h3>
                    <p className="text-lg opacity-90">
                      {slides[getSlideIndex(-1)].subtitle}
                    </p>
                    <p className="text-sm opacity-80 cursor-pointer hover:opacity-100">
                      {slides[getSlideIndex(-1)].description}
                    </p>
                  </div>
                  <div className="pr-12">
                    <img
                      src={slides[getSlideIndex(-1)].image}
                      alt={slides[getSlideIndex(-1)].title}
                      className="w-48 h-60 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel (Current Slide) - Full visible */}
          <div className="relative z-10 mx-4">
            <div className="relative w-[760px] h-[340px] rounded-2xl overflow-hidden">
              <div className={cn("absolute inset-0 bg-gradient-to-br", slides[currentSlide].bgColor)}>
                <div className="flex items-center h-full">
                  <div className="text-white space-y-4 px-12 flex-1">
                    <h2 className="text-3xl font-bold leading-tight">
                      {slides[currentSlide].title}
                    </h2>
                    <h3 className="text-xl font-medium opacity-90">
                      {slides[currentSlide].subtitle}
                    </h3>
                    <p className="text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                  <div className="pr-12">
                    <img
                      src={slides[currentSlide].image}
                      alt={slides[currentSlide].title}
                      className="w-48 h-60 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Next Slide) - Partially visible */}
          <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-l-2xl"
               onClick={nextSlide}
               style={{ height: '340px' }}>
            <div className="absolute -left-20 top-0 w-[760px] h-[340px] rounded-2xl overflow-hidden shadow-lg">
              <div className={cn("absolute inset-0 bg-gradient-to-br rounded-2xl", slides[getSlideIndex(1)].bgColor)}>
                <div className="flex items-center h-full">
                  <div className="text-white space-y-4 px-12 flex-1">
                    <h3 className="text-2xl font-bold">
                      {slides[getSlideIndex(1)].title}
                    </h3>
                    <p className="text-lg opacity-90">
                      {slides[getSlideIndex(1)].subtitle}
                    </p>
                    <p className="text-sm opacity-80 cursor-pointer hover:opacity-100">
                      {slides[getSlideIndex(1)].description}
                    </p>
                  </div>
                  <div className="pr-12">
                    <img
                      src={slides[getSlideIndex(1)].image}
                      alt={slides[getSlideIndex(1)].title}
                      className="w-48 h-60 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons positioned at center panel bottom right */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="relative w-[760px]">
          <div className="absolute bottom-4 right-8 flex items-center gap-3">
            
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            
            {/* Slide Counter */}
            <div className="bg-black/50 rounded-full px-3 py-1.5 text-white text-sm font-medium">
              {currentSlide + 1} / {slides.length}
            </div>
            
            <button
              onClick={nextSlide}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;