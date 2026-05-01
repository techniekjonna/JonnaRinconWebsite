import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const TARGET_TEXT = 'JONNA RINCON';

// Progress stages: 0 → 18 → glitch → J18
function useProgressBar() {
  const [display, setDisplay] = useState('0%');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    // Phase 1: count 0→18 fast (total ~600ms)
    const step = setInterval(() => {
      current++;
      setDisplay(`${current}%`);
      if (current >= 18) {
        clearInterval(step);
        // Phase 2: glitch %%%
        let glitchCount = 0;
        const glitchChars = ['%%%', '##%', '%!%', '18%', '%%%', 'J1%', 'J18'];
        const glitch = setInterval(() => {
          setDisplay(glitchChars[glitchCount] ?? 'J18');
          glitchCount++;
          if (glitchCount >= glitchChars.length) {
            clearInterval(glitch);
            setDisplay('J18');
            setDone(true);
          }
        }, 80);
      }
    }, 33); // ~33ms per step = ~600ms for 18 steps

    return () => clearInterval(step);
  }, []);

  return { display, done };
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const { display: progressDisplay, done: progressDone } = useProgressBar();

  const handleSkip = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 900);
  };

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1500);
    const transitionTimer = setTimeout(() => setIsTransitioning(true), 3000);
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: isTransitioning ? 'opacity 0.9s ease-in-out' : 'none',
        pointerEvents: isTransitioning ? 'none' : 'auto',
      }}
      onClick={showSkip ? handleSkip : undefined}
    >
      {/* Background */}
      <img
        src="/JEIGHTENESIS.jpg"
        alt="Jonna Rincon"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Skip */}
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

        {/* Progress bar → J18 */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {/* Bar track */}
          <div
            className="bg-white/10 overflow-hidden"
            style={{ width: 'clamp(80px, 20vw, 200px)', height: '3px' }}
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width: progressDone ? '100%' : '0%',
                transition: progressDone ? 'width 0.15s ease-out' : 'none',
                animation: !progressDone ? 'growBar 0.6s ease-out forwards' : 'none',
              }}
            />
          </div>

          {/* Counter label */}
          <span
            className="font-black tracking-widest text-white select-none"
            style={{
              fontSize: '0.75rem',
              fontVariantNumeric: 'tabular-nums',
              minWidth: '3ch',
              letterSpacing: progressDone ? '0.2em' : '0.05em',
              color: progressDone ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'color 0.2s, letter-spacing 0.2s',
            }}
          >
            {progressDisplay}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeInText {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { width: 0%; }
          to   { width: 18%; }
        }
      `}</style>
    </div>
  );
}
