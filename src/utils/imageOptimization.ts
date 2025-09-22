import { supabase } from '@/integrations/supabase/client';

const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * 기본 이미지 URL 처리 및 Supabase 스토리지 URL 생성
 */
export const optimizeImageUrl = (
  imageUrl: string | null | undefined,
  bucket = 'course-thumbnails'
): string => {
  // null, undefined, 빈 문자열 처리
  if (!imageUrl || imageUrl.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }

  // 이미 완전한 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 상대 경로인 경우 (public 폴더)
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // Supabase 스토리지 파일명인 경우 공개 URL 생성
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(imageUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating public URL:', error);
    return PLACEHOLDER_IMAGE;
  }
};

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
  imageUrl: string | null | undefined, 
  options: ImageTransformOptions = {}
): string => {
  const baseUrl = optimizeImageUrl(imageUrl);
  
  // 플레이스홀더인 경우 그대로 반환
  if (baseUrl === PLACEHOLDER_IMAGE) {
    return baseUrl;
  }

  if (!baseUrl || !baseUrl.includes('supabase.co/storage/v1/object/public/')) {
    return baseUrl;
  }

  // For now, return original URL since Supabase image transformation 
  // might not be available on this instance
  // TODO: Test if transformation endpoint works and re-enable if available
  return baseUrl;

  /* 
  // Future implementation when transformation is confirmed to work:
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;

  const publicIndex = baseUrl.indexOf('/storage/v1/object/public/');
  if (publicIndex === -1) return baseUrl;

  const urlBase = baseUrl.substring(0, publicIndex);
  const path = baseUrl.substring(publicIndex + '/storage/v1/object/public/'.length);

  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format) params.append('format', format);
  if (resize) params.append('resize', resize);

  return `${urlBase}/storage/v1/render/image/public/${path}?${params.toString()}`;
  */
};

/**
 * Generates optimized image URLs for different responsive sizes
 * @param imageUrl - Original image URL
 * @returns Object with different sized versions
 */
export const generateResponsiveImages = (imageUrl: string | null | undefined) => {
  return {
    thumbnail: optimizeSupabaseImage(imageUrl, { width: 320, height: 180, quality: 75 }),
    small: optimizeSupabaseImage(imageUrl, { width: 480, height: 270, quality: 80 }),
    medium: optimizeSupabaseImage(imageUrl, { width: 760, height: 428, quality: 85 }),
    large: optimizeSupabaseImage(imageUrl, { width: 1200, height: 675, quality: 90 }),
    original: optimizeImageUrl(imageUrl)
  };
};

/**
 * Gets the appropriate image size based on context
 * @param imageUrl - Original image URL
 * @param context - Where the image is being used
 * @returns Optimized image URL
 */
export const getOptimizedImageForContext = (
  imageUrl: string | null | undefined, 
  context: 'course-card' | 'hero-slide' | 'course-detail' | 'avatar' = 'course-card'
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
      return optimizeImageUrl(imageUrl);
  }
};