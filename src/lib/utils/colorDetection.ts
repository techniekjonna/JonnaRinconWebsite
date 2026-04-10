import React from 'react';

/**
 * Smart color detection utility
 * Determines if text should be white or black based on background brightness
 */

/**
 * Get contrasting text color (white or black) based on background at a specific position
 * Uses background image if available, otherwise uses computed background color
 * @param x - X coordinate relative to viewport
 * @param y - Y coordinate relative to viewport
 * @returns 'white' or 'black' for optimal contrast
 */
export const getContrastColor = (x: number, y: number): 'white' | 'black' => {
  try {
    // Get background image URL from documentElement or body
    const bgImage = window.getComputedStyle(document.documentElement).backgroundImage;

    if (bgImage && bgImage !== 'none') {
      // Extract URL from CSS background-image value
      const urlMatch = bgImage.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.drawImage(img, 0, 0);

              // Calculate position in image based on background-position and -size
              const bgSize = window.getComputedStyle(document.documentElement).backgroundSize;
              const bgPosition = window.getComputedStyle(document.documentElement).backgroundPosition;

              // For fixed background with cover sizing, map viewport coords to image coords
              let imgX = (x / window.innerWidth) * img.width;
              let imgY = (y / window.innerHeight) * img.height;

              // Clamp to image bounds
              imgX = Math.max(0, Math.min(imgX, img.width - 1));
              imgY = Math.max(0, Math.min(imgY, img.height - 1));

              const imageData = ctx.getImageData(Math.floor(imgX), Math.floor(imgY), 1, 1);
              const [r, g, b] = imageData.data;

              // Calculate luminance using standard formula
              const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

              // Return contrasting color
              return luminance > 0.5 ? 'black' : 'white';
            }
          };

          img.onerror = () => {
            // Fallback if image fails to load
            return getContrastFromBgColor();
          };

          img.src = urlMatch[1];
          // Return white by default while image loads (will update via effect)
          return 'white';
        } catch (e) {
          // If image processing fails, fall back to color detection
          return getContrastFromBgColor();
        }
      }
    }

    // No background image, check background color
    return getContrastFromBgColor();
  } catch (e) {
    // Default to white for safety
    return 'white';
  }
};

/**
 * Fallback: Determine contrast color from computed background color
 */
const getContrastFromBgColor = (): 'white' | 'black' => {
  try {
    const bgColor = window.getComputedStyle(document.documentElement).backgroundColor;

    // Parse RGB color
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return luminance > 0.5 ? 'black' : 'white';
    }

    // Default to white
    return 'white';
  } catch (e) {
    return 'white';
  }
};

/**
 * Hook to get reactive contrast color
 * Re-evaluates on scroll and viewport changes
 */
export const useContrastColor = (x: number = window.innerWidth / 2, y: number = 0) => {
  const [color, setColor] = React.useState<'white' | 'black'>('white');

  React.useEffect(() => {
    const updateColor = () => {
      const newColor = getContrastColor(x, y);
      setColor(newColor);
    };

    updateColor();

    // Update on scroll, resize
    window.addEventListener('scroll', updateColor, { passive: true });
    window.addEventListener('resize', updateColor, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateColor);
      window.removeEventListener('resize', updateColor);
    };
  }, [x, y]);

  return color;
};
