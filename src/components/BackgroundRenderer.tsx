import React, { useState, useEffect } from 'react';
import { useBackground } from '../contexts/BackgroundContext';

const FALLBACK_URL = '/JEIGHTENESIS.jpg';

const BackgroundRenderer: React.FC = () => {
  const { activeBackground } = useBackground();
  const [imageUrl, setImageUrl] = useState<string>(FALLBACK_URL);

  // Reveal the photo sharp for a beat before blurring it — this component
  // is mounted once for the whole session, so this only ever plays on a
  // real page load, never on SPA navigation between routes.
  const [blurred, setBlurred] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBlurred(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const url = activeBackground?.imageUrl || FALLBACK_URL;
    if (url === imageUrl) return;

    const img = new Image();
    img.onload = () => setImageUrl(url);
    img.onerror = () => setImageUrl(FALLBACK_URL);
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [activeBackground?.imageUrl]);

  // Clear any inline background-image set by previous approach
  useEffect(() => {
    document.documentElement.style.backgroundImage = '';
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -20,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
          filter: blurred ? 'blur(14px)' : 'blur(0px)',
          transform: 'scale(1.1)',
          transition: 'filter 1.4s ease',
        }}
      />
    </div>
  );
};

export default BackgroundRenderer;
