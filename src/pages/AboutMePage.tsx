import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Lightbulb, Music2, Heart, Play, ChevronLeft, ChevronRight, Award, Headphones } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useScrollToTop } from '../hooks/useScrollToTop';

const tabs = [
  { id: 'productions', label: 'Productions', icon: Lightbulb },
  { id: 'streams', label: 'Streams', icon: Music2 },
  { id: 'community', label: 'Community', icon: Heart },
];

const spotifyPlaylists = [
  { name: 'Top Tracks', embedUrl: 'https://open.spotify.com/embed/artist/6o3BlWTeK4EKUyByo35y6F?utm_source=generator' },
  { name: 'Playlist 2', embedUrl: 'https://open.spotify.com/embed/playlist/5SaEeqVSV9vyLUvqsrrfJ7?utm_source=generator&theme=0' },
  { name: 'Playlist 3', embedUrl: 'https://open.spotify.com/embed/playlist/7mIjrYgNeQxVw2lBBsEDjE?utm_source=generator&theme=0' },
  { name: 'Playlist 4', embedUrl: 'https://open.spotify.com/embed/playlist/5smfHiU4egb6uyHYzgmqdC?utm_source=generator' },
  { name: 'This is Jonna Rincon', embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DZ06evO3LPWh3?utm_source=generator' },
];

const compilations = [
  { id: 'this-is', name: 'This Is Jonna Rincon', url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO3LPWh3', cover: 'ThisIsJonna.png', type: 'Playlist' },
  { id: 'dj-sets', name: 'DJ SETS', url: 'https://youtube.com/playlist?list=PLgWPe6V88vwBmK5X5WCsj5kvvCb4IXjkM', cover: 'TN-DJSet.jpg', type: 'Video Series' },
  { id: 'mix-master', name: 'Mix & Master', url: 'https://open.spotify.com/playlist/5smfHiU4egb6uyHYzgmqdC', cover: 'MixedBy.png', type: 'Production' },
  { id: 'moombahton', name: 'Moombah Time', url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO3LPWh3', cover: 'MoombahTime.png', type: 'Genre' },
  { id: 'vlogs', name: 'Vlogs', url: 'https://youtube.com/playlist?list=PLgWPe6V88vwAoxr8xVTv85989fwEe5a10', cover: 'Vlog Foto.png', type: 'Video Series' },
];

const supportMentions = [
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

const skills = [
  { title: 'Producer', desc: 'Creating and arranging full tracks from concept to completion' },
  { title: 'Beatmaker', desc: 'Crafting instrumentals and beats across all genres' },
  { title: 'Artist', desc: 'Writing, performing, and recording vocals — combining everything into a finished track' },
  { title: 'Audio Engineer', desc: 'The technical art of recording, editing, and processing audio to achieve professional sound quality' },
  { title: 'Mix & Master', desc: 'Balancing, EQ-ing, and finalizing tracks for distribution-ready quality' },
  { title: 'DJ', desc: 'Live mixing and performing sets across multiple genres' },
  { title: 'Visual Designer', desc: 'Self-made cover arts, video editing, and visual branding' },
  { title: 'Web Developer', desc: 'This website was designed and built by Jonna Rincon' },
];

export default function AboutMePage() {
  useScrollToTop();
  const heroTitle = useCyberDecodeInView('ABOUT ME');
  const [activeTab, setActiveTab] = useState('productions');
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  return (
    <div className="min-h-screen text-white">
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} />

      {/* Hero */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <h1
            ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
            style={{ fontSize: 'clamp(1.875rem, 8vw, 10.2rem)' }}
            className="font-black uppercase leading-[0.85] tracking-tighter mb-8"
          >
            {heroTitle.display}
          </h1>
        </div>
      </section>

      {/* Tab Bar */}
      <section className="px-6 md:px-12 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all border ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white border-red-500/50 shadow-lg shadow-red-600/20'
                      : 'bg-white/[0.06] text-white/60 border-white/[0.1] hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRODUCTIONS TAB ── */}
      {activeTab === 'productions' && (
        <section className="px-6 md:px-12 pt-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-6">Mixed & Mastered by Jonna Rincon</h3>
              <div className="rounded-2xl overflow-hidden">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-3">The Process</h3>
                <p className="text-white/30 text-sm leading-relaxed">
                  Every track starts in FL Studio — the DAW where it all began over 10 years ago. From the first beat to the final master,
                  every step is handled in-house. Self-made cover arts, self-mixed, self-mastered. Full creative control from start to finish.
                </p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-black uppercase tracking-tight mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {['Moombahton', 'Hip Hop', 'R&B', 'Trap', 'EDM', 'Lo-Fi', 'House', 'Drill', 'Afrobeats', 'Reggaeton', 'Pop', 'Latin'].map(genre => (
                    <span key={genre} className="px-3 py-1.5 bg-white/[0.06] rounded-full text-xs font-bold text-white/50 uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">What I Do</h2>
            <p className="text-white/25 text-sm mb-10">25 years old — making music since age 13-15 in FL Studio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map(skill => (
                <div key={skill.title} className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:bg-white/[0.06]">
                  <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">{skill.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STREAMS TAB ── */}
      {activeTab === 'streams' && (
        <section className="px-6 md:px-12 pt-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
              {compilations.map(comp => (
                <a key={comp.id} href={comp.url} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
                    <img src={comp.cover} alt={comp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{comp.name}</h3>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">{comp.type}</p>
                </a>
              ))}
            </div>

            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <p className="text-lg font-bold text-white">{spotifyPlaylists[currentPlaylist].name}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPlaylist(Math.max(0, currentPlaylist - 1))}
                    className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-all"
                    disabled={currentPlaylist === 0}
                  >
                    <ChevronLeft size={18} className={currentPlaylist === 0 ? 'text-white/10' : 'text-white/40'} />
                  </button>
                  <button
                    onClick={() => setCurrentPlaylist(Math.min(spotifyPlaylists.length - 1, currentPlaylist + 1))}
                    className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-all"
                    disabled={currentPlaylist === spotifyPlaylists.length - 1}
                  >
                    <ChevronRight size={18} className={currentPlaylist === spotifyPlaylists.length - 1 ? 'text-white/10' : 'text-white/40'} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-2">
                  {spotifyPlaylists.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPlaylist(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPlaylist ? 'bg-red-500 w-6' : 'bg-white/10 w-1.5 hover:bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden relative">
                {spotifyPlaylists.map((playlist, i) => (
                  <div key={i} className={`transition-opacity duration-500 ${i === currentPlaylist ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
                    <iframe
                      style={{ borderRadius: '16px' }}
                      src={playlist.embedUrl}
                      width="100%"
                      height="400"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <a
                href="https://open.spotify.com/artist/6o3BlWTeK4EKUyByo35y6F"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full inline-block text-center py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02]"
              >
                Open in Spotify
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── COMMUNITY TAB ── */}
      {activeTab === 'community' && (
        <section className="px-6 md:px-12 pt-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 backdrop-blur-md border border-red-500/20 rounded-3xl p-6 md:p-10 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Award size={28} className="text-red-400" />
                <h3 className="text-2xl font-black uppercase tracking-tight">MTV Featured</h3>
              </div>
              <p className="text-white/50 text-sm md:text-base leading-relaxed">
                Jonna Rincon has been featured on MTV multiple times — gaining international exposure
                and recognition for his unique sound and production style.
              </p>
            </div>

            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Artist Co-Signs & Support</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {supportMentions.filter(s => s.type === 'Artist').map(mention => (
                <div
                  key={mention.name}
                  className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center">
                      <span className="text-xs font-black text-white/60">{mention.name.charAt(0)}</span>
                    </div>
                    <h4 className="text-base font-black text-white">{mention.name}</h4>
                  </div>
                  <p className="text-white/30 text-xs leading-relaxed">{mention.description}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Streaming Numbers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { value: '1M+', label: 'Spotify Streams' },
                { value: '100K+', label: 'YouTube Views' },
                { value: '100+', label: 'Tracks Released' },
                { value: '100+', label: 'Remixes & Edits' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                  <p className="text-3xl md:text-4xl font-black text-red-400">{stat.value}</p>
                  <p className="text-white/30 text-xs uppercase tracking-wider mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
