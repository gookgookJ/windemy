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

const GAP_PX = 16; // Tailwind gap-4 과 동일

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // 초기 가운데 정렬용
  const [translateX, setTranslateX] = useState(0);
  const [enableTransition, setEnableTransition] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);

  const startX = useRef(0);
  const currentX = useRef(0);

  const navigate = useNavigate();

  // 1) 데이터 로드
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("hero_slides")
          .select(
            "id, title, subtitle, description, image_url, course_id, link_url, order_index"
          )
          .eq("is_active", true)
          .eq("is_draft", false)
          .order("order_index")
          .limit(10);

        if (!error && data && data.length > 0 && isMounted) {
          setSlides(data);
        }
      } catch (e) {
        if (isMounted) console.error("Error fetching slides:", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2) 첫 이미지 프리로드 (LCP)
  useEffect(() => {
    if (slides.length > 0 && slides[0].image_url) {
      const href = getOptimizedImageForContext(slides[0].image_url, "hero-slide");
      const preloadLink = document.createElement("link");
      preloadLink.rel = "preload";
      preloadLink.as = "image";
      preloadLink.href = href;
      preloadLink.fetchPriority = "high";
      if (slides[0].image_url.includes("supabase.co")) {
        preloadLink.crossOrigin = "anonymous";
      }
      document.head.appendChild(preloadLink);
      const img = new Image();
      img.src = href;
      return () => {
        if (document.head.contains(preloadLink)) {
          document.head.removeChild(preloadLink);
        }
      };
    }
  }, [slides]);

  // 3) 중앙 정렬 계산
  const recalc = () => {
    const wrap = wrapRef.current;
    const card = firstCardRef.current;
    if (!wrap || !card || !slides.length) return;
    const wrapW = wrap.clientWidth;
    const cardW = card.clientWidth;
    const offset = currentSlide * (cardW + GAP_PX) - (wrapW / 2 - cardW / 2);
    setTranslateX(-offset);
  };

  // 초기 렌더: transition 끈 상태로 중앙 정렬 → 다음 프레임에 켜기
  useEffect(() => {
    if (!slides.length) return;

    setEnableTransition(false);
    const setup = () => {
      recalc();
      requestAnimationFrame(() => setEnableTransition(true));
    };

    // 첫 카드 이미지가 로드되면 더 정확
    const img = firstCardRef.current?.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", setup, { once: true });
    } else {
      setup();
    }

    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      if (img) img.removeEventListener("load", setup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // currentSlide 변경 시에도 재계산
  useEffect(() => {
    recalc();
  }, [currentSlide]);

  // 4) 오토플레이
  useEffect(() => {
    if (!isPlaying || slides.length === 0 || isDragging) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isPlaying, isDragging]);

  // 네비게이션
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const togglePlayPause = () => setIsPlaying((v) => !v);

  const getSlideIndex = (offset: number) =>
    (currentSlide + offset + slides.length) % slides.length;

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.course_id) navigate(`/course/${slide.course_id}`);
    else if (slide.link_url) window.open(slide.link_url, "_blank");
  };

  // 5) 스와이프
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diffX = startX.current - currentX.current;
    if (Math.abs(diffX) > 50) (diffX > 0 ? nextSlide() : prevSlide());
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    currentX.current = e.clientX;
  };
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const diffX = startX.current - currentX.current;
    if (Math.abs(diffX) > 50) (diffX > 0 ? nextSlide() : prevSlide());
  };

  const hasSlides = slides.length > 0;

  return (
    <section className="relative w-full bg-white py-4 overflow-hidden">
      {hasSlides && (
        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 트랙: 모든 브레이크포인트에서 동일 구조. 카드 폭/높이만 반응형 */}
          <div
            className={`flex gap-4 ml-0 ${
              enableTransition ? "transition-transform duration-500 ease-out" : ""
            }`}
            style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
          >
            {slides.map((s, i) => {
              const isActive = i === currentSlide;
              return (
                <div
                  key={s.id}
                  role="group"
                  aria-roledescription="slide"
                  ref={i === 0 ? firstCardRef : undefined}
                  onClick={() => handleSlideClick(s)}
                  className={[
                    "relative overflow-hidden rounded-2xl select-none cursor-pointer shrink-0",
                    // 카드 사이즈 (월부처럼 가로를 꽉 쓰고 좌우 피킹이 반응형으로 변함)
                    "h-[180px] w-[280px] sm:h-[220px] sm:w-[420px] md:h-[300px] md:w-[600px] lg:h-[340px] lg:w-[760px]",
                    // 비활성은 어둡게
                    "after:pointer-events-none after:absolute after:inset-0 after:z-[2]",
                    isActive ? "after:opacity-0" : "after:bg-black/60 after:opacity-100",
                  ].join(" ")}
                >
                  {/* 이미지 */}
                  <img
                    alt={s.title}
                    src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={isActive ? "eager" : "lazy"}
                    fetchPriority={isActive ? "high" : undefined}
                    decoding={isActive ? "sync" : "auto"}
                    onLoad={() => {
                      if (i === 0) recalc(); // 첫 카드 로드 시 한번 더 보정
                    }}
                  />

                  {/* 텍스트: 모든 카드에 노출, 활성일 때 더 크게/선명 */}
                  <div className="absolute bottom-12 left-5 z-[3] w-[calc(100%-40px)] space-y-2">
                    <h2
                      className={`font-bold drop-shadow-lg ${
                        isActive
                          ? "text-white text-lg sm:text-xl md:text-2xl lg:text-3xl"
                          : "text-white/85 text-base sm:text-lg md:text-xl"
                      }`}
                    >
                      {s.title}
                    </h2>
                    {s.subtitle && (
                      <h3
                        className={`drop-shadow ${
                          isActive
                            ? "text-white/90 text-sm sm:text-base md:text-lg"
                            : "text-white/70 text-sm sm:text-base"
                        }`}
                      >
                        {s.subtitle}
                      </h3>
                    )}
                    {s.description && (
                      <p
                        className={`drop-shadow ${
                          isActive
                            ? "text-white/85 text-xs sm:text-sm md:text-base"
                            : "text-white/60 text-xs sm:text-sm"
                        }`}
                      >
                        {s.description}
                      </p>
                    )}
                  </div>

                  {/* 컨트롤: 활성 카드의 우측 하단 고정 */}
                  {isActive && (
                    <div className="absolute bottom-4 right-5 z-[4] flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevSlide();
                        }}
                        className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="hidden md:block bg-black/60 text-white text-xs md:text-sm rounded-full px-2.5 py-1">
                        {currentSlide + 1} / {slides.length}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextSlide();
                        }}
                        className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
