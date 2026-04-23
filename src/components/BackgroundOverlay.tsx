import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Renders a subtle dark overlay on top of the background image for every
 * route except the landing page. Matches the per-page pattern previously
 * copied into TracksPage/ReleasesPage/… (`fixed inset-0 -z-10 bg-black/20`).
 */
const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20 pointer-events-none" />;
};

export default BackgroundOverlay;
