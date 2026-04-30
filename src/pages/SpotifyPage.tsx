import React, { useState } from 'react';
import { Music2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Compilation {
  id: string;
  name: string;
  url: string;
  cover: string;
  type: string;
}

interface SpotifyPlaylist {
  name: string;
  embedUrl: string;
}

const SpotifyPage: React.FC = () => {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('SPOTIFY');
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  const compilations: Compilation[] = [
    { id: 'this-is', name: 'This Is Jonna Rincon', url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO3LPWh3', cover: 'ThisIsJonna.png', type: 'Playlist' },
    { id: 'mix-master', name: 'Mix & Master', url: 'https://open.spotify.com/playlist/5smfHiU4egb6uyHYzgmqdC', cover: 'MixedBy.png', type: 'Production' },
    { id: 'moombahton', name: 'Moombah Time', url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO3LPWh3', cover: 'MoombahTime.png', type: 'Genre' },
  ];

  const spotifyPlaylists: SpotifyPlaylist[] = [
    {
      name: 'This Is Jonna Rincon',
      embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO3LPWh3?utm_source=generator',
    },
    {
      name: 'Mix & Master',
      embedUrl: 'https://open.spotify.com/embed/playlist/5smfHiU4egb6uyHYzgmqdC?utm_source=generator',
    },
    {
      name: 'Moombah Time',
      embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO3LPWh3?utm_source=generator',
    },
  ];

  const handleNextPlaylist = () => {
    setCurrentPlaylist((prev) => (prev + 1) % spotifyPlaylists.length);
  };

  const handlePrevPlaylist = () => {
    setCurrentPlaylist((prev) => (prev - 1 + spotifyPlaylists.length) % spotifyPlaylists.length);
  };

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
            Stream on all platforms and discover all music
          </p>
        </div>
      </section>

      {/* Streaming Links */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <a
              href="https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300"
            >
              <Music2 size={32} className="mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-1">Spotify</h3>
              <p className="text-xs text-white/50">Listen Now</p>
            </a>
            <a
              href="https://www.youtube.com/jonnarincon"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300"
            >
              <Music2 size={32} className="mx-auto mb-3 text-red-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-1">YouTube</h3>
              <p className="text-xs text-white/50">Watch Videos</p>
            </a>
            <a
              href="https://soundcloud.com/jonnarincon"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300"
            >
              <Music2 size={32} className="mx-auto mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-1">SoundCloud</h3>
              <p className="text-xs text-white/50">Full Catalog</p>
            </a>
            <a
              href="https://www.instagram.com/jonnarincon/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center hover:border-white/[0.15] hover:bg-white/[0.08] transition-all duration-300"
            >
              <Music2 size={32} className="mx-auto mb-3 text-pink-500 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-white mb-1">Instagram</h3>
              <p className="text-xs text-white/50">Follow</p>
            </a>
          </div>
        </div>
      </section>

      {/* Playlists Grid */}
      <section className="px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-12">Featured Playlists</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-16">
            {compilations.map((comp) => (
              <a
                key={comp.id}
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
                  <img src={comp.cover} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Play size={20} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">{comp.name}</h3>
                <p className="text-[10px] text-white/25 uppercase tracking-wider">{comp.type}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Full Spotify Player with Arrows */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <p className="text-lg font-bold text-white">{spotifyPlaylists[currentPlaylist].name}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevPlaylist}
                  className="p-2.5 rounded-full border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all duration-300"
                  title="Previous playlist"
                >
                  <ChevronLeft className="w-5 h-5 text-white/60" />
                </button>
                <span className="text-xs text-white/40 min-w-[50px] text-center">
                  {currentPlaylist + 1} / {spotifyPlaylists.length}
                </span>
                <button
                  onClick={handleNextPlaylist}
                  className="p-2.5 rounded-full border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all duration-300"
                  title="Next playlist"
                >
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ height: '480px' }}>
              <iframe
                style={{ borderRadius: '16px' }}
                src={spotifyPlaylists[currentPlaylist].embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">1M+</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Spotify Streams</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">100K+</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">YouTube Views</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
              <p className="text-3xl font-black text-red-500 mb-2">10+</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Years Producing</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SpotifyPage;
