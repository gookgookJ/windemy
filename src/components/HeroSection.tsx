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
    <section className="relative h-[480px] overflow-hidden bg-gradient-to-r from-slate-100 to-slate-200">
      {/* Three Panel Layout */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex w-full max-w-7xl mx-auto px-4 items-center justify-center gap-8">
          
          {/* Left Panel (Previous Slide) */}
          <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
               onClick={prevSlide}>
            <div className="relative h-[360px] rounded-2xl overflow-hidden shadow-lg">
              <div className={cn("absolute inset-0 bg-gradient-to-br", slides[getSlideIndex(-1)].bgColor)}>
                <div className="flex items-center h-full p-8">
                  <div className="text-white space-y-4">
                    <h3 className="text-xl font-bold line-clamp-2">
                      {slides[getSlideIndex(-1)].title}
                    </h3>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {slides[getSlideIndex(-1)].subtitle}
                    </p>
                    <p className="text-xs opacity-80 cursor-pointer hover:opacity-100">
                      {slides[getSlideIndex(-1)].description}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <img
                      src={slides[getSlideIndex(-1)].image}
                      alt={slides[getSlideIndex(-1)].title}
                      className="w-32 h-40 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel (Current Slide) */}
          <div className="flex-1 relative z-10">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              <div className={cn("absolute inset-0 bg-gradient-to-br", slides[currentSlide].bgColor)}>
                <div className="flex items-center h-full p-12">
                  <div className="text-white space-y-6 flex-1">
                    <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                      {slides[currentSlide].title}
                    </h2>
                    <h3 className="text-xl lg:text-2xl font-medium opacity-90">
                      {slides[currentSlide].subtitle}
                    </h3>
                    <p className="text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                  <div className="ml-8">
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

          {/* Right Panel (Next Slide) */}
          <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
               onClick={nextSlide}>
            <div className="relative h-[360px] rounded-2xl overflow-hidden shadow-lg">
              <div className={cn("absolute inset-0 bg-gradient-to-br", slides[getSlideIndex(1)].bgColor)}>
                <div className="flex items-center h-full p-8">
                  <div className="text-white space-y-4">
                    <h3 className="text-xl font-bold line-clamp-2">
                      {slides[getSlideIndex(1)].title}
                    </h3>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {slides[getSlideIndex(1)].subtitle}
                    </p>
                    <p className="text-xs opacity-80 cursor-pointer hover:opacity-100">
                      {slides[getSlideIndex(1)].description}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <img
                      src={slides[getSlideIndex(1)].image}
                      alt={slides[getSlideIndex(1)].title}
                      className="w-32 h-40 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Play/Pause Button (Center) */}
      <button
        onClick={togglePlayPause}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
      </button>

      {/* Slide Counter */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 translate-x-8 z-10 bg-black/40 rounded-full px-4 py-2 text-white text-sm font-medium">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 -translate-x-16 z-20 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 translate-x-16 z-20 w-12 h-12 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentSlide ? "bg-black/80" : "bg-black/40"
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;