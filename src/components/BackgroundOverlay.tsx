import React, { useState, useEffect } from 'react';

const BackgroundOverlay: React.FC = () => {
  // Reveal the darkness after a beat, letting the (also-sharp-then-blurred)
  // photo show first. This component is mounted once for the whole
  // session, so the reveal only ever plays on a real page load.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-screen -z-10 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        opacity: ready ? 1 : 0,
        transition: 'opacity 2s ease',
      }}
    />
  );
};

export default BackgroundOverlay;
