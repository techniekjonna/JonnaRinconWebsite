import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const TARGET_TEXT = 'JONNA RINCON';

// 10 frames in ~2s: J18 ×5, %%% ×3, 18 ×2
const GLITCH_FRAMES = [
  '%%%', '18', 'J18', '%%%', '18',
  'J18', '%%%', 'J18', 'J18', 'J18',
];
const FRAME_MS = 200; // 10 × 200ms = 2s total

function useProgressBar(onDone: () => void) {
  const [display, setDisplay] = useState('0%');

  useEffect(() => {
    let current = 0;
    // Phase 1: 0 → 18 in ~600ms (33ms/step)
    const step = setInterval(() => {
      current++;
      setDisplay(`${current}%`);
      if (current >= 18) {
        clearInterval(step);
        // Phase 2: 10 glitch frames
        let idx = 0;
        const glitch = setInterval(() => {
          setDisplay(GLITCH_FRAMES[idx] ?? 'J18');
          idx++;
          if (idx >= GLITCH_FRAMES.length) {
            clearInterval(glitch);
            setDisplay('J18');
            onDone(); // trigger fade immediately when done
          }
        }, FRAME_MS);
      }
    }, 33);

    return () => clearInterval(step);
  }, [onDone]);

  return display;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const handleFadeOut = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 600);
  };

  const display = useProgressBar(handleFadeOut);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 800);
    // Hard fallback: max 5s total
    const fallback = setTimeout(handleFadeOut, 5000);
    return () => { clearTimeout(skipTimer); clearTimeout(fallback); };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: isTransitioning ? 'opacity 0.6s ease-in-out' : 'none',
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
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full border border-white/30 text-white/40 hover:text-white hover:border-white/60 text-xs font-semibold uppercase tracking-widest transition-all duration-300"
        >
          Click to continue
        </button>
      )}

      <div className="relative z-10 text-center">
        <h1
          className="text-white font-black uppercase leading-none tracking-tighter select-none"
          style={{
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            letterSpacing: '0.05em',
            animation: 'fadeInText 1.2s ease-out forwards',
            opacity: 0,
          }}
        >
          {TARGET_TEXT}
        </h1>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div
            className="bg-white/10 overflow-hidden"
            style={{ width: 'clamp(80px, 20vw, 200px)', height: '3px' }}
          >
            <div
              className="h-full bg-white"
              style={{
                animation: 'growBar 0.6s ease-out forwards',
              }}
            />
          </div>

          <span
            className="font-black tracking-widest select-none transition-all duration-100"
            style={{
              fontSize: '0.75rem',
              fontVariantNumeric: 'tabular-nums',
              minWidth: '3ch',
              color: display === 'J18' ? '#fff' : 'rgba(255,255,255,0.55)',
              letterSpacing: display === 'J18' ? '0.25em' : '0.05em',
            }}
          >
            {display}
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
