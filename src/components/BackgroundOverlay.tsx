import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // On home page start transparent so the background shows at 100%, then fade in
  const [ready, setReady] = useState(!isHome);

  useEffect(() => {
    if (isHome) {
      const t = setTimeout(() => setReady(true), 500);
      return () => clearTimeout(t);
    }
    setReady(true);
  }, [pathname]);

  return (
    <div
      className="fixed inset-0 w-full h-screen -z-10 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        opacity: ready ? 1 : 0,
        transition: ready ? 'opacity 2s ease' : 'none',
      }}
    />
  );
};

export default BackgroundOverlay;
