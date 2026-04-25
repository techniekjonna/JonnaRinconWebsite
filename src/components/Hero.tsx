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
  const imgRef = useRef<HTMLImageElement>(null);
  const { display, done } = useCyberDecode(TARGET_TEXT);

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
        {/* Static Overlay - 70% like other public pages */}
        <div className="absolute inset-0 bg-black/70" />
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

        {/* Buttons — absoluut gepositioneerd onder het scherm, hoger geplaatst */}
        <div
          className="absolute bottom-40 md:bottom-48 flex flex-col sm:flex-row gap-3 transition-opacity duration-700 flex-wrap justify-center"
          style={{ opacity: done ? 1 : 0 }}
        >
          <a
            href="/shop"
            className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
          >
            SHOP
          </a>
          <a
            href="/my-tracks"
            className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
          >
            Listen Now
          </a>
          <a
            href="/contact"
            className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 text-center min-w-[180px]"
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
