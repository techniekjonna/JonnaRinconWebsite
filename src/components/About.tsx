import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useInView } from '../hooks/useInView';

export default function About() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="about"
      className={`py-12 md:py-20 px-4 bg-transparent transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

        {/* Text */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3">Get To Know</p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
            Jonna Rincon
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-4">
            Jonathan, aka Jonna Rincon, was born in Maastricht and is now based in Tilburg. He started making
            music the moment he got his hands on FL Studio during a trip to visit family in the Dominican
            Republic — his first track, made together with his oldest nephew, is where it all began.
          </p>
          <p className="text-white/50 text-sm leading-relaxed mb-7">
            Known for a raw, authentic sound rooted in Moombahton, but just as comfortable across Hip Hop,
            R&amp;B, EDM and Lo-Fi. Over 10+ years in, Jonna keeps pushing the sound forward — working with
            artists worldwide while staying true to where it started.
          </p>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-full"
          >
            Full Story
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Photo — desaturated and darkened so it reads as part of the dark
            page rather than a pasted-in snapshot; edges fade out via mask
            instead of sitting in a hard rectangle */}
        <div className="relative aspect-[4/5] lg:aspect-square w-full">
          <div
            className="absolute inset-0"
            style={{
              maskImage: 'radial-gradient(ellipse 62% 62% at 55% 42%, black 8%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(ellipse 62% 62% at 55% 42%, black 8%, transparent 92%)',
            }}
          >
            <img
              src="/Maastricht Screenshot 15-12-25.png"
              alt="Jonna Rincon in Maastricht"
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(1) contrast(1.25) brightness(0.4)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-transparent to-black/50" />
          </div>
        </div>
      </div>
    </section>
  );
}
