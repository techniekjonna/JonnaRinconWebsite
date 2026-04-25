import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const TARGET_TEXT = 'JONNA RINCON';
const GLYPHS = '!@#$%^&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function useCyberDecode(text: string, startDelay = 200) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let lockedCount = 0;
    let interval: ReturnType<typeof setInterval>;
    let tickCount = 0;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        tickCount++;

        if (tickCount % 5 === 0 && lockedCount < text.length) {
          lockedCount++;
        }

        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < lockedCount) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else {
            result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        setDisplay(result);

        if (lockedCount >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 30);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelay]);

  return { display, done };
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCrashing, setIsCrashing] = useState(false);
  const { display } = useCyberDecode(TARGET_TEXT);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsCrashing(true);
    }, 2800);

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 3000);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 4000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(transitionTimer);
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

      {/* Dark Overlay - 70% black like other public pages */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isTransitioning ? 'bg-black/70' : 'bg-black/70'
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
        {/* Text Animation - Cyber Decode with crash effect */}
        <h1
          className={`text-white font-black uppercase leading-none tracking-tighter select-none ${
            isCrashing ? 'animate-crash' : ''
          }`}
          style={{
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            minHeight: '1.1em',
          }}
        >
          {isCrashing ? generateCrashText(display) : display || ' '}
        </h1>

        {/* Decorative Line */}
        <div
          className="h-1 bg-white mx-auto my-6"
          style={{
            width: 'clamp(80px, 20vw, 200px)',
            animation: 'slideInWidth 1s ease-out 0.3s forwards',
            transformOrigin: 'center',
            transform: 'scaleX(0)',
          }}
        />
      </div>

      <style>{`
        @keyframes slideInWidth {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @keyframes crash {
          0% {
            opacity: 1;
            transform: translate(0, 0) skewX(0deg);
          }
          20% {
            opacity: 0.8;
            transform: translate(-2px, 2px) skewX(-1deg);
          }
          40% {
            opacity: 0.6;
            transform: translate(2px, -2px) skewX(1deg);
          }
          60% {
            opacity: 0.4;
            transform: translate(-1px, 1px) skewX(-0.5deg);
          }
          80% {
            opacity: 0.2;
            transform: translate(1px, -1px) skewX(0.5deg);
          }
          100% {
            opacity: 0;
            transform: translate(-2px, 3px) skewX(-2deg);
          }
        }

        .animate-crash {
          animation: crash 0.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

function generateCrashText(text: string): string {
  const CRASH_CHARS = '!@#$%^&*?|\\/<>[]{}';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (Math.random() > 0.3) {
      result += CRASH_CHARS[Math.floor(Math.random() * CRASH_CHARS.length)];
    } else {
      result += text[i];
    }
  }
  return result;
}
