import { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const HELVETICA: React.CSSProperties = {
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontWeight: 900,
};

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const doneRef = useRef(false);

  const handleFadeOut = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 700);
  };

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 800);
    const autoTimer = setTimeout(handleFadeOut, 3200);
    return () => { clearTimeout(skipTimer); clearTimeout(autoTimer); };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: isTransitioning ? 'opacity 0.7s ease-in-out' : 'none',
        pointerEvents: isTransitioning ? 'none' : 'auto',
      }}
      onClick={showSkip ? handleFadeOut : undefined}
    >
      <img
        src="/JEIGHTENESIS.jpg"
        alt="Jonna Rincon"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {showSkip && (
        <button
          onClick={handleFadeOut}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full border border-white/30 text-white/40 hover:text-white hover:border-white/60 text-xs uppercase tracking-widest transition-all duration-300"
          style={HELVETICA}
        >
          Click to continue
        </button>
      )}

      <div className="relative z-10 text-center px-4">
        <h1
          className="text-white uppercase leading-none select-none"
          style={{
            ...HELVETICA,
            fontSize: 'clamp(3.5rem, 14vw, 11rem)',
            letterSpacing: '0.08em',
            animation: 'loadFadeIn 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            opacity: 0,
          }}
        >
          JONNA RINCON
        </h1>
      </div>

      <style>{`
        @keyframes loadFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
