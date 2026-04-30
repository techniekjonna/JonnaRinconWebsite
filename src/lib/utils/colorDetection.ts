import React from 'react';
import { useLocation } from 'react-router-dom';

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Get contrasting text color (white or black) based on background brightness
 * Samples from the top-right navigation area (where menu button is)
 * @returns 'white' or 'black' for optimal contrast
 */
export const getContrastColor = (): 'white' | 'black' => {
  try {
    // Check for fixed background in container or html element
    let bgImage = '';
    let bgColor = '';

    // First check site-bg-container div
    const bgContainer = document.getElementById('site-bg-container');
    if (bgContainer) {
      const containerStyle = window.getComputedStyle(bgContainer);
      bgImage = containerStyle.backgroundImage;
      bgColor = containerStyle.backgroundColor;
    }

    // Fallback to html element if no container
    if (!bgImage || bgImage === 'none') {
      const style = window.getComputedStyle(document.documentElement);
      bgImage = style.backgroundImage;
      bgColor = bgColor || style.backgroundColor;
    }

    // If there's a background image, try to sample from it
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        const imageUrl = urlMatch[1];
        try {
          // Try to use cached image if available
          let img = imageCache.get(imageUrl);
          if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            imageCache.set(imageUrl, img);
          }

          // Only proceed if image is loaded
          if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // Draw the entire image onto canvas and sample from top-right
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Sample from top-right area (where nav menu is)
              const x = Math.floor(canvas.width * 0.9);
              const y = Math.floor(canvas.height * 0.1);

              const imageData = ctx.getImageData(x, y, 1, 1);
              const [r, g, b] = imageData.data;

              // Calculate luminance using standard formula
              const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

              // Return contrasting color
              return luminance > 0.5 ? 'black' : 'white';
            }
          }
        } catch (e) {
          // Fall through to color detection
        }
      }
    }

    // No background image or it didn't work, check background color
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      // Parse RGB or RGBA color
      const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const [, r, g, b] = match.map((v, i) => i === 0 ? parseInt(v) : parseInt(v));
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        return luminance > 0.5 ? 'black' : 'white';
      }
    }

    // Check body element as fallback
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyBgColor = bodyStyle.backgroundColor;
    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)') {
      const match = bodyBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const [, r, g, b] = match.map((v, i) => i === 0 ? parseInt(v) : parseInt(v));
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        return luminance > 0.5 ? 'black' : 'white';
      }
    }

    // Default to white
    return 'white';
  } catch (e) {
    // Default to white for safety
    return 'white';
  }
};

/**
 * Hook to get reactive contrast color
 * Re-evaluates on scroll, viewport changes, and route changes
 */
export const useContrastColor = () => {
  const [color, setColor] = React.useState<'white' | 'black'>('white');
  const location = useLocation();

  React.useEffect(() => {
    const updateColor = () => {
      // On non-homepage pages, always use white
      if (location.pathname !== '/' && !location.pathname.startsWith('/#')) {
        setColor('white');
        return;
      }

      const newColor = getContrastColor();
      setColor(newColor);
    };

    // Initial update
    updateColor();

    // Update on scroll, resize, and mutation
    window.addEventListener('scroll', updateColor, { passive: true });
    window.addEventListener('resize', updateColor, { passive: true });

    // Also watch for DOM changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => {
      window.removeEventListener('scroll', updateColor);
      window.removeEventListener('resize', updateColor);
      observer.disconnect();
    };
  }, [location.pathname]);

  return color;
};
