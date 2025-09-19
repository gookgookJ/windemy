import { useEffect, useState, useRef } from "react";
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const startX = useRef(0);
  const currentX = useRef(0);

  // fetch slides
  useEffect(() => {
    let isMounted = true;
    const fetchSlidesOptimized = async () => {
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
        if (!error && data && data.length > 0 && isMounted) setSlides(data);
      } catch (e) {
        if (isMounted) console.error("Error fetching slides:", e);
      }
    };
    fetchSlidesOptimized();
    return () => {
      isMounted = false;
    };
  }, []);

  // Preload first image for LCP
  useEffect(() => {
    if (slides.length > 0 && slides[0].image_url) {
      const href = getOptimizedImageForContext(slides[0].image_url, "hero-slide");
      const preloadLink = document.createElement("link");
      preloadLink.rel = "preload";
      preloadLink.as = "image";
      preloadLink.href = href;
      preloadLink.fetchPriority = "high";
      if (slides[0].image_url.includes("supabase.co")) preloadLink.crossOrigin = "anonymous";
      const firstChild = document.head.firstChild;
      if (firstChild) document.head.insertBefore(preloadLink, firstChild);
      else document.head.appendChild(preloadLink);
      const img = new Image();
      img.src = href;
      return () => {
        if (document.head.contains(preloadLink)) document.head.removeChild(preloadLink);
      };
    }
  }, [slides]);

  // autoplay
  useEffect(() => {
    if (!isPlaying || slides.length === 0 || isDragging) return;
    const t = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length, isPlaying, isDragging]);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
  const togglePlayPause = () => setIsPlaying((v) => !v);
  const getSlideIndex = (offset: number) =>
    (currentSlide + offset + slides.length) % slides.length;

  // swipe
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
    const threshold = 50;
    if (Math.abs(diffX) > threshold) diffX > 0 ? nextSlide() : prevSlide();
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
    const threshold = 50;
    if (Math.abs(diffX) > threshold) diffX > 0 ? nextSlide() : prevSlide();
  };

  const hasSlides = slides.length > 0;

  // 공통: 중앙 패널의 고정 비율/폭 (브레이크포인트별)
  const PANEL_FRAME =
    "aspect-[760/340] rounded-2xl overflow-hidden";
  const PANEL_WIDTH =
    "w-[300px] sm:w-[400px] md:w-[560px] lg:w-[760px]";

  // NOTE: peek 값(좌우가 보이는 양)을 브레이크포인트 별로 다르게: 0.25 / 0.5 / 1 / 1.5장 느낌
  // translateX(calc(100% - PEEK)) 형태로 지정
  const LEFT_SHIFT =
    "-translate-x-[calc(100%-24px)] sm:-translate-x-[calc(100%-40px)] md:-translate-x-[calc(100%-72px)] lg:-translate-x-[calc(100%-120px)]";
  const RIGHT_SHIFT =
    "translate-x-[calc(100%-24px)] sm:translate-x-[calc(100%-40px)] md:translate-x-[calc(100%-72px)] lg:translate-x-[calc(100%-120px)]";

  return (
    <section className="hero-section relative bg-white px-4 py-4 overflow-hidden">
      {hasSlides && (
        <div className="relative w-full flex items-center justify-center">
          {/* 중앙 기준 래퍼: 가운데 패널 폭만큼만 차지 */}
          <div className={`relative ${PANEL_WIDTH}`}>
            {/* Center (항상 완전 노출) */}
            <div
              className={`relative z-10 ${PANEL_WIDTH} ${PANEL_FRAME} cursor-pointer`}
              onClick={() => {
                const s = slides[currentSlide];
                if (s.course_id) navigate(`/course/${s.course_id}`);
                else if (s.link_url) window.open(s.link_url, "_blank");
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={getOptimizedImageForContext(
                  slides[currentSlide].image_url,
                  "hero-slide"
                )}
                alt={slides[currentSlide].title}
                className="w-full h-full object-contain object-center"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                sizes="(max-width:640px) 300px, (max-width:768px) 400px, (max-width:1024px) 560px, 760px"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center">
                <div className="text-white space-y-2 sm:space-y-3 md:space-y-4 px-4 sm:px-6 md:px-8 lg:px-12 flex-1">
                  <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight drop-shadow-lg">
                    {slides[currentSlide].title}
                  </h2>
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium opacity-90 drop-shadow-lg">
                    {slides[currentSlide].subtitle}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-sm lg:text-base opacity-80 drop-shadow-lg">
                    {slides[currentSlide].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Left (이전 슬라이드) : 중앙과 동일한 크기, 왼쪽으로 살짝 보이기 */}
            <button
              type="button"
              aria-label="Previous slide"
              onClick={prevSlide}
              className={`absolute inset-0 ${PANEL_WIDTH} ${PANEL_FRAME} opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer -z-0 ${LEFT_SHIFT}`}
            >
              <img
                src={getOptimizedImageForContext(
                  slides[getSlideIndex(-1)].image_url,
                  "hero-slide"
                )}
                alt={slides[getSlideIndex(-1)].title}
                className="w-full h-full object-contain object-center"
                loading="lazy"
                sizes="(max-width:640px) 300px, (max-width:768px) 400px, (max-width:1024px) 560px, 760px"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center">
                <div className="text-white space-y-2 px-4 sm:px-6 md:px-8 lg:px-12 flex-1">
                  <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold drop-shadow-lg line-clamp-2">
                    {slides[getSlideIndex(-1)].title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 drop-shadow-lg line-clamp-2">
                    {slides[getSlideIndex(-1)].subtitle}
                  </p>
                  <p className="text-xs md:text-sm opacity-80 drop-shadow-lg line-clamp-3">
                    {slides[getSlideIndex(-1)].description}
                  </p>
                </div>
              </div>
            </button>

            {/* Right (다음 슬라이드) : 중앙과 동일한 크기, 오른쪽으로 살짝 보이기 */}
            <button
              type="button"
              aria-label="Next slide"
              onClick={nextSlide}
              className={`absolute inset-0 ${PANEL_WIDTH} ${PANEL_FRAME} opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer -z-0 ${RIGHT_SHIFT}`}
            >
              <img
                src={getOptimizedImageForContext(
                  slides[getSlideIndex(1)].image_url,
                  "hero-slide"
                )}
                alt={slides[getSlideIndex(1)].title}
                className="w-full h-full object-contain object-center"
                loading="lazy"
                sizes="(max-width:640px) 300px, (max-width:768px) 400px, (max-width:1024px) 560px, 760px"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center">
                <div className="text-white space-y-2 px-4 sm:px-6 md:px-8 lg:px-12 flex-1">
                  <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold drop-shadow-lg line-clamp-2">
                    {slides[getSlideIndex(1)].title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 drop-shadow-lg line-clamp-2">
                    {slides[getSlideIndex(1)].subtitle}
                  </p>
                  <p className="text-xs md:text-sm opacity-80 drop-shadow-lg line-clamp-3">
                    {slides[getSlideIndex(1)].description}
                  </p>
                </div>
              </div>
            </button>

            {/* 컨트롤 */}
            <div className="pointer-events-none absolute -bottom-2 sm:bottom-0 left-1/2 -translate-x-1/2 z-20">
              <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
                <button
                  onClick={prevSlide}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                  )}
                </button>
                <div className="bg-black/50 rounded-full px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-white text-xs sm:text-sm font-medium">
                  {currentSlide + 1} / {slides.length}
                </div>
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
