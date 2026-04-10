import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';

/**
 * BackgroundRenderer applies the active background from Firebase to the page
 * Should be placed in the root of the app to affect all pages
 */
const BackgroundRenderer: React.FC = () => {
  const { activeBackground } = useBackground();

  React.useEffect(() => {
    if (activeBackground?.imageUrl) {
      // Apply background image to html element only
      const htmlStyle = document.documentElement.style;
      htmlStyle.backgroundImage = `url('${activeBackground.imageUrl}')`;
      htmlStyle.backgroundAttachment = 'fixed';
      htmlStyle.backgroundPosition = 'center';
      htmlStyle.backgroundRepeat = 'no-repeat';
      htmlStyle.backgroundSize = 'cover';
    } else {
      // Clear background if none is active (fallback to black from CSS)
      document.documentElement.style.backgroundImage = 'none';
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.style.backgroundImage = 'none';
    };
  }, [activeBackground]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundRenderer;
