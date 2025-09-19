import { useEffect, useMemo, useRef, useState } from "react";
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

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(1); // 한 화면에 동시에 보이는 카드 수(반개 단위 포함)
  const [isPlaying, setIsPlaying] = useState(true);

  // 무한루프 구현용 가상 인덱스
  const BUFFER = 3; // 좌/우로 최소 2장 이상 보이게 할 수 있도록 여유 복제 수
  const [vIndex, setVIndex] = useState<number>(BUFFER); // extended 배열 기준 인덱스
  const trackRef = useRef<HTMLDivElement>(null);
  const [enableTransition, setEnableTransition] = useState(true);

  const navigate = useNavigate();

  // 1) 데이터 로드
  useEffect(() => {
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
      if (!error && data?.length) {
        setSlides(data);
      }
    })();
  }, []);

  // 2) LCP 개선: 첫 장 프리로드
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

  // 3) 반응형: 보이는 카드 수 자동 계산
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      // 필요에 맞게 숫자만 조절하세요.
      if (w < 480) setVisibleCount(1);
      else if (w < 640) setVisibleCount(1.25);
      else if (w < 768) setVisibleCount(1.5);
      else if (w < 1024) setVisibleCount(2);
      else if (w < 1280) setVisibleCount(2.5);
      else if (w < 1536) setVisibleCount(3);
      else setVisibleCount(3.5);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // 4) 확장(복제) 배열: [꼬리 BUFFER] + 원본 + [머리 BUFFER]
  const extended = useMemo(() => {
    if (!slides.length) return [] as HeroSlide[];
    const head = slides.slice(0, BUFFER);
    const tail = slides.slice(-BUFFER);
    return [...tail, ...slides, ...head];
  }, [slides]);

  // 슬라이드 폭(%)
  const slideWidthPct = 100 / visibleCount;

  // 5) 현재 중앙 정렬을 위한 트랜스폼 계산
  // - extended 기준 왼쪽에서 vIndex번째 카드의 "중앙"이 컨테이너 중앙에 오도록
  const trackWidthPct = extended.length * slideWidthPct; // 트랙 총 폭(컨테이너 대비 %)
  const scrollLeftPctOfContainer =
    vIndex * slideWidthPct - (100 - slideWidthPct) / 2;
  const translateXPct = -(scrollLeftPctOfContainer / trackWidthPct) * 100;

  // 6) 무한 루프 보정: 경계 넘으면 순간이동 (transition off → 위치 점프 → on)
  useEffect(() => {
    if (!extended.length) return;
    if (vIndex >= slides.length + BUFFER) {
      // 끝을 넘어갔으면 동일 장면으로 점프
      setTimeout(() => {
        setEnableTransition(false);
        setVIndex((prev) => prev - slides.length);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 0);
    } else if (vIndex < BUFFER) {
      setTimeout(() => {
        setEnableTransition(false);
        setVIndex((prev) => prev + slides.length);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 0);
    }
  }, [vIndex, extended.length, slides.length]);

  // 7) 자동 재생
  useEffect(() => {
    if (!isPlaying || !slides.length) return;
    const t = setInterval(() => {
      setVIndex((p) => p + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [isPlaying, slides.length]);

  // 8) 액션
  const next = () => setVIndex((p) => p + 1);
  const prev = () => setVIndex((p) => p - 1);

  const handleClickSlide = (s: HeroSlide) => {
    if (s.course_id) navigate(`/course/${s.course_id}`);
    else if (s.link_url) window.open(s.link_url, "_blank");
  };

  // 9) 스와이프
  const startX = useRef(0);
  const curX = useRef(0);
  const [dragging, setDragging] = useState(false);

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

  // 현재(중앙) 카드 인덱스
  const centerIndex = vIndex;

  return (
    <section className="relative w-full overflow-hidden bg-white py-6">
      {/* 트랙 */}
      <div
        ref={trackRef}
        className={`flex ${enableTransition ? "transition-transform duration-500 ease-out" : ""}`}
        style={{
          width: `${trackWidthPct}%`,
          transform: `translateX(${translateXPct}%)`,
          willChange: "transform",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {extended.map((s, idx) => {
          const isCenter = idx === centerIndex;
          return (
            <div
              key={`${s.id}-${idx}`}
              className="px-2"
              style={{ flex: `0 0 ${slideWidthPct}%` }}
              onClick={() => handleClickSlide(s)}
            >
              {/* 카드 프레임: 월부형 - 가로 극대화 + 고정비율 + 라운드 */}
              <div className="relative w-full aspect-[760/340] rounded-2xl overflow-hidden cursor-pointer">
                <img
                  src={getOptimizedImageForContext(s.image_url, "hero-slide")}
                  alt={s.title}
                  className="w-full h-full object-cover" // 월부처럼 가로폭 꽉 채우기
                  loading={isCenter ? "eager" : "lazy"}
                  fetchPriority={isCenter ? "high" : undefined}
                  decoding={isCenter ? "sync" : "auto"}
                />
                {/* 오버레이: 중앙은 옅게, 사이드는 더 어둡게 */}
                <div
                  className={`absolute inset-0 ${
                    isCenter ? "bg-black/20" : "bg-black/45"
                  } transition-colors`}
                />
                {/* 텍스트 영역 */}
                <div className="absolute inset-0 flex items-center">
                  <div className="text-white px-5 sm:px-6 md:px-8 lg:px-10 space-y-1.5 sm:space-y-2 md:space-y-3">
                    <h2 className={`font-bold drop-shadow-lg
                      ${isCenter ? "text-lg sm:text-xl md:text-2xl lg:text-3xl" : "text-base sm:text-lg md:text-xl"}
                    `}>
                      {s.title}
                    </h2>
                    {s.subtitle && (
                      <h3 className={`opacity-90 drop-shadow-lg
                        ${isCenter ? "text-sm sm:text-base md:text-lg" : "text-xs sm:text-sm"}
                      `}>
                        {s.subtitle}
                      </h3>
                    )}
                    {s.description && (
                      <p className={`opacity-80 drop-shadow-lg
                        ${isCenter ? "text-xs sm:text-sm md:text-base" : "text-[11px] sm:text-xs"}
                      `}>
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 컨트롤 */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
          >
            {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <button
            onClick={next}
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/55 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
