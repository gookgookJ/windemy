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

  const wrapRef = useRef<HTMLDivElement>(null);   // overflow-hidden 컨테이너
  const trackRef = useRef<HTMLDivElement>(null);  // flex 트랙
  const cardRef = useRef<HTMLDivElement>(null);   // 카드 하나 측정용

  const startX = useRef(0);
  const curX = useRef(0);

  const navigate = useNavigate();

  // --- Fetch slides (원본 코드 유지) ---
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

  // --- LCP 프리로드 (원본 유지) ---
  useEffect(() => {
    if (slides.length > 0 && slides[0].image_url) {
      const href = getOptimizedImageForContext(slides[0].image_url, "hero-slide");
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = href;
      l.fetchPriority = "high";
      if (slides[0].image_url.includes("supabase.co")) l.crossOrigin = "anonymous";
      const first = document.head.firstChild;
      if (first) document.head.insertBefore(l, first);
      else document.head.appendChild(l);
      const img = new Image();
      img.src = href;
      return () => {
        if (document.head.contains(l)) document.head.removeChild(l);
      };
    }
  }, [slides]);

  // --- 오토플레이 (원본 유지) ---
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

  // --- 카드/컨테이너 측정 → 중앙 정렬 translateX 계산 ---
  const [translateX, setTranslateX] = useState(0);
  const recalc = () => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    const wrapW = wrap.clientWidth;
    const cardW = card.clientWidth; // 실제 픽셀(반응형 클래스 적용 결과)
    // 현재 카드를 중앙에 두기 위한 오프셋(px):
    // 현재 카드의 시작 위치 - (컨테이너의 중앙에서 카드 절반만큼 왼쪽)
    const offset =
      current * (cardW + GAP_PX) - (wrapW / 2 - cardW / 2);
    setTranslateX(-offset);
  };

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [current, slides.length]);

  // --- 스와이프 ---
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
        <div
          ref={wrapRef}
          className="overflow-hidden relative w-full"
        >
          {/* 트랙 (월부처럼 flex + gap, translate3d로 위치 이동) */}
          <div
            ref={trackRef}
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
                    // 월부 핵심: 고정 프레임 + after 오버레이
                    "min-w-0 shrink-0 grow-0 relative overflow-hidden p-0",
                    "after:pointer-events-none after:absolute after:top-0 after:left-0 after:h-full after:w-full after:z-[2]",
                    "rounded-lg last:mr-4",
                    // 반응형 카드 폭: 화면이 좁을수록 카드가 작아져서 좌우 '피킹' 양이 자연스레 줄어듦
                    "h-[180px] w-[280px] sm:h-[240px] sm:w-[460px] md:h-[300px] md:w-[600px] lg:h-[340px] lg:w-[760px]",
                    // 비율 고정 + 오버레이 농도(활성=투명, 비활성=반투명)
                    isActive ? "after:opacity-0" : "after:bg-neutral-900/55 after:opacity-100",
                  ].join(" ")}
                  onClick={() => handleClickSlide(s)}
                >
                  {/* 배경 이미지 (월부처럼 가로폭 최대, 세로 크롭) */}
                  <div className="absolute top-0 left-0 mx-auto my-0 flex h-full w-full justify-end p-0">
                    <div className="relative h-full w-full">
                      <img
                        alt={s.title}
                        src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                        className="inline-block h-full w-full object-cover"
                        loading={isActive ? "eager" : "lazy"}
                        fetchPriority={isActive ? "high" : undefined}
                        decoding={isActive ? "sync" : "auto"}
                      />
                    </div>

                    {/* 텍스트 */}
                    <div className="absolute bottom-4 left-4 z-[3] w-[calc(100%-32px)]">
                      <div
                        className={[
                          "mb-2 font-bold break-keep drop-shadow-lg",
                          isActive
                            ? "text-white text-[18px]/[24px] sm:text-[22px]/[28px] md:text-[26px]/[32px] lg:text-[30px]/[38px]"
                            : "text-white/90 text-[16px]/[22px] sm:text-[18px]/[24px] md:text-[20px]/[26px]",
                        ].join(" ")}
                      >
                        {s.title}
                      </div>
                      {s.subtitle && (
                        <div
                          className={[
                            "break-keep drop-shadow",
                            isActive
                              ? "text-white text-sm sm:text-base"
                              : "text-white/80 text-[12px] sm:text-sm",
                          ].join(" ")}
                        >
                          {s.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 컨트롤 (화면 중앙 하단) */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={prev}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={toggle}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                onClick={next}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
