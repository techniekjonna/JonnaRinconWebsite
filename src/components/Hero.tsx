import { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { hasHomeIntroPlayed } from '../lib/homeIntroState';
import { useT } from '../contexts/LanguageContext';

export default function Hero() {
  const navigate = useNavigate();
  const t = useT();
  // On a first load the text stays hidden while the loading screen is up
  // and fades in right after it is gone (fallback after 4 s so it never
  // stays hidden). When navigating back to "/" it shows straight away.
  const [animate] = useState(!hasHomeIntroPlayed());
  const [ready, setReady] = useState<boolean>(
    () => !animate || !!(window as unknown as { __pageLoaderDone?: boolean }).__pageLoaderDone
  );

  useEffect(() => {
    if (ready) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const show = () => { t = setTimeout(() => setReady(true), 150); };
    window.addEventListener('page-loader-done', show);
    const fallback = setTimeout(() => setReady(true), 4000);
    return () => {
      window.removeEventListener('page-loader-done', show);
      clearTimeout(fallback);
      if (t) clearTimeout(t);
    };
  }, [ready]);

  return (
    <section
      data-no-fade
      className="relative w-full flex flex-col items-center justify-center"
      style={{ minHeight: '68vh' }}
    >
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto ${animate ? (ready ? 'hero-in' : 'opacity-0') : ''}`}
      >
        {/* Headline */}
        <h2 className="text-white font-black uppercase tracking-tighter leading-[0.95] mb-5" style={{ fontSize: 'clamp(2.4rem, 8vw, 5.5rem)' }}>
          {t('Beats that hit.', 'Beats die raken.')}<br />
          <span className="block text-red-600 whitespace-nowrap mt-1" style={{ fontSize: 'clamp(1.05rem, 4.4vw, 2.6rem)' }}>Prod by Jonna Rincon</span>
        </h2>

        {/* Subtitle */}
        <p className="text-white/50 text-sm md:text-lg uppercase tracking-widest mb-2">
          {t('Music Producer', 'Muziekproducent')} <span className="text-white/25">|</span> {t('Audio Engineer', 'Audio-engineer')}
        </p>

        {/* Studio session */}
        <div className="mb-8">
          <Link to="/studio-session" className="group flex flex-wrap items-center justify-center gap-x-2 min-h-[44px] px-2">
            <span className="text-white/35 text-xs uppercase tracking-widest group-hover:text-red-500 transition-colors duration-300">
              {t('Studio session with Jonna?', 'Studiosessie met Jonna?')}
            </span>
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest group-hover:text-white group-hover:[text-shadow:0_0_12px_rgba(255,255,255,0.6)] transition-all duration-300">
              {t('Book here', 'Boek hier')} →
            </span>
          </Link>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Shop Beats button */}
          <button
            onClick={() => navigate('/shop/beats')}
            className="flex items-center justify-center py-3.5 bg-red-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
            style={{ width: '220px', paddingLeft: '20px', paddingRight: '12px' }}
          >
            <span className="flex-1 text-center whitespace-nowrap">{t('Shop Beats', 'Shop Beats')}</span>
            <ArrowRight size={16} className="flex-shrink-0 ml-2" />
          </button>

          {/* Services */}
          <button
            onClick={() => navigate('/shop/services')}
            className="flex items-center justify-center gap-2 py-3.5 bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm rounded-xl"
            style={{ width: '220px' }}
          >
            <Briefcase size={16} className="flex-shrink-0" />
            {t('Services', 'Diensten')}
          </button>
        </div>

        {/* Contact */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate('/contact')}
            className="flex items-center gap-2 px-6 min-h-[44px] border border-white/20 text-white/70 font-bold text-xs uppercase tracking-widest hover:text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 rounded-full"
          >
            <Mail size={14} className="flex-shrink-0" />
            {t('Contact', 'Contact')}
          </button>

        </div>
      </div>
    </section>
  );
}
