import { useEffect, useState } from 'react';
import { ArrowRight, Play, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hasHomeIntroPlayed } from '../lib/homeIntroState';

export default function Hero() {
  const navigate = useNavigate();
  // Delayed so background is fully visible before content appears (intro animation) —
  // only on a real first load, not when navigating back to "/" mid-session
  const [visible, setVisible] = useState(hasHomeIntroPlayed());

  useEffect(() => {
    if (hasHomeIntroPlayed()) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center"
      style={{ minHeight: '68vh' }}
    >
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Subtitle */}
        <p className="text-white/50 text-base md:text-lg uppercase tracking-widest mb-10">
          Music Producer <span className="text-white/25">|</span> Audio Engineer
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Shop button */}
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center justify-center py-3.5 bg-red-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
            style={{ width: '220px', paddingLeft: '20px', paddingRight: '12px' }}
          >
            <span className="flex-1 text-center whitespace-nowrap">Shop</span>
            <ArrowRight size={16} className="flex-shrink-0 ml-2" />
          </button>

          {/* Listen Now — static, no cycling */}
          <button
            onClick={() => navigate('/catalogue')}
            className="flex items-center justify-center gap-2 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm rounded-xl"
            style={{ width: '220px' }}
          >
            <Play size={16} className="flex-shrink-0" />
            Listen Now
          </button>
        </div>

        {/* Contact + studio session */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate('/contact')}
            className="flex items-center gap-2 px-6 py-2.5 border border-white/20 text-white/70 font-bold text-xs uppercase tracking-widest hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 rounded-full"
          >
            <Mail size={14} className="flex-shrink-0" />
            Contact
          </button>

          <a href="/studio-session" className="group flex items-center gap-2">
            <span className="text-white/35 text-xs uppercase tracking-widest group-hover:text-red-500 transition-colors duration-300">
              Studio session with Jonna?
            </span>
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white group-hover:[text-shadow:0_0_12px_rgba(255,255,255,0.6)] transition-all duration-300">
              Book here →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
