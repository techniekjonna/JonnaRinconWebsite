import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const TARGET_TEXT = 'JONNA RINCON';

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const handleSkip = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 900);
  };

  useEffect(() => {
    // Skip button na 1.5s
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);

    // Start fade-out na 3s
    const transitionTimer = setTimeout(() => setIsTransitioning(true), 3000);

    // Verwijder laadscherm na fade (3s + 900ms)
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 3900);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(transitionTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer`}
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: isTransitioning ? 'opacity 0.9s ease-in-out' : 'none',
        pointerEvents: isTransitioning ? 'none' : 'auto',
      }}
      onClick={showSkip ? handleSkip : undefined}
    >
      {/* Background Image */}
      <img
        src="/JEIGHTENESIS.jpg"
        alt="Jonna Rincon"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center' }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Skip Button */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full border border-white/30 text-white/40 hover:text-white hover:border-white/60 text-xs font-semibold uppercase tracking-widest transition-all duration-700"
        >
          Click to continue
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1
          className="text-white font-black uppercase leading-none tracking-tighter select-none"
          style={{
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            minHeight: '1.1em',
            letterSpacing: '0.05em',
            animation: 'fadeInText 1.4s ease-out forwards',
            opacity: 0,
          }}
        >
          {TARGET_TEXT}
        </h1>

        {/* Decorative Line */}
        <div
          className="h-1 bg-white mx-auto my-6"
          style={{
            width: 'clamp(80px, 20vw, 200px)',
            animation: 'slideInWidth 1s ease-out 0.8s forwards',
            transformOrigin: 'center',
            transform: 'scaleX(0)',
          }}
        />
      </div>

      <style>{`
        @keyframes fadeInText {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInWidth {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
