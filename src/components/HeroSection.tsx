import { useEffect, useRef, useState } from "react";
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

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);   // 0..(n-1), 강조/카운터용
  const [trackIndex, setTrackIndex] = useState(0);     // 확장(3배) 트랙에서의 절대 인덱스
  const [translateX, setTranslateX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [enableTransition, setEnableTransition] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);

  const isTransitioning = useRef(false);
  const snappingRef = useRef(false); // 스냅 중이면 true → trackIndex effect 1회 무시

  const startX = useRef(0);
  const curX = useRef(0);

  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsTranslate, setControlsTranslate] = useState(0);

  const navigate = useNavigate();

  // ----- 데이터 로드 -----
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

  // ----- LCP 프리로드 -----
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

  // ----- 유틸 -----
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
    // 스냅 직후 리플로우로 transition off 상태를 확정
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

  // ----- 초기 세팅 및 리사이즈 -----
  useEffect(() => {
    if (!slides.length) return;

    const setup = () => {
      const startTrack = slides.length; // [L][C][R]에서 C그룹의 0번째
      snappingRef.current = true;       // 초기 스냅 단계
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
      const idx = (prev => prev)(trackIndex);
      snappingRef.current = true;
      moveToTrack(idx, true);
      forceReflow();
      setEnableTransition(true);
      updateControlsPosition();
      snappingRef.current = false;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (img) img.removeEventListener("load", setup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // trackIndex 변경시 이동 (스냅 중이면 1회 스킵)
  useEffect(() => {
    if (!slides.length || snappingRef.current) return;
    moveToTrack(trackIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex, slides.length]);

  // ----- 오토플레이 -----
  useEffect(() => {
    if (!isPlaying || !slides.length || dragging) return;
    const t = setInterval(() => {
      next();
    }, 5000);
    return () => clearInterval(t);
  }, [isPlaying, slides.length, dragging, activeIndex]);

  // ----- 네비게이션 -----
  const next = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev + 1);               // 방향 유지(+1)
    setActiveIndex((i) => (i + 1) % slides.length);
  };

  const prev = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setEnableTransition(true);
    setTrackIndex((prev) => prev - 1);               // 방향 유지(-1)
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const toggle = () => setIsPlaying((v) => !v);

  const handleClick = (s: HeroSlide) => {
    if (s.course_id) navigate(`/course/${s.course_id}`);
    else if (s.link_url) window.open(s.link_url, "_blank");
  };

  // ----- 스와이프 -----
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

  // ----- 확장 배열 -----
  const extendedSlides =
    slides.length > 0 ? [...slides, ...slides, ...slides] : [];
  const hasSlides = slides.length > 0;

  // ----- transition 종료 → 경계 스냅 (완전 무애니메이션) -----
  const onTransitionEnd = () => {
    if (!slides.length) return;

    const n = slides.length;
    let snapped = false;

    if (trackIndex >= 2 * n) {
      // 오른쪽 경계 통과 → 중앙 그룹으로 되돌림
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
      // 왼쪽 경계 통과 → 중앙 그룹으로 되돌림
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

    // 다음 애니메이션 허용
    // (스냅이 있든 없든 마지막에 해제)
    isTransitioning.current = false;
  };

  return (
    <section className="relative w-full bg-white py-4">
      {hasSlides && (
        <div ref={wrapRef} className="relative w-full overflow-hidden">
          {/* 트랙 */}
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
                    // 반응형 카드 크기 (월부처럼 가로를 적극 사용)
                    "h-[180px] w-[280px] sm:h-[220px] sm:w-[420px] md:h-[280px] md:w-[560px] lg:h-[340px] lg:w-[760px]",
                    // 비활성 카드 반투명 오버레이
                    "after:pointer-events-none after:absolute after:inset-0 after:z-[2]",
                    isActive ? "after:opacity-0" : "after:bg-white/40 after:opacity-100",
                    isActive ? "" : "cursor-pointer",
                  ].join(" ")}
                  onClick={() => handleClick(s)}
                >
                  {/* 이미지: 가로폭 최대 사용 */}
                  <img
                    alt={s.title}
                    src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={isActive ? "eager" : "lazy"}
                    fetchPriority={isActive ? "high" : undefined}
                    decoding={isActive ? "sync" : "auto"}
                  />

                  {/* 텍스트 3종 (모든 카드) */}
                  <div className="absolute bottom-14 left-5 z-[3] w-[calc(100%-40px)] space-y-2">
                    <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold drop-shadow-lg">
                      {s.title}
                    </h2>
                    {s.subtitle && (
                      <h3 className="text-white/90 text-sm sm:text-base md:text-lg drop-shadow">
                        {s.subtitle}
                      </h3>
                    )}
                    {s.description && (
                      <p className="text-white/85 text-xs sm:text-sm md:text-base drop-shadow">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 컨트롤: 중앙 카드 우하단 고정 */}
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
      )}
    </section>
  );
};

export default HeroSection;
