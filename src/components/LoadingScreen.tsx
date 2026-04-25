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
  const [isGlitching, setIsGlitching] = useState(false);
  const { display, done } = useCyberDecode(TARGET_TEXT);

  useEffect(() => {
    if (!done) return;

    const glitchTimer = setTimeout(() => {
      setIsGlitching(true);
    }, 300);

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 1500);

    return () => {
      clearTimeout(glitchTimer);
      clearTimeout(transitionTimer);
      clearTimeout(completeTimer);
    };
  }, [done, onLoadingComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      } ${isGlitching ? 'screen-glitch' : ''}`}
      style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
    >
      {/* Background Image */}
      <img
        src="/JEIGHTENESIS.jpg"
        alt="Jonna Rincon"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        } ${isGlitching ? 'glitch-screen' : ''}`}
        style={{ objectPosition: 'center' }}
      />

      {/* Dark Overlay - 70% black like other public pages */}
      <div className={`absolute inset-0 bg-black/70 ${isGlitching ? 'glitch-screen' : ''}`} />

      {/* Content - centered */}
      <div
        className={`relative z-10 text-center transition-all duration-1000 transform ${
          isTransitioning
            ? 'opacity-0 scale-95 -translate-y-20'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {/* Text with glitch effect */}
        <div className="relative">
          <h1
            className={`text-white font-black uppercase leading-none tracking-tighter select-none ${
              isGlitching ? 'glitch-active' : ''
            }`}
            style={{
              fontSize: 'clamp(2rem, 8vw, 6rem)',
              minHeight: '1.1em',
              letterSpacing: '0.05em',
            }}
            data-text={TARGET_TEXT}
          >
            {display || ' '}
          </h1>

          {/* Glitch layers for effect */}
          {isGlitching && (
            <>
              <h1
                className="glitch-layer glitch-layer-1"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 6rem)',
                  minHeight: '1.1em',
                  letterSpacing: '0.05em',
                }}
              >
                {TARGET_TEXT}
              </h1>
              <h1
                className="glitch-layer glitch-layer-2"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 6rem)',
                  minHeight: '1.1em',
                  letterSpacing: '0.05em',
                }}
              >
                {TARGET_TEXT}
              </h1>
            </>
          )}
        </div>

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

        /* Main glitch distortion for text - realistic digital break */
        @keyframes glitch-main {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate(0, 0);
            opacity: 1;
          }
          10% {
            clip-path: inset(35% 0 35% 0);
            transform: translate(-2px, -1px);
            opacity: 0.95;
          }
          20% {
            clip-path: inset(15% 0 60% 0);
            transform: translate(2px, 2px);
            opacity: 0.9;
          }
          30% {
            clip-path: inset(55% 0 20% 0);
            transform: translate(-1px, 1px);
            opacity: 0.85;
          }
          40% {
            clip-path: inset(25% 0 45% 0);
            transform: translate(1px, -2px);
            opacity: 0.75;
          }
          50% {
            clip-path: inset(60% 0 15% 0);
            transform: translate(-2px, 2px);
            opacity: 0.6;
          }
          65% {
            clip-path: inset(10% 0 70% 0);
            transform: translate(2px, -1px);
            opacity: 0.4;
          }
          80% {
            clip-path: inset(0 0 95% 0);
            transform: translate(-1px, 3px);
            opacity: 0.15;
          }
          100% {
            clip-path: inset(100% 0 0 0);
            transform: translate(0, 5px);
            opacity: 0;
          }
        }

        /* Red channel glitch */
        @keyframes glitch-red {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate(0, 0);
            opacity: 0;
          }
          15% {
            clip-path: inset(50% 0 20% 0);
            transform: translate(-4px, 2px);
            opacity: 0.8;
          }
          35% {
            clip-path: inset(30% 0 40% 0);
            transform: translate(4px, -2px);
            opacity: 0.8;
          }
          55% {
            clip-path: inset(60% 0 10% 0);
            transform: translate(-3px, 3px);
            opacity: 0.6;
          }
          75% {
            clip-path: inset(20% 0 60% 0);
            transform: translate(3px, -3px);
            opacity: 0.4;
          }
          100% {
            clip-path: inset(0 0 100% 0);
            opacity: 0;
          }
        }

        /* Blue channel glitch */
        @keyframes glitch-blue {
          0% {
            clip-path: inset(0 0 0 0);
            transform: translate(0, 0);
            opacity: 0;
          }
          20% {
            clip-path: inset(30% 0 50% 0);
            transform: translate(3px, -3px);
            opacity: 0.8;
          }
          40% {
            clip-path: inset(55% 0 15% 0);
            transform: translate(-3px, 3px);
            opacity: 0.8;
          }
          60% {
            clip-path: inset(25% 0 50% 0);
            transform: translate(4px, -2px);
            opacity: 0.6;
          }
          80% {
            clip-path: inset(45% 0 35% 0);
            transform: translate(-4px, 2px);
            opacity: 0.4;
          }
          100% {
            clip-path: inset(100% 0 0 0);
            opacity: 0;
          }
        }

        /* Screen-wide glitch effect - minimal scanlines and subtle shifts */
        @keyframes glitch-screen-distort {
          0% {
            transform: translate(0, 0);
          }
          20% {
            transform: translate(-1px, -1px);
          }
          40% {
            transform: translate(1px, 1px);
          }
          60% {
            transform: translate(-1px, 1px);
          }
          80% {
            transform: translate(1px, -1px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* Scanline effect overlay */
        @keyframes scanline-sweep {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .glitch-active {
          animation: glitch-main 0.4s ease-in-out forwards;
        }

        .screen-glitch {
          animation: glitch-screen-distort 0.4s ease-in-out forwards;
        }

        .glitch-screen {
          animation: glitch-screen-distort 0.4s ease-in-out forwards;
        }

        .glitch-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          color: white;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          clip-path: inset(0 0 0 0);
        }

        .glitch-layer-1 {
          animation: glitch-red 0.4s ease-in-out forwards;
          color: #ff0000;
          mix-blend-mode: screen;
        }

        .glitch-layer-2 {
          animation: glitch-blue 0.4s ease-in-out forwards;
          color: #0099ff;
          mix-blend-mode: screen;
        }

        .glitch-active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          animation: scanline-sweep 0.4s ease-in-out forwards;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
