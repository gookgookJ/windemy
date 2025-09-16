import { useState, useEffect, useCallback, useRef } from 'react';
import { heroAnalytics } from '@/utils/analytics';

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  course_id?: string;
  link_url?: string;
  order_index: number;
  is_active?: boolean;
}

interface UseHeroCarouselProps {
  slides: HeroSlide[];
  autoplayInterval?: number;
  transitionDuration?: number;
}

export const useHeroCarousel = ({ 
  slides, 
  autoplayInterval = 5000,
  transitionDuration = 400 
}: UseHeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const dragStartX = useRef<number | null>(null);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSlideChange = useRef<number>(Date.now());

  // Normalize slide index to handle infinite loop
  const normalizeIndex = useCallback((index: number) => {
    if (slides.length === 0) return 0;
    return ((index % slides.length) + slides.length) % slides.length;
  }, [slides.length]);

  // Get slide at relative position
  const getSlideAtPosition = useCallback((offset: number) => {
    const index = normalizeIndex(currentSlide + offset);
    return slides[index];
  }, [currentSlide, slides, normalizeIndex]);

  // Navigate to specific slide
  const goToSlide = useCallback((index: number, method: 'click' | 'keyboard' | 'swipe' | 'auto' = 'click') => {
    if (slides.length === 0 || isTransitioning) return;
    
    const normalizedIndex = normalizeIndex(index);
    if (normalizedIndex === currentSlide) return;

    const oldSlide = currentSlide;
    setDirection(normalizedIndex > currentSlide ? 'next' : 'prev');
    setIsTransitioning(true);
    setCurrentSlide(normalizedIndex);
    lastSlideChange.current = Date.now();

    // Analytics
    heroAnalytics.navigation(
      normalizedIndex > currentSlide ? 'next' : 'previous',
      method,
      oldSlide,
      normalizedIndex
    );

    // Track slide view
    const slide = slides[normalizedIndex];
    if (slide) {
      heroAnalytics.slideView(normalizedIndex, slide.id, slide.title);
    }

    // Reset transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [currentSlide, slides, isTransitioning, normalizeIndex, transitionDuration]);

  // Navigate to next slide
  const nextSlide = useCallback((method: 'click' | 'keyboard' | 'swipe' | 'auto' = 'click') => {
    goToSlide(currentSlide + 1, method);
  }, [currentSlide, goToSlide]);

  // Navigate to previous slide
  const prevSlide = useCallback((method: 'click' | 'keyboard' | 'swipe' | 'auto' = 'click') => {
    goToSlide(currentSlide - 1, method);
  }, [currentSlide, goToSlide]);

  // Autoplay controls
  const startAutoplay = useCallback(() => {
    if (autoplayTimer.current) return;
    
    setIsPlaying(true);
    heroAnalytics.autoplay('start');
    
    autoplayTimer.current = setInterval(() => {
      // Prevent autoplay if user interacted recently (within 10 seconds)
      if (Date.now() - lastSlideChange.current < 10000) return;
      
      nextSlide('auto');
    }, autoplayInterval);
  }, [autoplayInterval, nextSlide]);

  const pauseAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
    setIsPlaying(false);
    heroAnalytics.autoplay('pause');
  }, []);

  const resumeAutoplay = useCallback(() => {
    heroAnalytics.autoplay('resume');
    startAutoplay();
  }, [startAutoplay]);

  const toggleAutoplay = useCallback(() => {
    if (isPlaying) {
      pauseAutoplay();
    } else {
      resumeAutoplay();
    }
  }, [isPlaying, pauseAutoplay, resumeAutoplay]);

  // Drag/swipe handling
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setDragOffset(0);
    dragStartX.current = clientX;
    pauseAutoplay();
  }, [pauseAutoplay]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || dragStartX.current === null) return;
    
    const offset = clientX - dragStartX.current;
    setDragOffset(offset);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    const threshold = 100; // Minimum drag distance to trigger slide change
    const shouldSwipe = Math.abs(dragOffset) > threshold;
    
    if (shouldSwipe) {
      if (dragOffset < 0) {
        nextSlide('swipe');
      } else {
        prevSlide('swipe');
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    dragStartX.current = null;
    
    // Resume autoplay after a delay
    setTimeout(() => {
      if (!isPlaying) {
        resumeAutoplay();
      }
    }, 1000);
  }, [isDragging, dragOffset, nextSlide, prevSlide, isPlaying, resumeAutoplay]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    handleDragEnd();
    resumeAutoplay();
  }, [handleDragEnd, resumeAutoplay]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Setup autoplay on mount
  useEffect(() => {
    if (slides.length > 1) {
      startAutoplay();
    }

    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [slides.length, startAutoplay]);

  // Track initial slide view
  useEffect(() => {
    if (slides.length > 0 && slides[currentSlide]) {
      const slide = slides[currentSlide];
      heroAnalytics.slideView(currentSlide, slide.id, slide.title);
    }
  }, [slides, currentSlide]);

  return {
    // State
    currentSlide,
    isPlaying,
    direction,
    isTransitioning,
    isDragging,
    dragOffset,
    
    // Navigation
    nextSlide,
    prevSlide,
    goToSlide,
    getSlideAtPosition,
    
    // Autoplay
    startAutoplay,
    pauseAutoplay,
    resumeAutoplay,
    toggleAutoplay,
    
    // Events
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    
    // Utilities
    normalizeIndex,
  };
};