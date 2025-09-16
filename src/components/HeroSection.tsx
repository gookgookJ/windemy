import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useHeroCarousel } from "@/hooks/useHeroCarousel";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { heroAnalytics } from "@/utils/analytics";
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
  is_active?: boolean;
}

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Default slides fallback
  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      image_url: heroSlide1,
      title: "실시간 강의 50개 완전 무료",
      subtitle: "지금 가장 주목받는 강의",
      description: "실시간 줌코딩 50개 강의 무료 >",
      order_index: 1,
      is_active: true,
    },
    {
      id: '2',
      image_url: heroSlide2,
      title: "신혼부부가 1억으로",
      subtitle: "서울에서 내집마련하는 법",
      description: "실시간 줌코딩 50개 강의 무료 >",
      order_index: 2,
      is_active: true,
    },
    {
      id: '3',
      image_url: heroSlide3,
      title: "집 사기 전 꼭 알아야 할 A to Z",
      subtitle: "나나쌤의 내집마련 기초편",
      description: "추천인이 내집마련하는 법 알려드립니다 →",
      order_index: 3,
      is_active: true,
    }
  ];

  // Carousel logic
  const carousel = useHeroCarousel({ 
    slides, 
    autoplayInterval: 5000,
    transitionDuration: 400 
  });

  // Handle slide click/activation
  const handleSlideActivation = (slide: HeroSlide, method: 'click' | 'keyboard' = 'click') => {
    // Analytics
    heroAnalytics.ctaClick(
      carousel.currentSlide, 
      slide.id, 
      slide.title, 
      method
    );

    // Navigation
    if (slide.course_id) {
      navigate(`/course/${slide.course_id}`);
    } else if (slide.link_url) {
      window.open(slide.link_url, '_blank');
    }
  };

  // Keyboard navigation
  const { containerRef, focusContainer } = useKeyboardNavigation({
    onPrevious: () => carousel.prevSlide('keyboard'),
    onNext: () => carousel.nextSlide('keyboard'),
    onActivate: () => {
      const currentSlide = slides[carousel.currentSlide];
      if (currentSlide) {
        handleSlideActivation(currentSlide, 'keyboard');
      }
    },
  });

  // Fetch slides from database
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

  if (loading || slides.length === 0) {
    return (
      <section 
        className="relative h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center"
        aria-label="Hero carousel loading"
      >
        <div className="text-muted-foreground">로딩중...</div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative h-[280px] md:h-[340px] lg:h-[380px] overflow-hidden bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      role="region"
      aria-label="Main hero carousel"
      aria-live="polite"
      tabIndex={0}
      onMouseEnter={carousel.pauseAutoplay}
      onMouseLeave={carousel.resumeAutoplay}
      data-ga="hero_section"
    >
      {/* Desktop & Tablet Layout (≥768px) */}
      <div className="hidden md:block relative w-full h-full">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Viewport Container */}
          <div 
            className="relative w-full h-full overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
            onMouseDown={carousel.onMouseDown}
            onMouseMove={carousel.onMouseMove}
            onMouseUp={carousel.onMouseUp}
            onMouseLeave={carousel.onMouseLeave}
            onTouchStart={carousel.onTouchStart}
            onTouchMove={carousel.onTouchMove}
            onTouchEnd={carousel.onTouchEnd}
          >
            {/* Sliding Strip */}
            <div 
              className="flex items-center justify-center"
              style={{
                transform: `translateX(${-(carousel.currentSlide * 800) + carousel.dragOffset}px)`,
                transition: carousel.isDragging ? 'none' : 'transform 400ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                width: `${slides.length * 800}px`,
              }}
            >
              {/* Render slides in infinite loop pattern */}
              {[...slides, ...slides, ...slides].map((slide, globalIndex) => {
                const slideIndex = globalIndex % slides.length;
                const viewPosition = globalIndex - (carousel.currentSlide + slides.length);
                const isCenter = viewPosition === 0;
                const isAdjacent = Math.abs(viewPosition) === 1;
                const isVisible = Math.abs(viewPosition) <= 1;

                if (!isVisible) return null;

                return (
                  <div
                    key={`${Math.floor(globalIndex / slides.length)}-${slide.id}`}
                    className="relative flex-shrink-0 mx-2 lg:mx-5"
                    style={{
                      width: isCenter ? '760px' : '600px',
                      height: isCenter ? '340px' : '280px',
                    }}
                  >
                    <div 
                      className={cn(
                        "relative w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-400",
                        isCenter ? "opacity-100 scale-104 shadow-xl" : "opacity-50 scale-95 hover:opacity-70"
                      )}
                      onClick={() => handleSlideActivation(slide)}
                      data-ga={`hero_slide_${slideIndex}`}
                      data-slide-id={slide.id}
                    >
                      {/* Lazy loaded image */}
                      <img
                        src={slide.image_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        loading={isCenter ? "eager" : "lazy"}
                        sizes={isCenter ? "760px" : "600px"}
                      />
                      
                      {/* Content overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                        <div className="text-white space-y-2 lg:space-y-4 p-6 lg:p-12 w-full">
                          <h2 className={cn(
                            "font-bold leading-tight drop-shadow-lg",
                            isCenter ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"
                          )}>
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <h3 className={cn(
                              "font-medium opacity-90 drop-shadow-lg",
                              isCenter ? "text-lg lg:text-xl" : "text-base lg:text-lg"
                            )}>
                              {slide.subtitle}
                            </h3>
                          )}
                          {slide.description && (
                            <p className={cn(
                              "opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg",
                              isCenter ? "text-sm lg:text-base" : "text-xs lg:text-sm"
                            )}>
                              {slide.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="relative w-[760px]">
            <div className="absolute bottom-4 right-8 flex items-center gap-3">
              {/* Previous Button */}
              <button
                onClick={() => carousel.prevSlide('click')}
                className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                aria-label="Previous slide"
                data-ga="hero_nav_prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Play/Pause Button */}
              <button
                onClick={carousel.toggleAutoplay}
                className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                aria-label={carousel.isPlaying ? "Pause slideshow" : "Play slideshow"}
                data-ga="hero_autoplay_toggle"
              >
                {carousel.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              
              {/* Slide Counter */}
              <div className="bg-black/50 rounded-full px-3 py-1.5 text-white text-sm font-medium">
                {carousel.currentSlide + 1} / {slides.length}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => carousel.nextSlide('click')}
                className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                aria-label="Next slide"
                data-ga="hero_nav_next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout (<768px) */}
      <div className="block md:hidden relative w-full h-full">
        <div 
          className="relative w-full h-full overflow-hidden select-none"
          onTouchStart={carousel.onTouchStart}
          onTouchMove={carousel.onTouchMove}
          onTouchEnd={carousel.onTouchEnd}
        >
          {/* Single slide view */}
          <div 
            className="flex h-full"
            style={{
              transform: `translateX(${-carousel.currentSlide * 100 + (carousel.dragOffset / window.innerWidth) * 100}%)`,
              transition: carousel.isDragging ? 'none' : 'transform 400ms cubic-bezier(0.22, 0.61, 0.36, 1)',
              width: `${slides.length * 100}%`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="relative flex-shrink-0 w-full h-full"
                onClick={() => handleSlideActivation(slide)}
                data-ga={`hero_slide_mobile_${index}`}
                data-slide-id={slide.id}
              >
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  loading={index === carousel.currentSlide ? "eager" : "lazy"}
                />
                
                {/* Mobile content overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                  <div className="text-white space-y-2 p-4 w-full">
                    <h2 className="text-xl font-bold leading-tight drop-shadow-lg">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <h3 className="text-base font-medium opacity-90 drop-shadow-lg">
                        {slide.subtitle}
                      </h3>
                    )}
                    {slide.description && (
                      <p className="text-sm opacity-80 drop-shadow-lg">
                        {slide.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Dots Navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => carousel.goToSlide(index, 'click')}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50",
                index === carousel.currentSlide 
                  ? "bg-white scale-125" 
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
              data-ga={`hero_dot_${index}`}
            />
          ))}
        </div>
      </div>

      {/* Screen reader announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Slide {carousel.currentSlide + 1} of {slides.length}: {slides[carousel.currentSlide]?.title}
      </div>
    </section>
  );
};

export default HeroSection;