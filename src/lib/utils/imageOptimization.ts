/**
 * Image optimization utilities for fast loading and caching
 */

export const getOptimizedImageUrl = (url: string, options?: {
  width?: number;
  quality?: number;
}): string => {
  if (!url) return '';

  // For Firebase/CDN images, add quality param if not already present
  if (url.includes('firebaseapp.com') || url.includes('internedata')) {
    const separator = url.includes('?') ? '&' : '?';
    let optimized = url;

    // Add quality parameter for compression
    if (options?.quality && !url.includes('quality=')) {
      optimized += `${separator}quality=${Math.max(60, Math.min(100, options.quality))}`;
    }

    // Add cache busting version
    if (!url.includes('cache=')) {
      const cacheSeparator = optimized.includes('?') ? '&' : '?';
      optimized += `${cacheSeparator}cache=v1`;
    }

    return optimized;
  }

  return url;
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Prefetch non-critical images
 */
export const prefetchImage = (src: string): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};
