import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Instagram, Youtube, Music2, ExternalLink } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

const platforms = [
  {
    name: 'Instagram',
    handle: '@jonnarincon',
    icon: Instagram,
    url: 'https://www.instagram.com/jonnarincon/',
    gradient: 'from-purple-600 via-pink-500 to-orange-400',
    description: 'Behind the scenes, studio sessions, and daily life',
    stats: 'Photos & Reels',
  },
  {
    name: 'YouTube',
    handle: 'Jonna Rincon',
    icon: Youtube,
    url: 'https://www.youtube.com/jonnarincon',
    gradient: 'from-red-600 to-red-500',
    description: 'DJ sets, music videos, vlogs, and tutorials',
    stats: 'Videos & Sets',
  },
  {
    name: 'Spotify',
    handle: 'Jonna Rincon',
    icon: Music2,
    url: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    gradient: 'from-red-600 to-red-400',
    description: 'Stream all tracks, playlists, and collaborations',
    stats: 'All Releases',
  },
  {
    name: 'SoundCloud',
    handle: 'jonnarincon',
    icon: Music2,
    url: 'https://soundcloud.com/jonnarincon',
    gradient: 'from-orange-500 to-orange-400',
    description: 'Exclusive uploads, remixes, and unreleased tracks',
    stats: 'Exclusives',
  },
  {
    name: 'TikTok',
    handle: '@jonnarincon',
    icon: Music2,
    url: '#',
    gradient: 'from-cyan-400 via-black to-pink-500',
    description: 'Short-form content, beat previews, and trends',
    stats: 'Short Videos',
  },
  {
    name: 'Apple Music',
    handle: 'Jonna Rincon',
    icon: Music2,
    url: '#',
    gradient: 'from-pink-500 to-red-500',
    description: 'Stream in lossless audio quality',
    stats: 'Hi-Res Audio',
  },
];

export default function SocialsPage() {
  useScrollToTop();
  const [email, setEmail] = useState('');
  const heroTitle = useCyberDecodeInView('Socials');

  return (
    <div className="min-h-screen text-white">
      {/* Background is handled by BackgroundRenderer */}
<Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero Section - Centered Layout */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center">
            {heroTitle.display}
          </h1>

          {/* Description */}
          <p className="text-white/30 text-sm md:text-base text-center max-w-2xl mx-auto">
            Follow the journey across all platforms. Stay updated on new releases, behind the scenes, and exclusive content.
          </p>
        </div>
      </section>

      {/* Platforms Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-6 md:p-8 hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <ExternalLink size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
                  </div>

                  <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{platform.name}</h3>
                  <p className="text-white/30 text-xs mb-3">{platform.handle}</p>
                  <p className="text-white/20 text-sm leading-relaxed mb-4">{platform.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">{platform.stats}</span>
                    <span className="text-xs text-white/30 group-hover:text-red-400 transition-colors font-bold uppercase tracking-wider">
                      Follow
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">Stay in the Loop</h2>
            <p className="text-white/30 text-sm md:text-base mb-8 max-w-md mx-auto">
              Subscribe for early access to new beats, exclusive content, and special offers
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 rounded-2xl focus:outline-none focus:border-red-500/40 transition-all"
              />
              <button className="px-6 md:px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.03]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
