/**
 * Utility functions for optimizing images served from Supabase Storage
 * Falls back to original URL if transformation is not available
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Optimizes a Supabase storage image URL with transformation parameters
 * @param imageUrl - Original Supabase storage URL
 * @param options - Transformation options
 * @returns Optimized image URL or original URL if optimization not available
 */
export const optimizeSupabaseImage = (
  imageUrl: string, 
  options: ImageTransformOptions = {}
): string => {
  if (!imageUrl || !imageUrl.includes('supabase.co/storage/v1/object/public/')) {
    return imageUrl;
  }

  // For now, return original URL since Supabase image transformation 
  // might not be available on this instance
  // TODO: Test if transformation endpoint works and re-enable if available
  return imageUrl;

  /* 
  // Future implementation when transformation is confirmed to work:
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  const publicIndex = imageUrl.indexOf('/storage/v1/object/public/');
  if (publicIndex === -1) return imageUrl;

  const baseUrl = imageUrl.substring(0, publicIndex);
  const path = imageUrl.substring(publicIndex + '/storage/v1/object/public/'.length);

  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format) params.append('format', format);
  if (resize) params.append('resize', resize);

  return `${baseUrl}/storage/v1/render/image/public/${path}?${params.toString()}`;
  */
};

/**
 * Generates optimized image URLs for different responsive sizes
 * @param imageUrl - Original image URL
 * @returns Object with different sized versions
 */
export const generateResponsiveImages = (imageUrl: string) => {
  return {
    thumbnail: optimizeSupabaseImage(imageUrl, { width: 320, height: 180, quality: 75 }),
    small: optimizeSupabaseImage(imageUrl, { width: 480, height: 270, quality: 80 }),
    medium: optimizeSupabaseImage(imageUrl, { width: 760, height: 428, quality: 85 }),
    large: optimizeSupabaseImage(imageUrl, { width: 1200, height: 675, quality: 90 }),
    original: imageUrl
  };
};

/**
 * Gets the appropriate image size based on context
 * @param imageUrl - Original image URL
 * @param context - Where the image is being used
 * @returns Optimized image URL
 */
export const getOptimizedImageForContext = (
  imageUrl: string, 
  context: 'course-card' | 'hero-slide' | 'course-detail' | 'avatar'
): string => {
  switch (context) {
    case 'course-card':
      return optimizeSupabaseImage(imageUrl, { width: 320, height: 180, quality: 80 });
    case 'hero-slide':
      return optimizeSupabaseImage(imageUrl, { width: 800, height: 450, quality: 85 });
    case 'course-detail':
      return optimizeSupabaseImage(imageUrl, { width: 1200, height: 675, quality: 90 });
    case 'avatar':
      return optimizeSupabaseImage(imageUrl, { width: 150, height: 150, quality: 85 });
    default:
      return imageUrl;
  }
};