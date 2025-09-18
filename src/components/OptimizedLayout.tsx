import { useEffect } from 'react';

interface OptimizedLayoutProps {
  children: React.ReactNode;
}

// Component to handle performance optimizations
const OptimizedLayout = ({ children }: OptimizedLayoutProps) => {
  useEffect(() => {
    // Preload critical resources after initial render
    const preloadCriticalResources = () => {
      // Preload common images
      const imagesToPreload = [
        '/lovable-uploads/f33f7261-05f8-42bc-8f5d-73dddc791ac5.png', // Default thumbnail
      ];

      imagesToPreload.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });

      // Prefetch likely navigation targets
      const routesToPrefetch = ['/courses', '/about'];
      
      routesToPrefetch.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    // Delay preloading to not interfere with critical path
    const timer = setTimeout(preloadCriticalResources, 2000);
    
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