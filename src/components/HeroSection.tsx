import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageForContext } from "@/utils/imageOptimization";
import type { HeroSlide } from "@/hooks/queries/useHomepageData";

interface HeroSectionProps {
  heroSlides?: HeroSlide[];
}

const GAP_PX_DESKTOP = 16;
const AUTOPLAY_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;
const MOBILE_BREAKPOINT = 640; // Tailwind 'sm' breakpoint

const HeroSection = ({ heroSlides = [] }: HeroSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const [gap, setGap] = useState(GAP_PX_DESKTOP);

  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsTranslate, setControlsTranslate] = useState(0);

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const navigate = useNavigate();

  // heroSlides를 slides로 설정
  const slides = heroSlides;

  // ----- LCP 프리로드 -----
  useEffect(() => {
    if (!slides.length) return;
    const href = getOptimizedImageForContext(slides[0].image_url, "hero-slide");
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.fetchPriority = "high";
    if (slides[0].image_url.includes("supabase.co")) link.crossOrigin = "anonymous";
    document.head.appendChild(link);

    const img = new Image();
    img.src = href;

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, [slides]);

  const hasSlides = slides.length > 0;
  const extendedSlides = hasSlides ? [...slides, ...slides, ...slides] : [];

  const getCardWidth = useCallback(() => {
    return firstCardRef.current ? firstCardRef.current.clientWidth + gap : 0;
  }, [gap]);

  const updateControlsPosition = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) return;
    const cardEl = firstCardRef.current;
    const groupEl = controlsRef.current;
    if (!cardEl || !groupEl) return;
    setControlsTranslate(cardEl.clientWidth / 2 - groupEl.clientWidth - 16);
  }, []);

  // ----- 초기 세팅 및 리사이즈 핸들러 통합 -----
  useEffect(() => {
    if (!hasSlides) return;

    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setGap(isMobile ? 0 : GAP_PX_DESKTOP);
      
      setIsTransitioning(false);
      const newTrackIndex = slides.length + activeIndexRef.current;
      setTrackIndex(newTrackIndex);
      updateControlsPosition();
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    };
    
    const setup = () => {
        handleResize();
    };

    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slides.length, hasSlides, updateControlsPosition]);

  // ----- 오토플레이 -----
  useEffect(() => {
    if (!isPlaying || !hasSlides || isDragging) return;
    const autoplay = setInterval(() => {
      setTrackIndex(prev => prev + 1);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(autoplay);
  }, [isPlaying, hasSlides, isDragging]);

  const goToSlide = useCallback((index: number) => {
    setTrackIndex(slides.length + index);
  }, [slides.length]);

  const next = useCallback(() => setTrackIndex(prev => prev + 1), []);
  const prev = useCallback(() => setTrackIndex(prev => prev - 1), []);
  const togglePlay = useCallback(() => setIsPlaying(v => !v), []);

  const handleSlideClick = useCallback((slide: HeroSlide, index: number) => {
    const originalIndex = index % slides.length;
    if (originalIndex !== activeIndex) {
      goToSlide(originalIndex);
      return;
    }
    if (slide.course_id) navigate(`/course/${slide.course_id}`);
    else if (slide.link_url) window.open(slide.link_url, "_blank");
  }, [activeIndex, slides.length, navigate, goToSlide]);
  
  const calculateTranslateX = useCallback(() => {
    if (!trackRef.current) return 0;
    const cardWidth = getCardWidth();
    const wrapWidth = trackRef.current.parentElement?.clientWidth ?? 0;
    const baseOffset = gap === 0 ? 0 : (wrapWidth / 2) - ((cardWidth - gap) / 2);
    return -trackIndex * cardWidth + baseOffset;
  }, [trackIndex, getCardWidth, gap]);

  const onDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
    setIsTransitioning(false);
  }, []);

  const onDragMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current) return;
    currentX.current = clientX;
    const dragOffset = clientX - startX.current;
    const newTranslateX = calculateTranslateX() + dragOffset;
    trackRef.current.style.transform = `translate3d(${newTranslateX}px, 0, 0)`;
  }, [isDragging, calculateTranslateX]);

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsTransitioning(true);
    const dx = startX.current - currentX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) next();
      else prev();
    } else {
        if(trackRef.current) {
            trackRef.current.style.transform = `translate3d(${calculateTranslateX()}px, 0, 0)`;
        }
    }
  }, [isDragging, next, prev, calculateTranslateX]);

  const onTransitionEnd = useCallback(() => {
    if (!hasSlides) return;
    const n = slides.length;
    
    if (trackIndex < n || trackIndex >= 2 * n) {
      const newTrackIndex = (trackIndex % n) + n;
      setIsTransitioning(false);
      setTrackIndex(newTrackIndex);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    }
  }, [trackIndex, slides.length, hasSlides]);

  useEffect(() => {
    if (hasSlides) {
      const newActiveIndex = (trackIndex % slides.length + slides.length) % slides.length;
      setActiveIndex(newActiveIndex);
    }
  }, [trackIndex, slides.length, hasSlides]);

  if (!hasSlides) return null;

  return (
    <section className="relative w-full bg-white sm:py-4 overflow-hidden select-none">
      <div
        ref={trackRef}
        className="flex"
        style={{
          transform: `translate3d(${calculateTranslateX()}px, 0, 0)`,
          transition: isTransitioning ? "transform 500ms ease-out" : "none",
          gap: `${gap}px`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {extendedSlides.map((s, i) => {
          const originalIndex = i % slides.length;
          const isActive = originalIndex === activeIndex;

          return (
            <div
              key={`${s.id}-${i}`}
              ref={i === 0 ? firstCardRef : undefined}
              // ✨ 모바일 뷰에서 h-[55vw] 대신 aspect-[2/1]을 사용하여 이미지 비율 유지
              className={`relative shrink-0 overflow-hidden transition-opacity duration-300
                          w-full rounded-none aspect-[2/1]
                          sm:aspect-auto sm:h-[220px] sm:w-[420px] sm:rounded-lg
                          md:h-[280px] md:w-[560px]
                          lg:h-[340px] lg:w-[760px]
                          ${isActive ? "opacity-100" : "opacity-50 cursor-pointer"}`}
              onClick={() => handleSlideClick(s, i)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              onMouseDown={(e) => onDragStart(e.clientX)}
              onMouseMove={(e) => onDragMove(e.clientX)}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
            >
              <img
                alt={s.title}
                src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                className="absolute inset-0 h-full w-full object-cover"
                loading={i < 3 ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : "auto"}
                decoding="async"
                draggable="false"
              />
              <div className="absolute bottom-8 left-4 sm:bottom-12 sm:left-6 md:bottom-16 md:left-8 lg:bottom-20 lg:left-12 z-[3] w-[calc(100%-32px)] sm:w-[calc(100%-48px)] md:w-[calc(100%-64px)] lg:w-[calc(100%-96px)] space-y-1 sm:space-y-2 md:space-y-3">
                <h2 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold drop-shadow-lg leading-tight">
                  {s.title}
                </h2>
                {s.subtitle && (
                  <h3 className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl drop-shadow leading-snug">
                    {s.subtitle}
                  </h3>
                )}
              </div>
              
              {isActive && (
                <div className="absolute bottom-4 right-4 z-[4] rounded-full bg-black/60 px-3 py-1 text-white text-xs pointer-events-none sm:hidden">
                  {activeIndex + 1} / {slides.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div
        ref={controlsRef}
        className="pointer-events-none absolute bottom-8 left-1/2 z-[4] hidden sm:flex items-center gap-2"
        style={{ transform: `translateX(${controlsTranslate}px)` }}
      >
        <button
          onClick={prev}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Toggle autoplay"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={next}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;