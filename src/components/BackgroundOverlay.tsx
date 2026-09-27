import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hasHomeIntroPlayed } from '../lib/homeIntroState';

const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // On a real first load of the home page, start transparent so the
  // background shows at 100% then fade in. On later SPA navigation back
  // to "/" the intro has already played, so skip straight to ready.
  const [ready, setReady] = useState(!isHome || hasHomeIntroPlayed());

  useEffect(() => {
    if (isHome && !hasHomeIntroPlayed()) {
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
