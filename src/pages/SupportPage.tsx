import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface SupportMention {
  name: string;
  description: string;
  type: string;
}

const SupportPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('SUPPORT');
  const [selectedType, setSelectedType] = useState<string>('All');

  const supportMentions: SupportMention[] = [
    { name: 'MTV', description: 'Featured multiple times on MTV platforms', type: 'Media' },
    { name: 'Qlas & Blacka', description: 'Support from one of the biggest Dutch rap duos', type: 'Artist' },
    { name: 'Sidney Schmeltz', description: 'Recognized by the renowned DJ & producer', type: 'Artist' },
    { name: 'Servinio', description: 'Support from the Dutch rap & R&B artist', type: 'Artist' },
    { name: 'Xony', description: 'Co-sign from the collective and producer', type: 'Artist' },
    { name: 'Scarface', description: 'Recognized by the crew', type: 'Artist' },
    { name: 'Jared', description: 'Known for his viral house hit — track support', type: 'Artist' },
    { name: 'Blockparty', description: 'Support from the Dutch collective', type: 'Artist' },
    { name: 'Johnny Sellah', description: 'Recognized by the Dutch rap heavyweight', type: 'Artist' },
    { name: 'Makkie', description: 'Support from the Amsterdam rap legend', type: 'Artist' },
    { name: 'Justice Toch', description: 'Support from the producer and engineer', type: 'Artist' },
    { name: 'Jerrih', description: 'Collaboration and track support', type: 'Artist' },
    { name: 'Dreyh', description: 'Recognized for production collaboration', type: 'Artist' },
    { name: 'MC MC', description: 'Support from the Dutch rapper', type: 'Artist' },
    { name: 'Firme Firma', description: 'Co-sign from the collective', type: 'Artist' },
    { name: 'Broertje', description: 'Collaboration and support', type: 'Artist' },
    { name: 'Merdan D', description: 'Recognized by the producer and artist', type: 'Artist' },
    { name: 'De Formule', description: 'Support from the crew', type: 'Artist' },
    { name: 'LV (Lucas Verse)', description: 'Collaboration on multiple tracks', type: 'Artist' },
    { name: 'Pearl Ramos', description: 'Feature and vocal support', type: 'Artist' },
    { name: 'BUR Savants', description: 'Support from the collective', type: 'Artist' },
    { name: 'Jacq B.', description: 'Collaboration on production', type: 'Artist' },
    { name: 'Jong Dios (Boozy)', description: 'Track support and collaboration', type: 'Artist' },
    { name: 'Carli', description: 'Support and collaboration', type: 'Artist' },
    { name: 'SCHETS', description: 'Recognized by the artist', type: 'Artist' },
  ];

  const filterOptions = ['All', 'Artist', 'Media'];

  const filteredMentions =
    selectedType === 'All' ? supportMentions : supportMentions.filter((mention) => mention.type === selectedType);

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
            Artist support, collaborations, and community features
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="px-6 md:px-12 py-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {filterOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedType(option)}
                className={`px-6 py-2.5 rounded-full font-semibold uppercase tracking-wider text-sm transition-all duration-300 ${
                  selectedType === option
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                    : 'bg-white/[0.06] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.12]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Support Mentions Grid */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-12">Featured Support</h2>

          {filteredMentions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentions.map((mention, index) => (
                <div
                  key={mention.name}
                  className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300 hover:bg-white/[0.06]"
                  style={{
                    animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + index * 0.05}s both`,
                  }}
                >
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-600/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-black text-white mb-2 group-hover:text-red-400 transition-colors">{mention.name}</h3>
                  <p className="text-sm text-white/50 mb-4 group-hover:text-white/70 transition-colors">{mention.description}</p>

                  {/* Type Badge */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
                      {mention.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-white/60">No support mentions found for this filter</p>
            </div>
          )}

          {/* Footer Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">{supportMentions.length}+</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Artists & Labels</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">
                {supportMentions.filter((m) => m.type === 'Artist').length}+
              </p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Artist Co-Signs</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">
                {supportMentions.filter((m) => m.type === 'Media').length}+
              </p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Media Features</p>
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

export default SupportPage;
