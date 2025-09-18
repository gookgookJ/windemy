import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * OptimizedImage component that serves next-gen formats with fallbacks
 * Attempts to serve WebP first, then original format
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [webpError, setWebpError] = useState(false);

  // Generate WebP URL by replacing extension
  const getWebPUrl = (originalUrl: string): string => {
    if (!originalUrl.includes('supabase.co')) return originalUrl;
    
    // For Supabase images, we'll try to find WebP alternatives
    // by replacing the file extension
    const lastDotIndex = originalUrl.lastIndexOf('.');
    if (lastDotIndex === -1) return originalUrl;
    
    const baseUrl = originalUrl.substring(0, lastDotIndex);
    const extension = originalUrl.substring(lastDotIndex + 1).toLowerCase();
    
    // Only convert common image formats
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      return `${baseUrl}.webp`;
    }
    
    return originalUrl;
  };

  const webpSrc = getWebPUrl(src);
  const shouldTryWebP = webpSrc !== src && !webpError;

  const handleWebPError = () => {
    setWebpError(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    if (onError) {
      onError(e);
    }
  };

  // If we should try WebP and haven't had an error, use picture element
  if (shouldTryWebP && !imageError) {
    return (
      <picture>
        <source 
          srcSet={webpSrc} 
          type="image/webp"
          onError={handleWebPError}
        />
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={cn('responsive-image', className)}
          onError={handleImageError}
          {...props}
        />
      </picture>
    );
  }

  // Fallback to regular img element
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('responsive-image', className)}
      onError={handleImageError}
      {...props}
    />
  );
};