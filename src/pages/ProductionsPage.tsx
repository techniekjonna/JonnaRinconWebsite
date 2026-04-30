import React from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { Play } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Production {
  id: string;
  title: string;
  description: string;
  artist: string;
  genre: string;
  image: string;
  type: string;
}

const ProductionsPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('PRODUCTIONS');

  const productions: Production[] = [
    {
      id: 'prod-1',
      title: 'Mixed & Mastered Beats',
      description: 'Full production and audio engineering for collaborative projects',
      artist: 'Various Artists',
      genre: 'Multi-Genre',
      image: 'MixedBy.png',
      type: 'Audio Engineering',
    },
    {
      id: 'prod-2',
      title: 'Original Instrumentals',
      description: 'Exclusive beats and instrumentals available for collaboration',
      artist: 'Jonna Rincon',
      genre: 'EDM / Hip Hop',
      image: 'ThisIsJonna.png',
      type: 'Beatmaking',
    },
    {
      id: 'prod-3',
      title: 'Collaborative Projects',
      description: 'Co-production work with other artists and producers',
      artist: 'Collaboration',
      genre: 'Multiple',
      image: 'MoombahTime.png',
      type: 'Co-Production',
    },
  ];

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} />

      {/* Hero Section */}
      <section className="relative pt-40 px-6 md:px-12 pb-16">
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <h1
            ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
            style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8"
          >
            {heroTitle.display}
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
            Production work, beat collaborations, and creative projects
          </p>
        </div>
      </section>

      {/* Featured Playlist */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-12">Mixed & Mastered</h2>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-16">
            <div className="rounded-2xl overflow-hidden relative">
              <iframe
                style={{ borderRadius: '16px' }}
                src="https://open.spotify.com/embed/playlist/5smfHiU4egb6uyHYzgmqdC?utm_source=generator"
                width="100%"
                height="400"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>

          {/* Production Process */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">The Process</h3>
              <p className="text-white/30 text-sm leading-relaxed">
                Every track starts in FL Studio — the DAW where it all began over 10 years ago. From the first beat to the final master,
                every step is handled in-house. Self-made cover arts, self-mixed, self-mastered. Full creative control from start to finish.
              </p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">Genres & Styles</h3>
              <div className="flex flex-wrap gap-2">
                {['Moombahton', 'Hip Hop', 'R&B', 'Trap', 'EDM', 'Lo-Fi', 'House', 'Drill', 'Afrobeats', 'Reggaeton', 'Pop', 'Latin'].map((genre) => (
                  <span key={genre} className="px-3 py-1.5 bg-white/[0.06] rounded-full text-xs font-bold text-white/50 uppercase tracking-wider">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Production Cards Grid */}
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-12">Featured Productions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productions.map((prod, index) => (
              <div
                key={prod.id}
                className="group"
                style={{
                  animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + index * 0.08}s both`,
                }}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] mb-4">
                  <img src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                      <Play size={24} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors mb-2">{prod.title}</h3>
                <p className="text-sm text-white/50 mb-4">{prod.description}</p>
                <div className="flex items-center justify-between text-xs text-white/30 uppercase tracking-wider">
                  <span>{prod.type}</span>
                  <span>{prod.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProductionsPage;
