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
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const startX = useRef(0);
  const curX = useRef(0);

  const navigate = useNavigate();

  // --- Fetch slides ---
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

  // --- Preload first hero image for LCP ---
  useEffect(() => {
    if (slides.length > 0 && slides[0].image_url) {
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
    }
  }, [slides]);

  // --- autoplay ---
  useEffect(() => {
    if (!isPlaying || slides.length === 0 || dragging) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length, isPlaying, dragging]);

  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);
  const toggle = () => setIsPlaying((v) => !v);

  const handleClickSlide = (s: HeroSlide) => {
    if (s.course_id) navigate(`/course/${s.course_id}`);
    else if (s.link_url) window.open(s.link_url, "_blank");
  };

  // --- 중앙 정렬 계산 ---
  const [translateX, setTranslateX] = useState(0);
  const recalc = () => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const wrapW = wrap.clientWidth;
    const cardW = card.clientWidth;
    const offset = current * (cardW + GAP_PX) - (wrapW / 2 - cardW / 2);
    setTranslateX(-offset);
  };

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [current, slides.length]);

  // --- swipe ---
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

  const hasSlides = slides.length > 0;

  return (
    <section className="relative w-full bg-white py-4">
      {hasSlides && (
        <div ref={wrapRef} className="overflow-hidden relative w-full">
          {/* 트랙 */}
          <div
            className="flex gap-4 ml-0 transition-transform duration-500 ease-out"
            style={{ transform: `translate3d(${translateX}px,0,0)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {slides.map((s, i) => {
              const isActive = i === current;
              return (
                <div
                  key={s.id}
                  role="group"
                  aria-roledescription="slide"
                  ref={i === 0 ? cardRef : undefined}
                  className={[
                    "min-w-0 shrink-0 grow-0 relative overflow-hidden",
                    "rounded-lg last:mr-4",
                    "h-[180px] w-[280px] sm:h-[240px] sm:w-[460px] md:h-[300px] md:w-[600px] lg:h-[340px] lg:w-[760px]",
                    "after:pointer-events-none after:absolute after:top-0 after:left-0 after:h-full after:w-full after:z-[2]",
                    isActive
                      ? "after:opacity-0"
                      : "after:bg-black/60 after:opacity-100",
                  ].join(" ")}
                  onClick={() => handleClickSlide(s)}
                >
                  <div className="absolute top-0 left-0 h-full w-full">
                    <img
                      alt={s.title}
                      src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                      className="inline-block h-full w-full object-cover"
                      loading={isActive ? "eager" : "lazy"}
                      fetchPriority={isActive ? "high" : undefined}
                      decoding={isActive ? "sync" : "auto"}
                    />
                  </div>

                  {/* 텍스트 (조금 위쪽으로) */}
                  <div className="absolute bottom-12 left-6 z-[3] w-[calc(100%-48px)] space-y-2">
                    <h2
                      className={`font-bold drop-shadow-lg ${
                        isActive
                          ? "text-white text-lg sm:text-xl md:text-2xl lg:text-3xl"
                          : "text-white/80 text-base sm:text-lg"
                      }`}
                    >
                      {s.title}
                    </h2>
                    {s.subtitle && (
                      <h3
                        className={`drop-shadow ${
                          isActive
                            ? "text-white/90 text-sm sm:text-base md:text-lg"
                            : "text-white/70 text-sm"
                        }`}
                      >
                        {s.subtitle}
                      </h3>
                    )}
                    {s.description && (
                      <p
                        className={`drop-shadow ${
                          isActive
                            ? "text-white/80 text-xs sm:text-sm md:text-base"
                            : "hidden"
                        }`}
                      >
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 컨트롤 버튼 → 메인 이미지 오른쪽 하단 */}
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
            <button
              onClick={prev}
              className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="w-9 h-9 md:w-10 md:h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={next}
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
