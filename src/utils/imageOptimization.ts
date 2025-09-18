/**
 * Optimizes image URLs using Supabase storage transformations
 * This helps reduce bandwidth and improve loading performance
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

export const optimizeImageUrl = (
  originalUrl: string, 
  options: ImageOptimizationOptions = {}
): string => {
  // Return original URL if it's not from Supabase storage
  if (!originalUrl || !originalUrl.includes('supabase.co/storage/v1/object/public/')) {
    return originalUrl;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  try {
    const url = new URL(originalUrl);
    const searchParams = new URLSearchParams();

    if (width) searchParams.set('width', width.toString());
    if (height) searchParams.set('height', height.toString());
    searchParams.set('quality', quality.toString());
    searchParams.set('format', format);

    // Create the transform URL
    const transformUrl = originalUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?' + searchParams.toString();

    return transformUrl;
  } catch {
    // If URL parsing fails, return original
    return originalUrl;
  }
};

/**
 * Predefined image optimization presets for common use cases
 */
export const imagePresets = {
  thumbnail: (url: string) => optimizeImageUrl(url, { 
    width: 286, 
    height: 161, 
    quality: 75,
    format: 'webp' 
  }),
  thumbnailRetina: (url: string) => optimizeImageUrl(url, { 
    width: 572, 
    height: 322, 
    quality: 75,
    format: 'webp' 
  }),
  hero: (url: string) => optimizeImageUrl(url, { 
    width: 760, 
    height: 340, 
    quality: 85,
    format: 'webp' 
  }),
  heroMobile: (url: string) => optimizeImageUrl(url, { 
    width: 400, 
    height: 200, 
    quality: 75,
    format: 'webp' 
  }),
  card: (url: string) => optimizeImageUrl(url, { 
    width: 300, 
    height: 180, 
    quality: 75,
    format: 'webp' 
  })
};