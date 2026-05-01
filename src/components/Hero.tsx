import { useEffect, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative w-full flex flex-col items-center justify-center"
      style={{ minHeight: '68vh' }}
    >
      {/* Background */}
      <div className="fixed inset-0 w-full h-screen -z-10">
        <img
          src="/JEIGHTENESIS.jpg"
          alt="Jonna Rincon"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto transition-opacity duration-700"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Badge */}
        <div className="mb-5 px-4 py-1.5 border border-white/20 rounded-full text-xs uppercase tracking-widest text-white/50">
          Artist · Producer · DJ · Sound Engineer
        </div>

        {/* Subtitle */}
        <p className="text-white/50 text-base md:text-lg uppercase tracking-widest mb-10">
          Your soon to be favourite artist
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
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
    </section>
  );
}
