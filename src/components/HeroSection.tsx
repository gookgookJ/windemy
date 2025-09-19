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
  const [visibleCount, setVisibleCount] = useState(1); // 현재 화면에서 몇 개 보일지
  const navigate = useNavigate();
  const startX = useRef(0);
  const currentX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch slides
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select(
          "id,title,subtitle,description,image_url,course_id,link_url,order_index"
        )
        .eq("is_active", true)
        .eq("is_draft", false)
        .order("order_index")
        .limit(10);
      if (data) setSlides(data);
    })();
  }, []);

  // 반응형: 화면 크기에 따라 visibleCount 변경
  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 640) setVisibleCount(1); // 모바일
      else if (window.innerWidth < 1024) setVisibleCount(1.5); // 태블릿
      else if (window.innerWidth < 1440) setVisibleCount(2.5); // 작은 데스크탑
      else setVisibleCount(3.5); // 큰 데스크탑
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!isPlaying || isDragging) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, isDragging, slides.length, visibleCount]);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev + 1 >= slides.length ? 0 : prev + 1
    );
  };
  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev - 1 < 0 ? slides.length - 1 : prev - 1
    );
  };

  // Swipe handlers
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
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
  };

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.course_id) navigate(`/course/${slide.course_id}`);
    else if (slide.link_url) window.open(slide.link_url, "_blank");
  };

  const slideWidth = `${100 / visibleCount}%`;

  return (
    <section className="relative w-full overflow-hidden bg-white py-6">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          width: `${(slides.length * 100) / visibleCount}%`,
          transform: `translateX(-${(currentSlide * 100) / slides.length}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className="px-2"
            style={{ flex: `0 0 ${slideWidth}` }}
            onClick={() => handleSlideClick(slide)}
          >
            <div className="relative w-full aspect-[760/340] rounded-2xl overflow-hidden cursor-pointer">
              <img
                src={getOptimizedImageForContext(slide.image_url, "hero-slide")}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center">
                <div className="text-white space-y-2 px-4">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                    {slide.title}
                  </h2>
                  <h3 className="text-sm md:text-base opacity-90">
                    {slide.subtitle}
                  </h3>
                  <p className="text-xs md:text-sm opacity-80">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        <button
          onClick={prevSlide}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
        <button
          onClick={nextSlide}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
