import React from 'react';

/** Dark overlay on top of the global background image so all page content stays readable. */
const BackgroundOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 w-full h-screen -z-10 bg-black/70 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default BackgroundOverlay;
