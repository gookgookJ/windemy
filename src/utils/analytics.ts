// Analytics utilities for hero section tracking

interface HeroAnalyticsEvent {
  event: string;
  slide?: number;
  slideId?: string;
  slideTitle?: string;
  action?: string;
  method?: 'click' | 'keyboard' | 'swipe' | 'auto';
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const trackHeroEvent = (eventData: HeroAnalyticsEvent) => {
  // Google Analytics 4 via dataLayer
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'hero_interaction',
      hero_event: eventData.event,
      hero_slide_index: eventData.slide,
      hero_slide_id: eventData.slideId,
      hero_slide_title: eventData.slideTitle,
      hero_action: eventData.action,
      hero_method: eventData.method,
    });
  }

  // Direct gtag call as fallback
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventData.event, {
      custom_parameter: eventData,
    });
  }

  // Console for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Hero Analytics:', eventData);
  }
};

export const heroAnalytics = {
  // Track when a slide becomes visible
  slideView: (slideIndex: number, slideId: string, slideTitle: string) => {
    trackHeroEvent({
      event: 'hero_slide_view',
      slide: slideIndex,
      slideId,
      slideTitle,
    });
  },

  // Track CTA button clicks
  ctaClick: (slideIndex: number, slideId: string, slideTitle: string, method: 'click' | 'keyboard' = 'click') => {
    trackHeroEvent({
      event: 'hero_cta_click',
      slide: slideIndex,
      slideId,
      slideTitle,
      action: 'cta_click',
      method,
    });
  },

  // Track navigation interactions
  navigation: (action: string, method: 'click' | 'keyboard' | 'swipe' | 'auto', fromSlide: number, toSlide: number) => {
    trackHeroEvent({
      event: 'hero_navigation',
      slide: toSlide,
      action,
      method,
    });
  },

  // Track autoplay interactions
  autoplay: (action: 'start' | 'pause' | 'resume') => {
    trackHeroEvent({
      event: 'hero_autoplay',
      action,
    });
  },

  // Track carousel interactions
  interaction: (action: string, method: string) => {
    trackHeroEvent({
      event: 'hero_interaction',
      action,
      method: method as any,
    });
  },
};