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

const GAP_PX = 16; // gap-4
const AUTOPLAY_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true); // FIXED: enableTransition을 isTransitioning으로 이름 변경 및 초기값 true로 설정
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const transitionEndTimer = useRef<NodeJS.Timeout>();
  const startX = useRef(0);
  const currentX = useRef(0);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsTranslate, setControlsTranslate] = useState(0);

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

      if (!error && data) {
        setSlides(data);
      }
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

  // ----- 유틸 함수 (useCallback으로 최적화) -----
  const getCardWidth = useCallback(() => {
    const card = firstCardRef.current;
    return card ? card.clientWidth + GAP_PX : 0;
  }, []);

  const updateControlsPosition = useCallback(() => {
    const cardEl = firstCardRef.current;
    const groupEl = controlsRef.current;
    if (!cardEl || !groupEl) return;
    const cardW = cardEl.clientWidth;
    const groupW = groupEl.clientWidth;
    const margin = 16;
    setControlsTranslate(cardW / 2 - margin - groupW);
  }, []);

  // ----- 초기 세팅 및 리사이즈 -----
  useEffect(() => {
    if (!hasSlides) return;

    const setup = () => {
      setIsTransitioning(false); // 초기 위치 설정 시에는 애니메이션 끔
      const startTrackIndex = slides.length;
      setTrackIndex(startTrackIndex);
      setActiveIndex(0);
      updateControlsPosition();
      
      // HACK: state 업데이트 후 DOM이 반영될 시간을 벌기 위해 setTimeout 사용
      setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    };

    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }

    const handleResize = () => {
      setIsTransitioning(false); // 리사이즈 중에는 애니메이션 끔
      const newTrackIndex = slides.length + activeIndex;
      setTrackIndex(newTrackIndex);
      updateControlsPosition();
      // HACK: 마찬가지로 state 반영 후 애니메이션을 다시 켬
      setTimeout(() => setIsTransitioning(true), 50);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (img) img.removeEventListener("load", setup);
    };
  }, [slides.length, hasSlides, activeIndex, updateControlsPosition]); // FIXED: 의존성 배열 수정

  // ----- 오토플레이 -----
  useEffect(() => {
    if (!isPlaying || !hasSlides || isDragging) return;

    const autoplay = setInterval(() => {
      // NOTE: next() 함수를 직접 호출하는 대신, 상태 업데이트 함수형으로 변경
      setTrackIndex(prev => prev + 1);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(autoplay);
  }, [isPlaying, hasSlides, isDragging]);

  // ----- 네비게이션 (useCallback으로 최적화) -----
  const goToSlide = useCallback((index: number) => {
    const newTrackIndex = slides.length + index;
    setTrackIndex(newTrackIndex);
  }, [slides.length]);
  
  const next = useCallback(() => setTrackIndex(prev => prev + 1), []);
  const prev = useCallback(() => setTrackIndex(prev => prev - 1), []);
  const togglePlay = useCallback(() => setIsPlaying(v => !v), []);

  const handleSlideClick = useCallback((slide: HeroSlide, index: number) => {
      const originalIndex = index % slides.length;
      if (originalIndex !== activeIndex) {
        goToSlide(originalIndex);
        return; // 비활성 슬라이드 클릭 시 해당 슬라이드로 이동만 함
      }
      // 활성 슬라이드 클릭 시 링크 이동
      if (slide.course_id) navigate(`/course/${slide.course_id}`);
      else if (slide.link_url) window.open(slide.link_url, "_blank");
  }, [activeIndex, slides.length, navigate, goToSlide]);


  // ----- 스와이프 이벤트 핸들러 (useCallback으로 최적화) -----
  const onDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
    setIsTransitioning(false); // 드래그 시작 시 애니메이션 비활성화
  }, []);

  const onDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    currentX.current = clientX;
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsTransitioning(true); // 드래그 종료 시 애니메이션 활성화
    const dx = startX.current - currentX.current;

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) next();
      else prev();
    } else {
        // 임계값 미만이면 원래 위치로 복귀
        if(trackRef.current) {
            const cardWidth = getCardWidth();
            const offset = (trackRef.current.parentElement!.clientWidth / 2) - ((cardWidth - GAP_PX) / 2);
            trackRef.current.style.transform = `translate3d(${-trackIndex * cardWidth + offset}px, 0, 0)`;
        }
    }
    setIsDragging(false);
  }, [isDragging, next, prev, trackIndex, getCardWidth]);

  // ----- 트랙 위치 계산 -----
  const calculateTranslateX = () => {
    if (!trackRef.current) return 0;
    const cardWidth = getCardWidth();
    const wrapWidth = trackRef.current.parentElement?.clientWidth ?? 0;
    const baseOffset = (wrapWidth / 2) - ((cardWidth - GAP_PX) / 2);

    if (isDragging) {
      const dragOffset = currentX.current - startX.current;
      return -trackIndex * cardWidth + baseOffset + dragOffset;
    }
    return -trackIndex * cardWidth + baseOffset;
  };

  // ----- 무한 루프 처리 (핵심 로직) -----
  const onTransitionEnd = useCallback(() => {
    if (!hasSlides) return;
    const n = slides.length;
    let newTrackIndex = trackIndex;
    let shouldSnap = false;

    if (trackIndex >= 2 * n) { // 오른쪽 끝에 도달했을 때
      newTrackIndex = trackIndex - n;
      shouldSnap = true;
    } else if (trackIndex < n) { // 왼쪽 끝에 도달했을 때
      newTrackIndex = trackIndex + n;
      shouldSnap = true;
    }

    if (shouldSnap) {
      setIsTransitioning(false); // 애니메이션 끄고
      setTrackIndex(newTrackIndex); // 위치 순간이동
      
      // HACK: React가 상태 업데이트를 배치 처리하므로,
      // DOM에 반영된 후(순간이동 후) 다시 애니메이션을 켜기 위해 setTimeout 사용
      setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    }
  }, [trackIndex, slides.length, hasSlides]);

  // trackIndex가 변경되면 activeIndex도 업데이트
  useEffect(() => {
    if (hasSlides) {
      const newActiveIndex = (trackIndex % slides.length + slides.length) % slides.length;
      setActiveIndex(newActiveIndex);
    }
  }, [trackIndex, slides.length, hasSlides]);

  if (!hasSlides) {
    return null; // 데이터가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <section className="relative w-full bg-white py-4 overflow-hidden">
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
                decoding="async" // decoding은 sync보다 async가 더 나은 선택일 수 있습니다.
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

      {/* 컨트롤: 중앙 카드 우하단 고정 */}
      <div
        ref={controlsRef}
        className="pointer-events-none absolute bottom-8 left-1/2 z-[4] flex items-center gap-2"
        style={{ transform: `translateX(${controlsTranslate}px)` }}
      >
        <button
          onClick={prev}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Toggle autoplay"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={next}
          className="pointer-events-auto w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;