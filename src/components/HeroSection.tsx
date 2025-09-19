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
  const [currentIndex, setCurrentIndex] = useState(0); // 실제 보여지는 슬라이드 인덱스
  const [translateX, setTranslateX] = useState(0); // 실제 translate 값
  const [isPlaying, setIsPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [enableTransition, setEnableTransition] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);

  const startX = useRef(0);
  const curX = useRef(0);

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
    return () => { mounted = false; };
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
    return () => { if (document.head.contains(l)) document.head.removeChild(l); };
  }, [slides]);

  // ----- 무한 루프 슬라이드 계산 -----
  const getCardWidth = () => {
    const card = firstCardRef.current;
    return card ? card.clientWidth + GAP_PX : 0;
  };

  const moveToIndex = (index: number, immediate = false) => {
    if (isTransitioning.current) return;
    
    const cardWidth = getCardWidth();
    if (!cardWidth) return;

    const wrapWidth = wrapRef.current?.clientWidth || 0;
    const offset = index * cardWidth - (wrapWidth / 2 - (cardWidth - GAP_PX) / 2);
    
    if (immediate) {
      setEnableTransition(false);
      setTranslateX(-offset);
      setTimeout(() => setEnableTransition(true), 50);
    } else {
      setTranslateX(-offset);
    }
  };

  // ----- 초기 설정 및 리사이즈 처리 -----
  useEffect(() => {
    if (!slides.length) return;
    
    setEnableTransition(false);
    const setup = () => {
      const startIndex = slides.length; // 중앙 그룹의 첫 번째 슬라이드
      setCurrentIndex(0);
      moveToIndex(startIndex, true);
      setTimeout(() => setEnableTransition(true), 100);
    };

    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }

    const handleResize = () => moveToIndex(slides.length + currentIndex);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (img) img.removeEventListener("load", setup);
    };
  }, [slides.length]);

  // currentIndex 변경시 위치 업데이트
  useEffect(() => {
    if (slides.length && !isTransitioning.current) {
      moveToIndex(slides.length + currentIndex);
    }
  }, [currentIndex, slides.length]);

  // ----- 오토플레이 -----
  useEffect(() => {
    if (!isPlaying || !slides.length || dragging) return;
    const t = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [isPlaying, slides.length, dragging]);

  // ----- 네비게이션 함수들 -----
  const next = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setCurrentIndex((prev) => {
      const newIndex = (prev + 1) % slides.length;
      // 마지막에서 첫번째로 갈 때 무한 루프 처리
      if (prev === slides.length - 1) {
        setTimeout(() => {
          moveToIndex(slides.length, true); // 중앙 그룹의 첫번째로 순간이동
          setCurrentIndex(0);
          isTransitioning.current = false;
        }, 500);
        return prev; // 일시적으로 현재 인덱스 유지
      }
      isTransitioning.current = false;
      return newIndex;
    });
  };

  const prev = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setCurrentIndex((prev) => {
      const newIndex = (prev - 1 + slides.length) % slides.length;
      // 첫번째에서 마지막으로 갈 때 무한 루프 처리  
      if (prev === 0) {
        setTimeout(() => {
          moveToIndex(slides.length + slides.length - 1, true); // 중앙 그룹의 마지막으로 순간이동
          setCurrentIndex(slides.length - 1);
          isTransitioning.current = false;
        }, 500);
        return prev; // 일시적으로 현재 인덱스 유지
      }
      isTransitioning.current = false;
      return newIndex;
    });
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

  // 무한 루프를 위한 슬라이드 복제
  const extendedSlides = slides.length > 0 ? [...slides, ...slides, ...slides] : [];
  const hasSlides = slides.length > 0;

  return (
    <section className="relative w-full bg-white py-4">
      {hasSlides && (
        <div ref={wrapRef} className="relative w-full overflow-hidden">
          {/* 트랙: 월부형 구조 */}
          <div
            className={`flex gap-4 ml-0 ${enableTransition ? "transition-transform duration-500 ease-out" : ""}`}
            style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {extendedSlides.map((s, i) => {
              const originalIndex = i % slides.length;
              const isActive = originalIndex === currentIndex;
              return (
                <div
                  key={`${s.id}-${i}`}
                  role="group"
                  aria-roledescription="slide"
                  ref={i === 0 ? firstCardRef : undefined}
                  className={[
                    "min-w-0 shrink-0 grow-0 relative overflow-hidden rounded-lg last:mr-4",
                    // 반응형 카드 폭/높이 (넓을수록 더 많이 보이게)
                    "h-[180px] w-[280px] sm:h-[220px] sm:w-[420px] md:h-[280px] md:w-[560px] lg:h-[340px] lg:w-[760px]",
                    // 사이드 흐림(메인 강조)
                    "after:pointer-events-none after:absolute after:inset-0 after:z-[2]",
                    isActive ? "after:opacity-0" : "after:bg-black/60 after:opacity-100",
                  ].join(" ")}
                  onClick={() => handleClick(s)}
                >
                  {/* 이미지 */}
                  <img
                    alt={s.title}
                    src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={isActive ? "eager" : "lazy"}
                    fetchPriority={isActive ? "high" : undefined}
                    decoding={isActive ? "sync" : "auto"}
                    onLoad={() => { if (i === 0) moveToIndex(slides.length + currentIndex, true); }}
                  />

                  {/* 텍스트(활성일 때만 표시) */}
                  {isActive && (
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
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 중앙 이미지 우측 하단 고정 컨트롤 */}
          <div className="absolute bottom-4 left-1/2 transform translate-x-[50%] z-[4] flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
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
