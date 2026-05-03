import { Music, User, Library, Briefcase } from 'lucide-react';

const CARDS = [
  {
    id: 'beats',
    title: 'Beat Shop',
    description: 'Premium beats for artists',
    icon: Music,
    image: '/DJI_20251017150728_0019_D.JPG',
    link: '/shop',
  },
  {
    id: 'about',
    title: 'About',
    description: 'The story behind the music',
    icon: User,
    image: '/IMG_1027.jpg',
    link: '/about',
  },
  {
    id: 'catalogue',
    title: 'Catalogue',
    description: 'Tracks, remixes & DJ sets',
    icon: Library,
    image: '/DJ Screenshot 3-2-26.png',
    link: '/catalogue',
  },
  {
    id: 'services',
    title: 'Services',
    description: 'Studio Session, Mix Masters',
    icon: Briefcase,
    image: '/DJI_20251115114029_0004_D.JPG',
    link: '/shop/services',
  },
];

export default function SectionCards() {
  return (
    <section className="relative z-20 py-12 px-4">
      {/* Scroll indicator */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col items-center gap-1 opacity-40">
        <span className="text-white text-[10px] uppercase tracking-widest">Scroll</span>
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="animate-bounce">
          <path d="M8 0v16M1 9l7 9 7-9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Section header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-white/30 text-xs uppercase tracking-widest">Explore</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Cards grid — 4 columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <a
              key={card.id}
              href={card.link}
              className="group relative overflow-hidden aspect-square border border-white/10 hover:border-red-600/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(239,68,68,0.15)]"
              style={{ textDecoration: 'none' }}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                style={{ filter: 'grayscale(0.3)' }}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                <Icon className="w-8 h-8 text-red-500 mb-3 transition-all duration-300 group-hover:scale-110 group-hover:text-red-400" />
                <h3 className="text-white font-black uppercase tracking-wider text-xl transition-all duration-300 group-hover:text-red-400">
                  {card.title}
                </h3>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1 transition-all duration-300 group-hover:text-white/60 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>

    </section>
  );
}
