import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  link_url?: string;
  order_index: number;
}

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 기본 슬라이드 (데이터베이스에서 불러오지 못할 경우 사용)
  const defaultSlides = [
    {
      id: '1',
      image_url: heroSlide1,
      title: "실시간 강의 50개 완전 무료",
      subtitle: "지금 가장 주목받는 강의",
      description: "실시간 줌코딩 50개 강의 무료 >",
      order_index: 1
    },
    {
      id: '2',
      image_url: heroSlide2,
      title: "신혼부부가 1억으로",
      subtitle: "서울에서 내집마련하는 법",
      description: "실시간 줌코딩 50개 강의 무료 >",
      order_index: 2
    },
    {
      id: '3',
      image_url: heroSlide3,
      title: "집 사기 전 꼭 알아야 할 A to Z",
      subtitle: "나나쌤의 내집마련 기초편",
      description: "추천인이 내집마련하는 법 알려드립니다 →",
      order_index: 3
    }
  ];

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching slides:', error);
        setSlides(defaultSlides);
      } else if (data && data.length > 0) {
        setSlides(data);
      } else {
        setSlides(defaultSlides);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides(defaultSlides);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.course_id) {
      navigate(`/course/${slide.course_id}`);
    } else if (slide.link_url) {
      window.open(slide.link_url, '_blank');
    }
  };

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    
    const timer = setInterval(() => {
      setDirection('next');
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPlaying]);

  const nextSlide = () => {
    setDirection('next');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getSlideIndex = (offset: number) => {
    return (currentSlide + offset + slides.length) % slides.length;
  };

  if (loading || slides.length === 0) {
    return (
      <section className="relative h-[380px] overflow-hidden bg-white flex items-center justify-center">
        <div className="text-muted-foreground">로딩중...</div>
      </section>
    );
  }

  return (
    <section className="relative h-[380px] overflow-hidden bg-white">
      {/* Three Panel Layout */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div key={currentSlide} className={`flex w-full items-center justify-center transition-all duration-1000 ease-out transform ${direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
          
          {/* Left Panel (Previous Slide) - Partially visible */}  
          <div className="flex-1 relative opacity-40 transition-all duration-1000 ease-out cursor-pointer overflow-hidden"
               onClick={prevSlide}
               style={{ height: '340px' }}>
            <div className="absolute -right-[200px] top-0 w-[760px] h-[340px] rounded-l-2xl overflow-hidden transform transition-all duration-1000 ease-out">
              <div className="relative w-full h-full">
                <img
                  src={slides[getSlideIndex(-1)].image_url}
                  alt={slides[getSlideIndex(-1)].title}
                  className="w-full h-full object-cover transition-all duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center">
                  <div className="text-white space-y-4 px-12 flex-1">
                    <h3 className="text-2xl font-bold drop-shadow-lg">
                      {slides[getSlideIndex(-1)].title}
                    </h3>
                    <p className="text-lg opacity-90 drop-shadow-lg">
                      {slides[getSlideIndex(-1)].subtitle}
                    </p>
                    <p className="text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg">
                      {slides[getSlideIndex(-1)].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel (Current Slide) - Full visible */}
          <div className="relative z-10 mx-4 transform transition-all duration-1000 ease-out">
            <div 
              className="relative w-[760px] h-[340px] rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => handleSlideClick(slides[currentSlide])}
            >
              <img
                src={slides[currentSlide].image_url}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center">
                <div className="text-white space-y-4 px-12 flex-1">
                  <h2 className="text-3xl font-bold leading-tight drop-shadow-lg">
                    {slides[currentSlide].title}
                  </h2>
                  <h3 className="text-xl font-medium opacity-90 drop-shadow-lg">
                    {slides[currentSlide].subtitle}
                  </h3>
                  <p className="text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg">
                    {slides[currentSlide].description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Next Slide) - Partially visible */}
          <div className="flex-1 relative opacity-40 transition-all duration-1000 ease-out cursor-pointer overflow-hidden"
               onClick={nextSlide}
               style={{ height: '340px' }}>
            <div className="absolute -left-[200px] top-0 w-[760px] h-[340px] rounded-r-2xl overflow-hidden transform transition-all duration-1000 ease-out">
              <div className="relative w-full h-full">
                <img
                  src={slides[getSlideIndex(1)].image_url}
                  alt={slides[getSlideIndex(1)].title}
                  className="w-full h-full object-cover transition-all duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center">
                  <div className="text-white space-y-4 px-12 flex-1">
                    <h3 className="text-2xl font-bold drop-shadow-lg">
                      {slides[getSlideIndex(1)].title}
                    </h3>
                    <p className="text-lg opacity-90 drop-shadow-lg">
                      {slides[getSlideIndex(1)].subtitle}
                    </p>
                    <p className="text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg">
                      {slides[getSlideIndex(1)].description}
                    </p>
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
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            
            {/* Slide Counter */}
            <div className="bg-black/50 rounded-full px-3 py-1.5 text-white text-sm font-medium transition-all duration-300">
              {currentSlide + 1} / {slides.length}
            </div>
            
            <button
              onClick={nextSlide}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300"
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