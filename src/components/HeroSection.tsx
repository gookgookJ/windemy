import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // 기본 슬라이드 (데이터베이스에서 불러오지 못할 경우 사용)
  const defaultSlides = [
    {
      id: '1',
      image_url: heroSlide1,
      title: "실시간 강의 50개 완전 무료",
      subtitle: "지금 가장 주목받는 강의",
      description: "실시간 줌코딩 50개 강의 무료 >",
      background_color: "from-pink-400 to-red-400",
      order_index: 1
    },
    {
      id: '2',
      image_url: heroSlide2,
      title: "신혼부부가 1억으로",
      subtitle: "서울에서 내집마련하는 법",
      description: "실시간 줌코딩 50개 강의 무료 >",
      background_color: "from-pink-300 to-pink-500",
      order_index: 2
    },
    {
      id: '3',
      image_url: heroSlide3,
      title: "집 사기 전 꼭 알아야 할 A to Z",
      subtitle: "나나쌤의 내집마련 기초편",
      description: "추천인이 내집마련하는 법 알려드립니다 →",
      background_color: "from-green-400 to-blue-500",
      order_index: 3
    }
  ];

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching slides:', error);
        setSlides(defaultSlides);
      } else if (data && data.length > 0) {
        setSlides(data);
      } else {
        setSlides(defaultSlides);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides(defaultSlides);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideClick = (slide: HeroSlide) => {
    if (slide.course_id) {
      navigate(`/course/${slide.course_id}`);
    } else if (slide.link_url) {
      window.open(slide.link_url, '_blank');
    }
  };

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isPlaying]);

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

  if (loading || slides.length === 0) {
    return (
      <section className="relative h-[380px] overflow-hidden bg-white flex items-center justify-center">
        <div className="text-muted-foreground">로딩중...</div>
      </section>
    );
  }

  return (
    <section className="relative h-[400px] overflow-hidden bg-gray-900">
      <div className="relative w-full h-full">
        <img
          src={slides[currentSlide].image_url}
          alt={slides[currentSlide].title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-white text-center space-y-4 max-w-3xl px-6">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-lg">
              {slides[currentSlide].title}
            </h2>
            {slides[currentSlide].subtitle && (
              <h3 className="text-2xl font-medium opacity-90 drop-shadow-lg">
                {slides[currentSlide].subtitle}
              </h3>
            )}
            {slides[currentSlide].description && (
              <p className="text-xl opacity-80 drop-shadow-lg cursor-pointer hover:opacity-100 transition-opacity"
                 onClick={() => handleSlideClick(slides[currentSlide])}>
                {slides[currentSlide].description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={togglePlayPause}
          className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        
        <div className="bg-black/50 rounded-full px-4 py-2 text-white text-sm font-medium">
          {currentSlide + 1} / {slides.length}
        </div>
        
        <button
          onClick={nextSlide}
          className="w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;