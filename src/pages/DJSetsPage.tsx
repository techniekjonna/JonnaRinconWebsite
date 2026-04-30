import React, { useState } from 'react';
import { Music, Headphones, Radio } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface DJSet {
  id: string;
  title: string;
  description: string;
  image: string;
  date?: string;
  duration?: string;
  type: string;
}

const DJSetsPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('DJ SETS');

  const djSets: DJSet[] = [
    {
      id: 'djset-1',
      title: 'Live Festival Mix',
      description: 'High-energy festival set blending moombahton, hip hop, and EDM',
      image: 'DJI_20251017150728_0019_D.JPG',
      type: 'Live Performance',
      duration: '45 mins',
    },
    {
      id: 'djset-2',
      title: 'Studio Session #1',
      description: 'Intimate studio recording showcasing production techniques',
      image: 'DJI_20251017150728_0019_D.JPG',
      type: 'Studio Session',
      duration: '60 mins',
    },
    {
      id: 'djset-3',
      title: 'Late Night Vibes',
      description: 'Smooth downtempo and R&B influenced DJ set',
      image: 'DJI_20251017150728_0019_D.JPG',
      type: 'Late Night',
      duration: '90 mins',
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
            Live mixes, festival recordings, and studio sessions
          </p>
        </div>
      </section>

      {/* YouTube Playlist Embed */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-12">
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 z-10 transition-opacity duration-500 group-[.playing]:opacity-0 group-[.playing]:pointer-events-none">
                <img src="DJI_20251017150728_0019_D.JPG" alt="DJ Set thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <iframe
                width="100%"
                height="500"
                src="https://www.youtube.com/embed/videoseries?si=-lcpC5aW0SSgSOXa&list=PLgWPe6V88vwBmK5X5WCsj5kvvCb4IXjkM"
                title="DJ Sets"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ borderRadius: '16px' }}
              />
            </div>

            <a
              href="https://youtube.com/playlist?list=PLgWPe6V88vwBmK5X5WCsj5kvvCb4IXjkM"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-block text-center py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02]"
            >
              Watch All DJ Sets on YouTube
            </a>
          </div>

          {/* DJ Set Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
              <Radio size={24} className="text-red-500 mb-3" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">Live Mixing</h3>
              <p className="text-white/30 text-sm">
                Real-time DJ performances blending moombahton, hip hop, EDM, and more into seamless sets.
              </p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
              <Music size={24} className="text-red-500 mb-3" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">Multi-Genre</h3>
              <p className="text-white/30 text-sm">
                From moombahton to trap, from R&B to house — every set is a journey through different worlds of sound.
              </p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
              <Headphones size={24} className="text-red-500 mb-3" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">Studio Sessions</h3>
              <p className="text-white/30 text-sm">
                Intimate studio recordings and production walkthroughs showing the creative process behind the music.
              </p>
            </div>
          </div>

          {/* DJ Set Cards Grid */}
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-12">Featured Sets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {djSets.map((set, index) => (
                <div
                  key={set.id}
                  className="group"
                  style={{
                    animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + index * 0.08}s both`,
                  }}
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] mb-4">
                    <img src={set.image} alt={set.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors mb-2">{set.title}</h3>
                  <p className="text-sm text-white/50 mb-3">{set.description}</p>
                  <div className="flex items-center justify-between text-xs text-white/30 uppercase tracking-wider">
                    <span>{set.type}</span>
                    <span>{set.duration}</span>
                  </div>
                </div>
              ))}
            </div>
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

export default DJSetsPage;
