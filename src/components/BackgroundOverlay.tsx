import React from 'react';
import { useLocation } from 'react-router-dom';

/** Dark overlay on top of the global background image so all page content stays readable. */
const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  // Shop pages have their own solid backgrounds — fully cover the global JEIGHTENESIS background
  if (pathname.startsWith('/shop')) {
    return (
      <div
        className="fixed inset-0 w-full h-screen -z-10 bg-[#0a0a0a] pointer-events-none"
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
