/**
 * Convert indirect URLs (Nextcloud/ownCloud share URLs) to direct download URLs
 * @param url The URL to transform
 * @returns The transformed URL with /download suffix if it's a Nextcloud share link
 *
 * Examples:
 * - "https://nextcloud.example.com/index.php/s/abc123" → "https://nextcloud.example.com/index.php/s/abc123/download"
 * - "https://firebase-storage.googleapis.com/.../file.mp3" → "https://firebase-storage.googleapis.com/.../file.mp3" (unchanged)
 */
export function toDirectUrl(url: string): string {
  if (!url) return url;
  // Nextcloud/ownCloud share URL (/index.php/s/ pattern, covers internedata.nl and others)
  if (url.includes('/index.php/s/') && !url.endsWith('/download')) {
    return url.replace(/\/?$/, '/download');
  }
  // internedata.nl short share links (e.g. https://cloud.internedata.nl/s/xxx)
  if (url.includes('internedata.nl') && /\/s\/[^/]+$/.test(url)) {
    return url.replace(/\/?$/, '/download');
  }
  return url;
}

/**
 * Detect the type of URL
 * @param url The URL to analyze
 * @returns Type of URL: 'nextcloud', 'firebase', or 'direct'
 */
export function detectUrlType(url: string): 'nextcloud' | 'firebase' | 'direct' {
  if (!url) return 'direct';
  if (url.includes('/index.php/s/') || url.includes('internedata.nl')) return 'nextcloud';
  if (url.includes('firebasestorage.googleapis.com') || url.includes('firebase')) return 'firebase';
  return 'direct';
}

/**
 * Validate if a string is a valid URL
 * @param url The string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
