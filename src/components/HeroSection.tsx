import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageForContext } from "@/utils/imageOptimization";
import useEmblaCarousel from "embla-carousel-react";

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

// 모바일 캐러셀 컴포넌트
const MobileCarousel = ({ slides }: { slides: HeroSlide[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  const onSelect = () => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  };

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // 오토플레이
  useEffect(() => {
    if (!isPlaying || !emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, emblaApi]);

  const handleClick = (slide: HeroSlide) => {
    if (slide.course_id) navigate(`/course/${slide.course_id}`);
    else if (slide.link_url) window.open(slide.link_url, "_blank");
  };

  return (
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative h-[200px] sm:h-[250px] cursor-pointer"
              onClick={() => handleClick(slide)}
            >
              <img
                src={getOptimizedImageForContext(slide.image_url, "hero-slide")}
                alt={slide.title}
                className="w-full h-full object-cover rounded-lg"
                loading={selectedIndex === slides.findIndex(s => s.id === slide.id) ? "eager" : "lazy"}
              />
              
              {/* 텍스트 오버레이 */}
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-end">
                <div className="p-4 text-white w-full">
                  <h2 className="text-lg font-bold mb-1 line-clamp-2">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-sm opacity-90 line-clamp-1">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            scrollPrev();
          }}
          className="w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Toggle autoplay"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            scrollNext();
          }}
          className="w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 인디케이터 */}
      <div className="absolute bottom-4 left-4 flex gap-1">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === selectedIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// 데스크톱 캐러셀 컴포넌트 (기존 로직)
const DesktopCarousel = ({ slides }: { slides: HeroSlide[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [enableTransition, setEnableTransition] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);

  const isTransitioning = useRef(false);
  const snappingRef = useRef(false);

  const startX = useRef(0);
  const curX = useRef(0);

  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsTranslate, setControlsTranslate] = useState(0);

  const navigate = useNavigate();

  const GAP_PX = 16;

  const getCardWidth = () => {
    const card = firstCardRef.current;
    return card ? card.clientWidth + GAP_PX : 0;
  };

  const moveToTrack = (idx: number, immediate = false) => {
    const cardWidth = getCardWidth();
    if (!cardWidth) return;
    const wrapWidth = wrapRef.current?.clientWidth ?? 0;

    const offset =
      idx * cardWidth - (wrapWidth / 2 - (cardWidth - GAP_PX) / 2);

    if (immediate) {
      setEnableTransition(false);
      setTranslateX(-offset);
    } else {
      setTranslateX(-offset);
    }
  };

  const forceReflow = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    trackRef.current && trackRef.current.getBoundingClientRect();
  };

  const updateControlsPosition = () => {
    const cardEl = firstCardRef.current;
    const groupEl = controlsRef.current;
    if (!cardEl || !groupEl) return;
    const cardW = cardEl.clientWidth;
    const groupW = groupEl.clientWidth;
    const margin = 16;
    const translate = cardW / 2 - margin - groupW;
    setControlsTranslate(translate);
  };

  useEffect(() => {
    if (!slides.length) return;

    const setup = () => {
      const startTrack = slides.length;
      snappingRef.current = true;
      setActiveIndex(0);
      setTrackIndex(startTrack);
      moveToTrack(startTrack, true);
      forceReflow();
      setEnableTransition(true);
      updateControlsPosition();
      snappingRef.current = false;
    };

    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }

    const handleResize = () => {
      const centerGroupStart = slides.length;
      const correctTrackIndex = centerGroupStart + activeIndex;
      
      snappingRef.current = true;
      setTrackIndex(correctTrackIndex);
      moveToTrack(correctTrackIndex, true);
      updateControlsPosition();
      snappingRef.current = false;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (img) img.removeEventListener("load", setup);
    };
  }, [slides.length, activeIndex]);

  useEffect(() => {
    if (!slides.length || snappingRef.current) return;
    moveToTrack(trackIndex);
  }, [trackIndex, slides.length]);

  useEffect(() => {
    if (!isPlaying || !slides.length || dragging) return;
    const t = setInterval(() => {
      next();
    }, 5000);
    return () => clearInterval(t);
  }, [isPlaying, slides.length, dragging, activeIndex]);

  const next = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);
    setActiveIndex((i) => (i + 1) % slides.length);
  };

  const prev = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev - 1);
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const handleClick = (s: HeroSlide) => {
    if (s.course_id) navigate(`/course/${s.course_id}`);
    else if (s.link_url) window.open(s.link_url, "_blank");
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    startX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    curX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const dx = startX.current - curX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? next() : prev());
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startX.current = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    curX.current = e.clientX;
  };
  const onMouseUp = () => {
    if (!dragging) return;
    setDragging(false);
    const dx = startX.current - curX.current;
    if (Math.abs(dx) > 50) (dx > 0 ? next() : prev());
  };

  const extendedSlides =
    slides.length > 0 ? [...slides, ...slides, ...slides] : [];

  const onTransitionEnd = () => {
    if (!slides.length) return;

    const n = slides.length;
    let snapped = false;

    if (trackIndex >= 2 * n) {
      const ni = trackIndex - n;
      snappingRef.current = true;
      setEnableTransition(false);
      setTrackIndex(ni);
      moveToTrack(ni, true);
      forceReflow();
      requestAnimationFrame(() => {
        setEnableTransition(true);
        snappingRef.current = false;
      });
      snapped = true;
    } else if (trackIndex < n) {
      const ni = trackIndex + n;
      snappingRef.current = true;
      setEnableTransition(false);
      setTrackIndex(ni);
      moveToTrack(ni, true);
      forceReflow();
      requestAnimationFrame(() => {
        setEnableTransition(true);
        snappingRef.current = false;
      });
      snapped = true;
    }

    isTransitioning.current = false;
  };

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden">
      <div
        ref={trackRef}
        className={`flex gap-4 ml-0 ${
          enableTransition ? "transition-transform duration-500 ease-out" : ""
        }`}
        style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
        onTransitionEnd={onTransitionEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {extendedSlides.map((s, i) => {
          const originalIndex = slides.length ? i % slides.length : 0;
          const isActive = originalIndex === activeIndex;

          return (
            <div
              key={`${s.id}-${i}`}
              role="group"
              aria-roledescription="slide"
              ref={i === 0 ? firstCardRef : undefined}
              className={[
                "min-w-0 shrink-0 grow-0 relative overflow-hidden rounded-lg last:mr-4",
                "h-[340px] w-[760px]",
                "after:pointer-events-none after:absolute after:inset-0 after:z-[2]",
                isActive ? "after:opacity-0" : "after:bg-white/40 after:opacity-100",
                isActive ? "" : "cursor-pointer",
              ].join(" ")}
              onClick={() => handleClick(s)}
            >
              <img
                alt={s.title}
                src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                className="absolute inset-0 h-full w-full object-cover"
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : undefined}
                decoding={isActive ? "sync" : "auto"}
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
                {s.description && (
                  <p className="text-white/85 text-xs sm:text-sm md:text-base lg:text-lg drop-shadow leading-relaxed max-w-prose">
                    {s.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={controlsRef}
        className="pointer-events-none absolute bottom-4 left-1/2 z-[4] flex items-center gap-2"
        style={{ transform: `translateX(${controlsTranslate}px)` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying((v) => !v);
          }}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Toggle autoplay"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select(
          "id, title, subtitle, description, image_url, course_id, link_url, order_index"
        )
        .eq("is_active", true)
        .eq("is_draft", false)
        .order("order_index")
        .limit(10);

      if (!error && data && data.length && mounted) {
        setSlides(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // LCP 프리로드
  useEffect(() => {
    if (!slides.length) return;
    const href = getOptimizedImageForContext(slides[0].image_url, "hero-slide");
    const l = document.createElement("link");
    l.rel = "preload";
    l.as = "image";
    l.href = href;
    l.fetchPriority = "high";
    if (slides[0].image_url.includes("supabase.co")) l.crossOrigin = "anonymous";
    document.head.appendChild(l);
    const img = new Image();
    img.src = href;
    return () => {
      if (document.head.contains(l)) document.head.removeChild(l);
    };
  }, [slides]);

  if (!slides.length) return null;

  return (
    <section className="relative w-full bg-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isMobile ? (
          <MobileCarousel slides={slides} />
        ) : (
          <DesktopCarousel slides={slides} />
        )}
      </div>
    </section>
  );
};

export default HeroSection;
