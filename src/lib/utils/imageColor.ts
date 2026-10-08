// Lightweight per-image accent color extraction.
//
// Used by product detail pages (e.g. BeatDetailPage) to derive a tasteful,
// per-item accent color from the product's own artwork — so every item gets
// a distinct visual identity instead of the site's default red accent.
//
// This is intentionally simple: draw the image to a small offscreen canvas,
// sample every pixel, and blend the single most-saturated pixel with the
// overall average. That favors a real color accent (a colorful cover) over
// a flat average-grey while still being representative of the whole image.
// It never throws — callers always get either a usable color or `null`
// (image not loaded yet, failed to load, or a cross-origin canvas read
// blocked by the browser) and should fall back to the site default.

export interface ExtractedColor {
  r: number;
  g: number;
  b: number;
}

// The site's default red accent (Tailwind `red-600`, rgb(220,38,38)) — used
// by callers as the fallback when extraction fails or hasn't resolved yet.
export const DEFAULT_ACCENT_COLOR: ExtractedColor = { r: 220, g: 38, b: 38 };

const SAMPLE_SIZE = 48; // small canvas is plenty for an average/dominant color

/**
 * Extracts a representative accent color from an already-loaded <img>
 * element. Resolves to `null` (never rejects) if the image isn't loaded,
 * has no pixels, or the canvas can't be read (e.g. a cross-origin image
 * served without CORS headers).
 */
export function extractAccentColor(img: HTMLImageElement): Promise<ExtractedColor | null> {
  return new Promise((resolve) => {
    try {
      if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      let bestScore = -1;
      let bestR = 0, bestG = 0, bestB = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue; // ignore mostly-transparent pixels

        sumR += r; sumG += g; sumB += b; count++;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max / 255;
        // Favor saturated, mid-brightness pixels — a strongly saturated but
        // very dark or near-white pixel is a poor accent on its own.
        const midtoneWeight = 1 - Math.abs(brightness - 0.55) * 1.2;
        const score = saturation * Math.max(0.15, midtoneWeight);

        if (score > bestScore) {
          bestScore = score;
          bestR = r; bestG = g; bestB = b;
        }
      }

      if (count === 0) {
        resolve(null);
        return;
      }

      const avgR = sumR / count;
      const avgG = sumG / count;
      const avgB = sumB / count;

      // Blend the most-saturated pixel found with the overall average so the
      // result still reads as "this image's color", not one stray pixel.
      let r = Math.round(bestR * 0.6 + avgR * 0.4);
      let g = Math.round(bestG * 0.6 + avgG * 0.4);
      let b = Math.round(bestB * 0.6 + avgB * 0.4);

      // Ensure the accent is visible against this site's near-black
      // background — lighten it if it ended up too dark to read as an
      // accent (e.g. very dark/monochrome artwork).
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (luminance < 0.28) {
        const lift = (0.42 - luminance) * 255;
        r = Math.min(255, Math.round(r + lift));
        g = Math.min(255, Math.round(g + lift));
        b = Math.min(255, Math.round(b + lift));
      }

      resolve({ r, g, b });
    } catch {
      // getImageData throws on a tainted (cross-origin, non-CORS) canvas.
      resolve(null);
    }
  });
}

export function toRgbaString(color: ExtractedColor, alpha = 1): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
