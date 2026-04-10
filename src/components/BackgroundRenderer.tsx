import React from 'react';
import { useBackground } from '../contexts/BackgroundContext';

/**
 * BackgroundRenderer applies the active background from Firebase to the page
 * Should be placed in the root of the app to affect all pages
 */
const BackgroundRenderer: React.FC = () => {
  const { activeBackground } = useBackground();

  React.useEffect(() => {
    const imageUrl = activeBackground?.imageUrl ?? '/JEIGHTENESIS.jpg';
    const applyBackground = (url: string) => {
      document.body.style.backgroundImage = `url('${url}')`;
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundSize = 'cover';
    };

    applyBackground(imageUrl);

    return () => {
      // On unmount fall back to default
      applyBackground('/JEIGHTENESIS.jpg');
    };
  }, [activeBackground]);

  // This component doesn't render anything visible
  return null;
};

export default BackgroundRenderer;
