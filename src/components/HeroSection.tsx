import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageForContext } from "@/utils/imageOptimization";

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

const GAP_PX = 16;
const AUTOPLAY_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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

  // ----- 데이터 로드 -----
  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("id, title, subtitle, description, image_url, course_id, link_url, order_index")
        .eq("is_active", true)
        .eq("is_draft", false)
        .order("order_index")
        .limit(10);
      if (!error && data) setSlides(data);
    };
    fetchSlides();
  }, []);

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
    return firstCardRef.current ? firstCardRef.current.clientWidth + GAP_PX : 0;
  }, []);

  const updateControlsPosition = useCallback(() => {
    const cardEl = firstCardRef.current;
    const groupEl = controlsRef.current;
    if (!cardEl || !groupEl) return;
    setControlsTranslate(cardEl.clientWidth / 2 - groupEl.clientWidth - 16);
  }, []);

  // ----- 초기 세팅 -----
  useEffect(() => {
    if (!hasSlides) return;

    const setup = () => {
      setIsTransitioning(false);
      const startTrackIndex = slides.length;
      setTrackIndex(startTrackIndex);
      setActiveIndex(0);
      updateControlsPosition();
      // ✨ FIXED: setTimeout delay를 0으로 변경하여 즉시 다음 렌더링 사이클에서 transition 활성화
      setTimeout(() => setIsTransitioning(true), 0);
    };

    // 첫번째 슬라이드의 이미지가 로드된 후 초기 위치를 설정하여 레이아웃 쉬프트 방지
    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, hasSlides]); // 최초 로드 시에만 실행

  // ----- 리사이즈 핸들러 -----
  useEffect(() => {
    if (!hasSlides) return;

    const handleResize = () => {
      setIsTransitioning(false);
      const newTrackIndex = slides.length + activeIndexRef.current;
      setTrackIndex(newTrackIndex);
      updateControlsPosition();
      // ✨ FIXED: setTimeout delay를 0으로 변경
      setTimeout(() => setIsTransitioning(true), 0);
    };
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

  const goToSlide = useCallback(
    (index: number) => {
      setTrackIndex(slides.length + index);
    },
    [slides.length]
  );

  const next = useCallback(() => setTrackIndex(prev => prev + 1), []);
  const prev = useCallback(() => setTrackIndex(prev => prev - 1), []);
  const togglePlay = useCallback(() => setIsPlaying(v => !v), []);

  const handleSlideClick = useCallback(
    (slide: HeroSlide, index: number) => {
      const originalIndex = index % slides.length;
      if (originalIndex !== activeIndex) {
        goToSlide(originalIndex);
        return;
      }
      if (slide.course_id) navigate(`/course/${slide.course_id}`);
      else if (slide.link_url) window.open(slide.link_url, "_blank");
    },
    [activeIndex, slides.length, navigate, goToSlide]
  );

  const onDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
    setIsTransitioning(false);
  }, []);

  const onDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      currentX.current = clientX;
      // 드래그 중 실시간으로 transform을 업데이트하여 부드러운 드래그 효과 제공
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${calculateTranslateX()}px, 0, 0)`;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging] 
  );

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsTransitioning(true);
    const dx = startX.current - currentX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) next();
      else prev();
    } else {
      // 드래그 거리가 짧으면 원래 위치로 복귀
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${calculateTranslateX(true)}px, 0, 0)`;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, next, prev]);

  // calculateTranslateX 함수에 isResetting 파라미터 추가
  const calculateTranslateX = (isResetting = false) => {
    if (!trackRef.current) return 0;
    const cardWidth = getCardWidth();
    const wrapWidth = trackRef.current.parentElement?.clientWidth ?? 0;
    const baseOffset = wrapWidth / 2 - (cardWidth - GAP_PX) / 2;
    
    // 드래그 중이 아니거나 리셋 중일 때는 trackIndex 기반으로 위치 계산
    if (!isDragging || isResetting) {
        return -trackIndex * cardWidth + baseOffset;
    }
    
    // 드래그 중일 때
    const dragOffset = currentX.current - startX.current;
    return -trackIndex * cardWidth + baseOffset + dragOffset;
  };

  const onTransitionEnd = useCallback(() => {
    if (!hasSlides) return;
    const n = slides.length;
    // ✨ REFINED: 로직을 더 명확하고 안전하게 개선
    // 트랙 인덱스가 원본 범위를 벗어났는지(첫번째 클론셋 이전 또는 마지막 클론셋 이후) 확인
    if (trackIndex < n || trackIndex >= 2 * n) {
      // 모듈러 연산을 통해 현재 보이는 슬라이드에 해당하는 원본 슬라이드 인덱스를 찾고,
      // 그 인덱스를 원본 슬라이드 그룹(중앙)의 위치로 변환
      const newTrackIndex = (trackIndex % n) + n;
      setIsTransitioning(false);
      setTrackIndex(newTrackIndex);
      // ✨ FIXED: setTimeout의 delay를 0으로 설정하여 깜빡임 제거
      setTimeout(() => setIsTransitioning(true), 0);
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
    <section className="relative w-full bg-white py-4 overflow-hidden select-none">
      <div
        ref={trackRef}
        className="flex gap-4"
        style={{
          transform: `translate3d(${calculateTranslateX()}px, 0, 0)`,
          transition: isTransitioning ? "transform 500ms ease-out" : "none",
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
              className={`relative shrink-0 overflow-hidden rounded-lg transition-opacity duration-300
                          h-[180px] w-[280px] sm:h-[220px] sm:w-[420px] md:h-[280px] md:w-[560px] lg:h-[340px] lg:w-[760px]
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
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={isActive ? "high" : undefined}
                decoding="async"
                // 드래그 이벤트가 이미지에서 중단되지 않도록 처리
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
            </div>
          );
        })}
      </div>

      <div
        ref={controlsRef}
        className="pointer-events-none absolute bottom-8 left-1/2 z-[4] flex items-center gap-2"
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