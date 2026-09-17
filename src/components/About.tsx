import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PhotoCarousel from './PhotoCarousel';
import { useInView } from '../hooks/useInView';

// Soft hyphen in filename — matches actual file on disk
const SCHERM_PREFIX = 'Scherm­afbeelding';

const PHOTOS = [
  { src: '/DJI_20251115114029_0004_D.JPG', alt: 'Jonna Rincon aerial' },
  { src: '/DJI_20251017150728_0019_D.JPG', alt: 'Jonna Rincon in the studio' },
  { src: `/${SCHERM_PREFIX} 2025-12-16 om 17.09.27.png`, alt: 'Jonna Rincon studio session' },
  { src: '/IMG_1027.jpg', alt: 'Jonna Rincon' },
  { src: '/Maastricht Screenshot 15-12-25.png', alt: 'Jonna Rincon in Maastricht' },
];

const SKILLS = ['Producer', 'Beatmaker', 'Artist', 'Audio Engineer', 'Mix & Master', 'Visual Designer', 'Web Developer'];

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

          <div className="flex flex-wrap gap-2 mb-8">
            {SKILLS.map((skill) => (
              <span
                key={skill}
                className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white/70 bg-white/[0.06] border border-white/[0.1] rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>

          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-full"
          >
            Full Story
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Photo carousel */}
        <PhotoCarousel photos={PHOTOS} />
      </div>
    </section>
  );
}
