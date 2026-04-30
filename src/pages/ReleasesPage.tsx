import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Play, Lock, ExternalLink, Disc3, Music, Download } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../contexts/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';

type ReleaseType = 'all' | 'album' | 'ep' | 'single';

interface Release {
  id: string;
  title: string;
  type: 'album' | 'ep' | 'single';
  year: number;
  cover: string;
  spotifyUrl: string;
  embedUrl: string;
  membersOnly?: boolean;
}

const releases: Release[] = [
  {
    id: 'jeightenesis',
    title: 'JEIGHTENESIS',
    type: 'album',
    year: 2025,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'jeighteen-ep',
    title: 'JEIGHTEEN EP',
    type: 'ep',
    year: 2024,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'wake-up',
    title: 'WAKE UP',
    type: 'single',
    year: 2025,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'listo',
    title: 'LISTO (MOVE MY BODY)',
    type: 'single',
    year: 2024,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'binne-ben',
    title: 'BINNE BEN',
    type: 'single',
    year: 2024,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'j18-lofi',
    title: 'J18 LOFI TRIP ON EARTH',
    type: 'album',
    year: 2023,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'chinaton',
    title: 'CHINATON',
    type: 'single',
    year: 2023,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'club-jeighteen',
    title: 'CLUB JEIGHTEEN',
    type: 'album',
    year: 2023,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
  {
    id: 'prod-by-jonna',
    title: 'PROD BY JONNA RINCON',
    type: 'album',
    year: 2022,
    cover: '/JEIGHTENESIS.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F',
    embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator',
  },
];

interface Remix {
  id: string;
  title: string;
  original: string;
  genre: string;
}

const remixes: Remix[] = [
  { id: 'remix-1', title: 'Remix Pack Vol. 1', original: 'Various Artists', genre: 'Moombahton' },
  { id: 'remix-2', title: 'Remix Pack Vol. 2', original: 'Various Artists', genre: 'Hip Hop' },
  { id: 'remix-3', title: 'Remix Pack Vol. 3', original: 'Various Artists', genre: 'EDM' },
  { id: 'remix-4', title: 'Bootleg Pack Vol. 1', original: 'Various Artists', genre: 'Trap' },
  { id: 'remix-5', title: 'Edit Pack Vol. 1', original: 'Various Artists', genre: 'R&B' },
  { id: 'remix-6', title: 'Moombahton Edits', original: 'Various Artists', genre: 'Moombahton' },
];

export default function ReleasesPage() {
  useScrollToTop();
  const [filter, setFilter] = useState<ReleaseType>('all');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const { user } = useAuth();
  const heroTitle = useCyberDecodeInView('Releases');

  const filteredReleases = filter === 'all' ? releases : releases.filter(r => r.type === filter);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'album': return 'Album';
      case 'ep': return 'EP';
      case 'single': return 'Single';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 md:pb-24 pt-40 px-6 md:px-12">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em] mb-4">Discography</p>
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} className="text-6xl md:text-[8rem] lg:text-[10rem] font-black uppercase leading-[0.85] tracking-tighter neon-glow">
            {heroTitle.display}
          </h1>
          <p className="text-white/30 text-sm md:text-base mt-6 max-w-lg">
            Albums, EPs, singles, and remix packs. Stream on Spotify or download exclusive edits.
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="sticky top-0 z-20 px-6 md:px-12 py-4 backdrop-blur-xl bg-black/40 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex gap-2">
          {(['all', 'album', 'ep', 'single'] as ReleaseType[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                filter === t ? 'bg-white text-black' : 'bg-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.10]'
              }`}
            >
              {t === 'all' ? 'All' : t === 'ep' ? 'EPs' : t === 'album' ? 'Albums' : 'Singles'}
            </button>
          ))}
        </div>
      </section>

      {/* Releases Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredReleases.map(release => (
              <button
                key={release.id}
                onClick={() => setSelectedRelease(release)}
                className="group text-left cursor-pointer"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
                  <img src={release.cover} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white/70">
                      {typeLabel(release.type)}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm md:text-base font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight truncate">
                  {release.title}
                </h3>
                <p className="text-[10px] text-white/25 uppercase tracking-wider">{release.year}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Release Modal */}
      {selectedRelease && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]" onClick={() => setSelectedRelease(null)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="text-[10px] text-red-500/60 uppercase tracking-widest font-bold">{typeLabel(selectedRelease.type)} — {selectedRelease.year}</span>
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mt-1">{selectedRelease.title}</h2>
                  </div>
                  <button onClick={() => setSelectedRelease(null)} className="p-2 rounded-full hover:bg-white/10 transition-all text-white/40 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden mb-6">
                  <iframe
                    style={{ borderRadius: '16px' }}
                    src={selectedRelease.embedUrl}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>

                <a
                  href={selectedRelease.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-block text-center py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02]"
                >
                  Open in Spotify
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Remixes & Edits Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Remixes & Edits</h2>
              <p className="text-red-500/40 text-sm mt-2">Bootlegs, remixes, and exclusive edits — free download with follow gate</p>
            </div>
            <Disc3 size={28} className="text-red-500/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remixes.map(remix => (
              <Link
                key={remix.id}
                to={`/download/${remix.id}`}
                className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-red-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-red-600/10 border border-red-600/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-red-400">
                    {remix.genre}
                  </span>
                  <Download size={16} className="text-white/20 group-hover:text-red-400 transition-colors" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">{remix.title}</h3>
                <p className="text-white/30 text-xs mt-1">{remix.original}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-wider font-bold">
                  <Lock size={10} />
                  Follow to unlock download
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Members-Only Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Members Only</h2>
              <p className="text-red-500/40 text-sm mt-2">Exclusive tracks for registered members</p>
            </div>
            <Lock size={24} className="text-white/10" />
          </div>

          {/* Tracks visible to everyone, playback locked for non-members */}
          <div className="space-y-2">
            {['Unreleased Beat Pack #1', 'Studio Session — Raw Recordings', 'Exclusive Moombahton Mix', 'Behind the Scenes — JEIGHTENESIS', 'Early Demos Collection'].map((title, i) => (
              <div
                key={i}
                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  user
                    ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] cursor-pointer'
                    : 'bg-white/[0.02] border-white/[0.04]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  user ? 'bg-red-600/20' : 'bg-white/[0.04]'
                }`}>
                  {user ? (
                    <Play size={16} className="text-red-400 ml-0.5" fill="currentColor" />
                  ) : (
                    <Lock size={14} className="text-white/15" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${user ? 'text-white' : 'text-white/30'}`}>{title}</p>
                  <p className="text-[10px] text-white/20">Jonna Rincon</p>
                </div>
                {!user && (
                  <Link
                    to="/register"
                    className="flex-shrink-0 px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-[10px] font-bold text-white/40 uppercase tracking-wider hover:bg-white/10 hover:text-white/60 transition-all"
                  >
                    Sign up to play
                  </Link>
                )}
                {user && (
                  <span className="text-[10px] text-white/20">3:24</span>
                )}
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-8 text-center">
              <div className="inline-flex flex-col items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-8 py-6">
                <Lock size={20} className="text-white/20" />
                <p className="text-white/40 text-sm font-bold">Create a free account to unlock playback</p>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all hover:scale-105"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Want a Custom Beat?</h2>
          <p className="text-white/30 text-sm md:text-base mb-8 max-w-md mx-auto">
            Browse the beat shop or get in touch for custom productions
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop/beats" className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-white/90 transition-all hover:scale-105 rounded-2xl">
              Beat Shop
            </Link>
            <Link to="/contact" className="px-8 py-3.5 bg-white/[0.06] border border-white/[0.08] text-white font-bold text-sm uppercase tracking-widest hover:bg-white/[0.10] transition-all hover:scale-105 rounded-2xl">
              Contact
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
