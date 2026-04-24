import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // 3 seconds: loading screen
    const loadingTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 3000);

    // 3-4 seconds: fade out and complete
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 4000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
    >
      {/* Background Image */}
      <img
        src="/JEIGHTENESIS.jpg"
        alt="Jonna Rincon"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectPosition: 'center' }}
      />

      {/* Dark Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-100' : 'opacity-40'
        }`}
      />

      {/* Content - centered */}
      <div
        className={`relative z-10 text-center transition-all duration-1000 transform ${
          isTransitioning
            ? 'opacity-0 scale-95 -translate-y-20'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {/* Text Animation */}
        <h1
          className="text-white font-black uppercase leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            animation: 'fadeIn 0.8s ease-out',
          }}
        >
          JONNA RINCON
        </h1>

        {/* Decorative Line */}
        <div
          className="h-1 bg-white mx-auto my-6"
          style={{
            width: 'clamp(80px, 20vw, 200px)',
            animation: 'slideInWidth 1s ease-out 0.2s forwards',
            transformOrigin: 'center',
            transform: 'scaleX(0)',
          }}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInWidth {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
