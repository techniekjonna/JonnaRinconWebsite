import { useEffect, useRef, useCallback, useState } from 'react';

const TARGET_TEXT = 'JONNA RINCON';
const GLYPHS = '!@#$%^&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function useCyberDecode(text: string, startDelay = 300) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let lockedCount = 0;
    let interval: ReturnType<typeof setInterval>;
    let tickCount = 0;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        tickCount++;

        // Lock next character every 5 ticks (~150ms at 30ms interval) - slower decode
        if (tickCount % 5 === 0 && lockedCount < text.length) {
          lockedCount++;
        }

        // Build display string
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

export default function Hero() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { display, done } = useCyberDecode(TARGET_TEXT);

  const handleScroll = useCallback(() => {
    if (!overlayRef.current) return;

    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const totalHeight = document.documentElement.scrollHeight - windowHeight;
    const scrollPercent = totalHeight > 0 ? (scrollPosition / totalHeight) * 100 : 0;

    // Blur only kicks in after 70% scroll
    const blur = pagePercent > 70 ? Math.min(((pagePercent - 70) / 30) * 10, 10) : 0;

    // Direct DOM update — no React re-render
    if (overlayRef.current) {
      overlayRef.current.style.opacity = String(opacity);
      overlayRef.current.style.backdropFilter = `blur(${blur}px)`;
      overlayRef.current.style.webkitBackdropFilter = `blur(${blur}px)`;
    }
    if (gradientRef.current) {
      gradientRef.current.style.opacity = String(Math.min(opacity, 0.8));
    }
    // Keep image always visible — background for entire site
    if (imgRef.current) {
      imgRef.current.style.opacity = '1';
    }
  }, [overlayRef, gradientRef, imgRef]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center">
      {/* Fullscreen Background Image - FIXED */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img
          ref={imgRef}
          src="/JEIGHTENESIS.jpg"
          alt="Jonna Rincon"
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{objectPosition: 'center'}}
        />
        {/* Dynamische Overlay - wordt donkerder + blurred bij scrollen */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black"
          style={{ opacity: 0, transition: 'opacity 0.2s ease-out', WebkitTransition: 'opacity 0.2s ease-out' }}
        ></div>
        <div
          ref={gradientRef}
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"
          style={{ opacity: 0, transition: 'opacity 0.2s ease-out', WebkitTransition: 'opacity 0.2s ease-out' }}
        ></div>
      </div>

      {/* Content — titel gecentreerd, buttons onderaan (onder de pet) */}
      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center px-6">
        {/* JONNA RINCON — cyber decode animatie */}
        <h1
          className="text-white font-black uppercase leading-none tracking-tighter text-center select-none"
          style={{
            fontSize: 'clamp(2.6rem, 10.2vw, 10.2rem)',
            fontFamily: 'inherit',
            minHeight: '1.1em',
          }}
        >
          {display || '\u00A0'}
        </h1>

        {/* Buttons — absoluut gepositioneerd onderaan het scherm, onder de pet */}
        <div
          className="absolute bottom-32 md:bottom-40 flex flex-col sm:flex-row gap-3 transition-opacity duration-700"
          style={{ opacity: done ? 1 : 0 }}
        >
          <a
            href="/shop"
            className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
          >
            Browse Beats
          </a>
          <a
            href="#music"
            className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
          >
            Listen Now
          </a>
        </div>
      </div>
    </section>
  );
}
