import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  placeholderColor = 'bg-white/[0.04]',
  onLoad,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();

    const handleLoad = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    const handleError = () => {
      // Fallback to original src if image fails to load
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;
  }, [isInView, src, onLoad]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-cover bg-center transition-all duration-300 ${className} ${
        isLoading ? placeholderColor : ''
      }`}
      style={{
        backgroundImage: imageSrc ? `url('${imageSrc}')` : undefined,
      }}
    >
      {/* Blur placeholder while loading */}
      {isLoading && isInView && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 animate-pulse" />
      )}

      {/* Hidden img tag for native lazy loading as fallback */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ opacity: 0, position: 'absolute' }}
          loading="lazy"
        />
      )}
    </div>
  );
}
