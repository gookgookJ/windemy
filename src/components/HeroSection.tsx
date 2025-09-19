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
    <section className="hero-section relative overflow-hidden bg-white px-2 sm:px-4 lg:px-6">
      <div className="w-full" style={{ aspectRatio: '16/9', maxHeight: '80vh', minHeight: '200px' }}>
        {hasSlides && (
          <>
            {/* Mobile/Tablet Layout - Simplified single slide with text overlay */}
            <div className="block lg:hidden relative w-full h-full">
              <div 
                ref={slideRef}
                className="relative w-full h-full cursor-pointer select-none rounded-xl overflow-hidden"
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
                   className="absolute inset-0 w-full h-full object-cover"
                   loading="eager"
                   fetchPriority="high"
                   sizes="(max-width: 1024px) 100vw, 760px"
                   width="800"
                   height="450"
                   decoding="sync"
                 />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                  <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-md space-y-2 sm:space-y-3">
                    <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold leading-tight drop-shadow-lg">
                      {slides[currentSlide].title}
                    </h2>
                    <h3 className="text-white/90 text-sm sm:text-base md:text-lg font-medium drop-shadow-lg">
                      {slides[currentSlide].subtitle}
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm md:text-base drop-shadow-lg">
                      {slides[currentSlide].description}
                    </p>
                  </div>
                </div>
                
                {/* Mobile Controls */}
                <div className="absolute bottom-3 right-4 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="bg-black/50 rounded-full px-2.5 py-1 text-white text-xs font-medium">
                    {currentSlide + 1}/{slides.length}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          {/* Desktop Three Panel Layout */}
          <div className="hidden lg:block relative w-full h-full">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="flex w-full items-center justify-center max-w-7xl mx-auto">
                
                {/* Left Panel (Previous Slide) - Partially visible */}
                <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-r-2xl"
                     onClick={prevSlide}
                     style={{ maxHeight: '60%' }}>
                  <div className="relative w-full h-0" style={{ paddingBottom: '36%' }}>
                    <div className="absolute inset-0 -right-16 w-[133%] rounded-2xl overflow-hidden">
                      <div className="relative w-full h-full">
                         <img
                           src={getOptimizedImageForContext(slides[getSlideIndex(-1)].image_url, 'hero-slide')}
                           alt={slides[getSlideIndex(-1)].title}
                           className="w-full h-full object-cover"
                           loading="lazy"
                           sizes="400px"
                           width="400"
                           height="225"
                         />
                        <div className="absolute inset-0 bg-black/40 flex items-center">
                          <div className="text-white space-y-2 xl:space-y-4 px-6 xl:px-12 flex-1">
                            <h3 className="text-lg xl:text-2xl font-bold drop-shadow-lg line-clamp-2">
                              {slides[getSlideIndex(-1)].title}
                            </h3>
                            <p className="text-sm xl:text-lg opacity-90 drop-shadow-lg line-clamp-1">
                              {slides[getSlideIndex(-1)].subtitle}
                            </p>
                            <p className="text-xs xl:text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg line-clamp-2">
                              {slides[getSlideIndex(-1)].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Panel (Current Slide) - Full visible */}
                <div className="relative z-10 mx-2 xl:mx-4 flex-shrink-0">
                  <div className="relative w-full h-0 rounded-2xl overflow-hidden cursor-pointer" 
                       style={{ paddingBottom: '45%', width: 'min(60vw, 760px)' }}
                       onClick={() => handleSlideClick(slides[currentSlide])}>
                     <img
                       src={getOptimizedImageForContext(slides[currentSlide].image_url, 'hero-slide')}
                       alt={slides[currentSlide].title}
                       className="absolute inset-0 w-full h-full object-cover"
                       loading="eager"
                       fetchPriority="high"
                       sizes="(max-width: 1280px) 60vw, 760px"
                       width="800"
                       height="450"
                       decoding="sync"
                     />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center">
                      <div className="text-white space-y-2 xl:space-y-4 px-6 xl:px-12 flex-1 max-w-lg">
                        <h2 className="text-xl xl:text-3xl font-bold leading-tight drop-shadow-lg">
                          {slides[currentSlide].title}
                        </h2>
                        <h3 className="text-base xl:text-xl font-medium opacity-90 drop-shadow-lg">
                          {slides[currentSlide].subtitle}
                        </h3>
                        <p className="text-sm xl:text-base opacity-80 cursor-pointer hover:opacity-100 transition-opacity drop-shadow-lg">
                          {slides[currentSlide].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel (Next Slide) - Partially visible */}
                <div className="flex-1 relative opacity-40 hover:opacity-60 transition-opacity duration-300 cursor-pointer overflow-hidden rounded-l-2xl"
                     onClick={nextSlide}
                     style={{ maxHeight: '60%' }}>
                  <div className="relative w-full h-0" style={{ paddingBottom: '36%' }}>
                    <div className="absolute inset-0 -left-16 w-[133%] rounded-2xl overflow-hidden">
                      <div className="relative w-full h-full">
                         <img
                           src={getOptimizedImageForContext(slides[getSlideIndex(1)].image_url, 'hero-slide')}
                           alt={slides[getSlideIndex(1)].title}
                           className="w-full h-full object-cover"
                           loading="lazy"
                           sizes="400px"
                           width="400"
                           height="225"
                         />
                        <div className="absolute inset-0 bg-black/40 flex items-center">
                          <div className="text-white space-y-2 xl:space-y-4 px-6 xl:px-12 flex-1">
                            <h3 className="text-lg xl:text-2xl font-bold drop-shadow-lg line-clamp-2">
                              {slides[getSlideIndex(1)].title}
                            </h3>
                            <p className="text-sm xl:text-lg opacity-90 drop-shadow-lg line-clamp-1">
                              {slides[getSlideIndex(1)].subtitle}
                            </p>
                            <p className="text-xs xl:text-sm opacity-80 cursor-pointer hover:opacity-100 drop-shadow-lg line-clamp-2">
                              {slides[getSlideIndex(1)].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Control Buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2">
                <button
                  onClick={prevSlide}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                
                <div className="bg-black/50 rounded-full px-3 py-1 text-white text-sm font-medium">
                  {currentSlide + 1} / {slides.length}
                </div>
                
                <button
                  onClick={nextSlide}
                  className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </section>
  );
};

export default HeroSection;