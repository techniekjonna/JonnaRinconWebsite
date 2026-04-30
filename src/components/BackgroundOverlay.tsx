import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dark overlay on top of the global background image so page content
 * (cards, lists, text) stays readable on every route except the landing
 * page. The landing page renders the full background behind its hero
 * intentionally.
 */
const BackgroundOverlay: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return (
    <div
      className="fixed inset-0 w-full h-screen -z-10 bg-black/70 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default BackgroundOverlay;
