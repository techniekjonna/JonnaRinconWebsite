import { Link } from 'react-router-dom';
import { ArrowRight, Music, Mail, Library, Briefcase } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useT, type TFn } from '../contexts/LanguageContext';

const getSections = (t: TFn) => [
  {
    id: 'beats',
    eyebrow: t('Beat Shop', 'Beat Shop'),
    title: t('Beats', 'Beats'),
    description: t(
      'Premium, ready-to-use beats built for artists. Browse the catalogue and license instantly.',
      'Premium, klaar-voor-gebruik beats gemaakt voor artiesten. Blader door de catalogus en licenseer direct.'
    ),
    icon: Music,
    image: '/DJI_20251017150728_0019_D.JPG',
    cta: t('Browse Beats', 'Bekijk Beats'),
    link: '/shop/beats',
  },
  {
    id: 'services',
    eyebrow: t('Studio Session · Mix & Master', 'Studiosessie · Mix & Master'),
    title: t('Services', 'Diensten'),
    description: t(
      'Professional production services tailored to your project — from studio sessions to mixing and mastering.',
      'Professionele productiediensten afgestemd op jouw project — van studiosessies tot mixen en masteren.'
    ),
    icon: Briefcase,
    image: '/DJI_20251115114029_0004_D.JPG',
    cta: t('View Services', 'Bekijk Diensten'),
    link: '/shop/services',
  },
  {
    id: 'music',
    eyebrow: t('Catalogue', 'Catalogus'),
    title: t('Music', 'Muziek'),
    description: t(
      'Explore the full catalogue — tracks, remixes and DJ sets, all in one place.',
      'Verken de volledige catalogus — tracks, remixes en dj-sets, allemaal op één plek.'
    ),
    icon: Library,
    image: '/DJ Screenshot 3-2-26.png',
    cta: t('Explore Music', 'Verken Muziek'),
    link: '/catalogue',
  },
  {
    id: 'contact',
    eyebrow: t('Get In Touch', 'Neem Contact Op'),
    title: t('Contact Me', 'Contact'),
    description: t(
      'Got a project, collab or question? Reach out directly — bookings, business or just to say hi.',
      'Heb je een project, samenwerking of vraag? Neem direct contact op — boekingen, zakelijk of gewoon om te zeggen hoi.'
    ),
    icon: Mail,
    image: '/IMG_1027.jpg',
    cta: t('Contact Me', 'Contact'),
    link: '/contact',
  },
];

type Section = ReturnType<typeof getSections>[number];

function SectionRow({ section, reverse }: { section: Section; reverse: boolean }) {
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

      {/* Image — kept in color, darkened with a soft radial mask (tuned
          for the 4:3 box so top/bottom fade as gradually as left/right)
          so it blends into the page instead of sitting in a hard box */}
      <div className={`relative aspect-[4/3] ${reverse ? 'lg:order-1' : ''}`}>
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'radial-gradient(ellipse 52% 70% at 50% 45%, black 8%, transparent 96%)',
            WebkitMaskImage: 'radial-gradient(ellipse 52% 70% at 50% 45%, black 8%, transparent 96%)',
          }}
        >
          <img
            src={section.image}
            alt={section.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            style={{ filter: 'contrast(1.1) brightness(0.7)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black/50" />
        </div>
      </div>
    </div>
  );
}

export default function SectionCards() {
  const t = useT();
  const sections = getSections(t);
  return (
    <section className="relative z-20 py-12 md:py-20 px-4">
      <div className="max-w-7xl mx-auto mb-12 md:mb-16 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-white/30 text-xs uppercase tracking-widest">{t('Explore', 'Verkennen')}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-16 md:gap-24">
        {sections.map((section, i) => (
          <SectionRow key={section.id} section={section} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
