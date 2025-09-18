import { useEffect } from 'react';

interface OptimizedLayoutProps {
  children: React.ReactNode;
}

// Component to handle performance optimizations and caching
const OptimizedLayout = ({ children }: OptimizedLayoutProps) => {
  useEffect(() => {
    // Enhanced resource preloading with cache optimization
    const preloadCriticalResources = () => {
      // Preload and cache critical images
      const imagesToPreload = [
        '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png', // Default thumbnail
        '/src/assets/hero-lms.jpg',
      ];

      imagesToPreload.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.crossOrigin = 'anonymous';
        // Add cache control hints
        link.setAttribute('importance', 'high');
        document.head.appendChild(link);
        
        // Also create img element to trigger browser cache
        const img = new Image();
        img.src = src;
      });

      // Prefetch likely navigation targets with cache hints  
      const routesToPrefetch = ['/courses', '/about'];
      
      routesToPrefetch.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.setAttribute('importance', 'low');
        document.head.appendChild(link);
      });

      // Preload critical fonts with long cache
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.href = 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    };

    // Delay preloading to not interfere with critical path
    const timer = setTimeout(preloadCriticalResources, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Add performance observer for LCP monitoring
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              // LCP optimization: ensure LCP element has high priority
              const lcpEntry = entry as any; // Use any to access element property
              const lcpElement = lcpEntry.element;
              if (lcpElement instanceof HTMLImageElement) {
                (lcpElement as any).fetchPriority = 'high';
                lcpElement.loading = 'eager';
              }
            }
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        return () => observer.disconnect();
      } catch (e) {
        // Silently fail if PerformanceObserver is not supported
      }
    }
  }, []);

  return <>{children}</>;
};

export default OptimizedLayout;