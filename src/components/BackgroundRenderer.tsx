import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';

/**
 * BackgroundRenderer applies the active background from Firebase to the page
 * Should be placed in the root of the app to affect all pages
 */
const BackgroundRenderer: React.FC = () => {
  const { activeBackground } = useBackground();

  React.useEffect(() => {
    // Create or get the background container
    let bgContainer = document.getElementById('site-bg-container');

    if (!bgContainer) {
      bgContainer = document.createElement('div');
      bgContainer.id = 'site-bg-container';
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
      `;
      document.body.insertBefore(bgContainer, document.body.firstChild);
    }

    // Update the background image - always update to ensure new backgrounds replace old ones
    if (activeBackground?.imageUrl) {
      bgContainer.style.backgroundImage = `url('${activeBackground.imageUrl}')`;
      bgContainer.style.backgroundAttachment = 'fixed';
    } else {
      // Clear background if none is active
      bgContainer.style.backgroundImage = 'none';
    }

    return () => {
      // Don't cleanup on unmount - let the background persist
    };
  }, [activeBackground?.id, activeBackground?.imageUrl]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundRenderer;
