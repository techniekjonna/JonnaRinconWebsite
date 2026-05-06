import React from 'react';
import { useLocation } from 'react-router-dom';

/** Dark overlay on top of the global background image so all page content stays readable. */
const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  // Shop hub has its own hero image with local overlay — use a lighter global overlay
  if (pathname === '/shop') {
    return (
      <div
        className="fixed inset-0 w-full h-screen -z-10 bg-black/30 pointer-events-none"
        aria-hidden="true"
      />
    );
  }
  return (
    <div
      className="fixed inset-0 w-full h-screen -z-10 bg-black/70 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default BackgroundOverlay;
