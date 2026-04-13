/**
 * Utility for managing background image preload hints in the HTML head
 * Dynamically adds/updates preload links for cached background images
 */

const PRELOAD_ID = 'bg-preload-link';

/**
 * Add or update a preload link for the cached background image
 * This ensures the browser prioritizes loading the background image early
 */
export const addBackgroundPreload = (imageUrl: string): void => {
  try {
    // Remove existing preload if present
    removeBackgroundPreload();

    // Create preload link
    const link = document.createElement('link');
    link.id = PRELOAD_ID;
    link.rel = 'preload';
    link.as = 'image';
    link.href = imageUrl;
    link.setAttribute('importance', 'high');

    // Add to head
    document.head.appendChild(link);
  } catch (err) {
    console.warn('Failed to add background preload hint:', err);
  }
};

/**
 * Remove the background preload link from the head
 */
export const removeBackgroundPreload = (): void => {
  try {
    const existing = document.getElementById(PRELOAD_ID);
    if (existing) {
      existing.remove();
    }
  } catch (err) {
    console.warn('Failed to remove background preload hint:', err);
  }
};

/**
 * Initialize preload from cached background on app startup
 * This should be called as early as possible
 */
export const initializeBackgroundPreload = (): void => {
  try {
    const cached = localStorage.getItem('cachedBackground');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.imageUrl) {
        addBackgroundPreload(parsed.imageUrl);
      }
    }
  } catch (err) {
    console.warn('Failed to initialize background preload:', err);
  }
};
