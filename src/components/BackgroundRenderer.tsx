import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';

/**
 * BackgroundRenderer applies the active background from Firebase to the page
 * Implements FOUC prevention through:
 * - Image preloading with onload detection
 * - Placeholder color while loading
 * - Proper error handling with fallback
 */
const BackgroundRenderer: React.FC = () => {
  const { activeBackground } = useBackground();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(null);

  // Initialize background container
  React.useEffect(() => {
    let bgContainer = document.getElementById('site-bg-container');

    if (!bgContainer) {
      bgContainer = document.createElement('div');
      bgContainer.id = 'site-bg-container';
      bgContainer.className = 'site-bg-container-loading'; // Add loading state class
      bgContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
        background-attachment: fixed;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        width: 100%;
        height: 100%;
        background-color: #0a0a0a;
        transition: opacity 0.3s ease-out;
      `;
      document.body.insertBefore(bgContainer, document.body.firstChild);
    }

    return () => {
      // Don't cleanup on unmount - let the background persist
    };
  }, []);

  // Handle image preloading and application
  React.useEffect(() => {
    if (!activeBackground?.imageUrl) {
      setImageLoaded(false);
      setCurrentImageUrl(null);
      const bgContainer = document.getElementById('site-bg-container');
      if (bgContainer) {
        bgContainer.style.backgroundImage = 'none';
      }
      return;
    }

    const imageUrl = activeBackground.imageUrl;

    // Only preload if URL has changed
    if (imageUrl === currentImageUrl && imageLoaded) {
      return;
    }

    setImageLoaded(false);
    const bgContainer = document.getElementById('site-bg-container');

    if (!bgContainer) return;

    // Add loading state
    bgContainer.classList.add('site-bg-container-loading');
    bgContainer.classList.remove('site-bg-container-loaded');

    // Create image to preload
    const img = new Image();

    const handleLoad = () => {
      // Image has loaded successfully
      setCurrentImageUrl(imageUrl);
      setImageLoaded(true);

      if (bgContainer) {
        bgContainer.style.backgroundImage = `url('${imageUrl}')`;
        bgContainer.style.backgroundAttachment = 'fixed';
        bgContainer.classList.remove('site-bg-container-loading');
        bgContainer.classList.add('site-bg-container-loaded');
      }
    };

    const handleError = () => {
      console.warn(`Failed to load background image: ${imageUrl}`);
      setImageLoaded(false);

      // Fallback: set a dark placeholder or try default
      if (bgContainer) {
        bgContainer.style.backgroundImage = 'none';
        bgContainer.style.backgroundColor = '#0a0a0a';
        bgContainer.classList.remove('site-bg-container-loading');
      }
    };

    // Set up load handlers before setting src
    img.onload = handleLoad;
    img.onerror = handleError;

    // Add timeout for slow/hanging loads (10 seconds)
    const timeoutId = setTimeout(() => {
      if (!imageLoaded) {
        handleError();
      }
    }, 10000);

    // Start preloading
    img.src = imageUrl;

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [activeBackground?.imageUrl]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundRenderer;
