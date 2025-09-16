import { useEffect, useRef, useState } from "react";
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
  const [translateX, setTranslateX] = useState(0);
  const [stride, setStride] = useState(800);
  const [isAnimating, setIsAnimating] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
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

  // 슬라이드 이동 거리 계산 (중앙 카드 폭 + 좌우 마진)
  useEffect(() => {
    const calcStride = () => {
      const width = centerRef.current?.offsetWidth ?? 760; // mx-4 포함을 위해 +32
      setStride(width + 32);
    };
    calcStride();
    window.addEventListener('resize', calcStride);
    return () => window.removeEventListener('resize', calcStride);
  }, []);

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
      if (!isAnimating) {
        setDirection('next');
        nextSlide();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPlaying, isAnimating, stride]);

  const nextSlide = () => {
    setDirection('next');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Drag / Swipe handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    setIsPlaying(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    setDragOffset(e.clientX - dragStartX.current);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    setIsPlaying(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    setDragOffset(e.touches[0].clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (!isDragging) return;
    const delta = dragOffset;
    setIsDragging(false);
    setDragOffset(0);
    setIsPlaying(true);
    dragStartX.current = null;
    const threshold = 100;
    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((p) => !p);
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
      {/* Carousel Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Viewport - shows 3 panels worth */}
        <div className="relative w-full h-[340px] overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
             onMouseDown={onMouseDown}
             onMouseMove={onMouseMove}
             onMouseUp={endDrag}
             onMouseLeave={endDrag}
             onTouchStart={onTouchStart}
             onTouchMove={onTouchMove}
             onTouchEnd={endDrag}
        >
          {/* Sliding Strip - infinite loop */}
          <div 
            className="flex"
            style={{
              transform: `translateX(${-(currentSlide + slides.length) * 800 + dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              width: `${slides.length * 3 * 800}px`
            }}
          >
            {/* Triple the slides for infinite effect: prev + current + next */}
            {[...slides, ...slides, ...slides].map((slide, globalIndex) => {
              const slideIndex = globalIndex % slides.length;
              const setIndex = Math.floor(globalIndex / slides.length); // 0=prev, 1=current, 2=next
              
              // Calculate if this slide should be visible (center, left, or right of current view)
              const viewPosition = globalIndex - (currentSlide + slides.length);
              const isCenter = viewPosition === 0;
              const isLeftSide = viewPosition === -1;
              const isRightSide = viewPosition === 1;
              const isVisible = isCenter || isLeftSide || isRightSide;
              
              return (
                <div
                  key={`${setIndex}-${slide.id}`}
                  className="relative flex-shrink-0 w-[760px] h-[340px] mx-5"
                >
                  <div 
                    className={`relative w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-opacity duration-700 ${
                      isCenter ? 'opacity-100' : 'opacity-40'
                    }`}
                    onClick={() => handleSlideClick(slide)}
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center">
                      <div className="text-white space-y-4 px-12 flex-1">
                        <h2 className={`font-bold leading-tight drop-shadow-lg ${
                          isCenter ? 'text-3xl' : 'text-2xl'
                        }`}>
                          {slide.title}
                        </h2>
                        <h3 className={`font-medium opacity-90 drop-shadow-lg ${
                          isCenter ? 'text-xl' : 'text-lg'
                        }`}>
                          {slide.subtitle}
                        </h3>
                        <p className={`opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg ${
                          isCenter ? 'text-base' : 'text-sm'
                        }`}>
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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