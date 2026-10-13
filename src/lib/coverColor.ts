// Picks one vivid accent colour from a beat cover, so every beat page gets
// its own tint (title glow, player, buttons). Falls back to the site red when
// the cover can't be read (no cover, or the image host blocks canvas access).
export const FALLBACK_ACCENT = '#dc2626';

const cache = new Map<string, string>();

function toDirect(url: string): string {
  if (url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function getCoverAccent(url?: string): Promise<string> {
  if (!url) return Promise.resolve(FALLBACK_ACCENT);
  const src = toDirect(url);
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(FALLBACK_ACCENT);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Bucket hues and weight by saturation, ignoring near-black/white/grey
        const buckets = new Array(24).fill(0).map(() => ({ w: 0, r: 0, g: 0, b: 0 }));
        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          if (s < 0.25 || l < 0.15 || l > 0.85) continue;
          const bk = buckets[Math.floor(h / 15) % 24];
          const w = s * (1 - Math.abs(l - 0.5));
          bk.w += w;
          bk.r += data[i] * w;
          bk.g += data[i + 1] * w;
          bk.b += data[i + 2] * w;
        }
        const best = buckets.reduce((a, b) => (b.w > a.w ? b : a));
        if (best.w < 2) return resolve(FALLBACK_ACCENT);

        let [h, s] = rgbToHsl(best.r / best.w, best.g / best.w, best.b / best.w);
        // Keep it readable on the dark site: lift lightness, keep saturation lively
        s = Math.max(s, 0.55);
        const colour = `hsl(${Math.round(h)} ${Math.round(s * 100)}% 58%)`;
        cache.set(src, colour);
        resolve(colour);
      } catch {
        resolve(FALLBACK_ACCENT);
      }
    };
    img.onerror = () => resolve(FALLBACK_ACCENT);
    img.src = src;
  });
}

// Adds alpha to an accent colour (hex or the hsl() form above)
export function withAlpha(colour: string, alpha: number): string {
  if (colour.startsWith('hsl(')) return colour.replace(')', ` / ${alpha})`);
  const hex = colour.replace('#', '');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
