import { Link } from 'react-router-dom';
import { ArrowRight, Music, Mail, Library, Briefcase } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const SECTIONS = [
  {
    id: 'beats',
    eyebrow: 'Beat Shop',
    title: 'Beats',
    description: 'Premium, ready-to-use beats built for artists. Browse the catalogue and license instantly.',
    icon: Music,
    image: '/DJI_20251017150728_0019_D.JPG',
    cta: 'Browse Beats',
    link: '/shop/beats',
  },
  {
    id: 'services',
    eyebrow: 'Studio Session · Mix & Master',
    title: 'Services',
    description: 'Professional production services tailored to your project — from studio sessions to mixing and mastering.',
    icon: Briefcase,
    image: '/DJI_20251115114029_0004_D.JPG',
    cta: 'View Services',
    link: '/shop/services',
  },
  {
    id: 'music',
    eyebrow: 'Catalogue',
    title: 'Music',
    description: "Explore the full catalogue — tracks, remixes and DJ sets, all in one place.",
    icon: Library,
    image: '/DJ Screenshot 3-2-26.png',
    cta: 'Explore Music',
    link: '/catalogue',
  },
  {
    id: 'contact',
    eyebrow: 'Get In Touch',
    title: 'Contact Me',
    description: 'Got a project, collab or question? Reach out directly — bookings, business or just to say hi.',
    icon: Mail,
    image: '/IMG_1027.jpg',
    cta: 'Contact Me',
    link: '/contact',
  },
];

function SectionRow({ section, reverse }: { section: typeof SECTIONS[number]; reverse: boolean }) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const Icon = section.icon;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Text */}
      <div className={reverse ? 'lg:order-2' : ''}>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 mb-3 flex items-center gap-2">
          <Icon size={13} />
          {section.eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-5 leading-tight">
          {section.title}
        </h2>
        <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md">
          {section.description}
        </p>
        <Link
          to={section.link}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-full"
        >
          {section.cta}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Image */}
      <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 ${reverse ? 'lg:order-1' : ''}`}>
        <img
          src={section.image}
          alt={section.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  );
}

export default function SectionCards() {
  return (
    <section className="relative z-20 py-12 md:py-20 px-4">
      <div className="max-w-7xl mx-auto mb-12 md:mb-16 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-white/30 text-xs uppercase tracking-widest">Explore</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-16 md:gap-24">
        {SECTIONS.map((section, i) => (
          <SectionRow key={section.id} section={section} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
