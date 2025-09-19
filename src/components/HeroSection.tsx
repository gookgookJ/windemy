import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSlidesOptimized = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('id, title, subtitle, description, image_url, course_id, link_url, order_index')
          .eq('is_active', true)
          .eq('is_draft', false)
          .order('order_index')
          .limit(10); // 최대 10개로 변경

        if (!error && data && data.length > 0 && isMounted) {
          setSlides(data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching slides:', error);
        }
      }
    };
    
    fetchSlidesOptimized();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Immediate preload of the first hero image for better LCP
  useEffect(() => {
    if (slides.length > 0 && slides[0].image_url) {
      // Create preload link with highest priority
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = getOptimizedImageForContext(slides[0].image_url, 'hero-slide');
      preloadLink.fetchPriority = 'high';
      
      // Add crossorigin for external images
      if (slides[0].image_url.includes('supabase.co')) {
        preloadLink.crossOrigin = 'anonymous';
      }
      
      // Insert at the very beginning of head for highest priority
      const firstChild = document.head.firstChild;
      if (firstChild) {
        document.head.insertBefore(preloadLink, firstChild);
      } else {
        document.head.appendChild(preloadLink);
      }
      
      // Also trigger immediate image load in the background
      const img = new Image();
      img.src = getOptimizedImageForContext(slides[0].image_url, 'hero-slide');
      
      return () => {
        // Cleanup preload link if component unmounts
        if (document.head.contains(preloadLink)) {
          document.head.removeChild(preloadLink);
        }
      };
    }
  }, [slides]);

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.course_id) {
      navigate(`/course/${slide.course_id}`);
    } else if (slide.link_url) {
      window.open(slide.link_url, '_blank');
    }
  };

  useEffect(() => {
    if (!isPlaying || slides.length === 0 || isDragging) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPlaying, isDragging]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getSlideIndex = (offset: number) => {
    return (currentSlide + offset + slides.length) % slides.length;
  };

  // Touch event handlers for mobile swipe
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
    const threshold = 50; // minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Mouse event handlers for desktop swipe
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
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // slides가 없어도 렌더링하되, 데이터가 로드되면 바로 표시
  const hasSlides = slides.length > 0;

  return (
    <section className="hero-section relative overflow-hidden bg-white px-4 py-4">
      {hasSlides && (
        <div className="relative w-full flex items-center justify-center overflow-hidden">
          {/* Flex container with responsive peek amounts */}
          <div className="flex items-center w-full overflow-hidden">
            
            {/* Left Panel (Previous Slide) - Responsive peek */}
            <div 
              className="flex-shrink-0 basis-[25%] sm:basis-[35%] md:basis-[45%] lg:basis-[55%] relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
              onClick={prevSlide}
            >
              <div className="w-full aspect-[760/340] rounded-2xl overflow-hidden">
                <div className="relative w-full h-full">
                  <img
                    src={getOptimizedImageForContext(slides[getSlideIndex(-1)].image_url, 'hero-slide')}
                    alt={slides[getSlideIndex(-1)].title}
                    className="w-full h-full object-contain object-center"
                    loading="lazy"
                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 35vw, (max-width: 1024px) 45vw, 55vw"
                    width="400"
                    height="225"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center">
                    <div className="text-white space-y-1 sm:space-y-2 md:space-y-3 lg:space-y-4 px-2 sm:px-4 md:px-6 lg:px-8 flex-1">
                      <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(-1)].title}
                      </h3>
                      <p className="text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg opacity-90 drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(-1)].subtitle}
                      </p>
                      <p className="text-xs opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(-1)].description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Panel (Current Slide) - Always full width */}
            <div className="flex-shrink-0 basis-[50%] sm:basis-[30%] md:basis-[60%] lg:basis-[40%] xl:basis-[30%] relative z-10 mx-1 sm:mx-2 md:mx-3 lg:mx-4">
              <div 
                className="relative w-full aspect-[760/340] rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => handleSlideClick(slides[currentSlide])}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={getOptimizedImageForContext(slides[currentSlide].image_url, 'hero-slide')}
                  alt={slides[currentSlide].title}
                  className="w-full h-full object-contain object-center"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 60vw, (max-width: 1024px) 60vw, 40vw"
                  width="800"
                  height="450"
                  decoding="sync"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center">
                  <div className="text-white space-y-2 sm:space-y-3 md:space-y-4 px-4 sm:px-6 md:px-8 lg:px-12 flex-1">
                    <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight drop-shadow-lg">
                      {slides[currentSlide].title}
                    </h2>
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium opacity-90 drop-shadow-lg">
                      {slides[currentSlide].subtitle}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-sm lg:text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel (Next Slide) - Responsive peek */}
            <div 
              className="flex-shrink-0 basis-[25%] sm:basis-[35%] md:basis-[45%] lg:basis-[55%] relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer"
              onClick={nextSlide}
            >
              <div className="w-full aspect-[760/340] rounded-2xl overflow-hidden">
                <div className="relative w-full h-full">
                  <img
                    src={getOptimizedImageForContext(slides[getSlideIndex(1)].image_url, 'hero-slide')}
                    alt={slides[getSlideIndex(1)].title}
                    className="w-full h-full object-contain object-center"
                    loading="lazy"
                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 35vw, (max-width: 1024px) 45vw, 55vw"
                    width="400"
                    height="225"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center">
                    <div className="text-white space-y-1 sm:space-y-2 md:space-y-3 lg:space-y-4 px-2 sm:px-4 md:px-6 lg:px-8 flex-1">
                      <h3 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(1)].title}
                      </h3>
                      <p className="text-xs sm:text-xs md:text-sm lg:text-base xl:text-lg opacity-90 drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(1)].subtitle}
                      </p>
                      <p className="text-xs opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg line-clamp-2">
                        {slides[getSlideIndex(1)].description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Buttons positioned at center bottom */}
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors touch-target"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors touch-target"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
              </button>
              
              {/* Slide Counter */}
              <div className="bg-black/50 rounded-full px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-white text-xs sm:text-sm font-medium">
                {currentSlide + 1} / {slides.length}
              </div>
              
              <button
                onClick={nextSlide}
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors touch-target"
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