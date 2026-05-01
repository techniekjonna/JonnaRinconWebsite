import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

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
        if (tickCount % 5 === 0 && lockedCount < text.length) lockedCount++;

        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < lockedCount) result += text[i];
          else if (text[i] === ' ') result += ' ';
          else result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setDisplay(result);

        if (lockedCount >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, 30);
    }, startDelay);

    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, startDelay]);

  return { display, done };
}

export default function Hero() {
  const imgRef = useRef<HTMLImageElement>(null);
  const { display, done } = useCyberDecode(TARGET_TEXT);

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img
          ref={imgRef}
          src="/JEIGHTENESIS.jpg"
          alt="Jonna Rincon"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Hero Content — centered */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div
          className="mb-6 px-4 py-1.5 border border-white/20 rounded-full text-xs uppercase tracking-widest text-white/50 transition-opacity duration-700"
          style={{ opacity: done ? 1 : 0 }}
        >
          Artist · Producer · DJ · Sound Engineer
        </div>

        {/* Name */}
        <h1
          className="text-white font-black uppercase leading-none tracking-tighter select-none"
          style={{ fontSize: 'clamp(3.5rem, 12vw, 9rem)', minHeight: '1.1em' }}
        >
          {display || ' '}
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/50 text-base md:text-lg uppercase tracking-widest mt-4 transition-opacity duration-700"
          style={{ opacity: done ? 1 : 0 }}
        >
          Your soon to be favourite artist
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col sm:flex-row gap-3 transition-opacity duration-700"
          style={{ opacity: done ? 1 : 0 }}
        >
          <a
            href="/shop"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Browse Beats
            <ArrowRight size={16} />
          </a>
          <a
            href="/catalogue"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            <Play size={16} />
            Listen Now
          </a>
          <a
            href="/contact"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            Contact
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-700"
        style={{ opacity: done ? 0.4 : 0 }}
      >
        <span className="text-white/40 text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-white/20 animate-pulse" />
      </div>
    </section>
  );
}
