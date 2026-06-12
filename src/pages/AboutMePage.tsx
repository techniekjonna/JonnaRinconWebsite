import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Lightbulb, Music2, Heart, Play, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useInView } from '../hooks/useInView';
import { Link } from 'react-router-dom';

const tabs = [
  { id: 'productions', label: 'Productions', icon: Lightbulb, desc: 'Production workflow, skills & discography' },
  { id: 'streams', label: 'Streams', icon: Music2, desc: 'Spotify, YouTube & streaming platforms' },
  { id: 'community', label: 'Community', icon: Heart, desc: 'Co-signs, media & streaming numbers' },
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
  { title: 'Artist', desc: 'Writing, performing, and recording vocals' },
  { title: 'Audio Engineer', desc: 'Recording, editing, and processing audio to professional quality' },
  { title: 'Mix & Master', desc: 'Balancing, EQ-ing, and finalizing tracks for distribution' },
  { title: 'DJ', desc: 'Live mixing and performing sets across multiple genres' },
  { title: 'Visual Designer', desc: 'Self-made cover arts, video editing, and visual branding' },
  { title: 'Web Developer', desc: 'This website was designed and built by Jonna Rincon' },
];

function HeroSection() {
  const [ref, inView] = useInView({ threshold: 0.05 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex flex-col items-center justify-end overflow-hidden -mt-28 sm:-mt-32 pb-0"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/DJI_20251115114029_0004_D.JPG"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 30%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/90" />
      </div>

      {/* Bio content — centered vertically */}
      <div
        className="relative z-10 text-center px-6 max-w-2xl mx-auto transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(24px)',
          transitionDelay: '200ms',
          marginTop: 'auto',
          paddingTop: '10rem',
        }}
      >
        <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-4">
          Producer · DJ · Artist
        </p>
        <h1
          className="font-black uppercase leading-none tracking-tighter mb-6 text-white"
          style={{ fontSize: 'clamp(3.5rem, 12vw, 9rem)' }}
        >
          JONNA<br />RINCON
        </h1>
        <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
          Producer, DJ, and visual artist from Tilburg. Making music since age 13 — 10+ years of FL Studio,
          Moombahton, Hip Hop, R&amp;B, EDM and more. Self-produced, self-mixed, self-mastered.
          Full creative control from start to finish.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {['Moombahton', 'Hip Hop', 'R&B', 'EDM', 'Trap', 'Afrobeats'].map(g => (
            <span key={g} className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60 bg-white/[0.08] border border-white/[0.12] rounded-full">
              {g}
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}

export default function AboutMePage() {
  useScrollToTop();
  const [activeTab, setActiveTab] = useState('productions');
  const [currentPlaylist, setCurrentPlaylist] = useState(0);

  return (
    <div className="min-h-screen text-white bg-[#0a0a0a]">
      <Navigation isDarkOverlay={true} />

      {/* Hero with biography */}
      <HeroSection />

      {/* Tab Content */}
      <div id="about-content" className="bg-[#0a0a0a]">
        {/* Tab Switcher Bar */}
        <section className="sticky top-[72px] z-30 px-4 md:px-8 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto flex items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                    isActive
                      ? 'text-white border-red-500'
                      : 'text-white/40 border-transparent hover:text-white/70'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── PRODUCTIONS TAB ── */}
        {activeTab === 'productions' && (
          <section className="px-4 md:px-8 lg:px-12 pt-10 pb-20 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">

              {/* Section header */}
              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-2 font-black">The Work</p>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">Productions</h2>
                <p className="text-white/40 text-sm max-w-xl">
                  Every track starts in FL Studio — self-produced, mixed & mastered. Full creative control from start to finish.
                </p>
              </div>

              {/* Spotify embed */}
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-8">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">Mixed & Mastered by Jonna Rincon</h3>
                <div className="rounded-2xl overflow-hidden">
                  <iframe
                    style={{ borderRadius: '16px' }}
                    src="https://open.spotify.com/embed/playlist/5smfHiU4egb6uyHYzgmqdC?utm_source=generator"
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Process + Genres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-base font-black uppercase tracking-tight mb-3">The Process</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Every track starts in FL Studio — the DAW where it all began over 10 years ago. From the first beat to the final master,
                    every step is handled in-house. Self-made cover arts, self-mixed, self-mastered.
                  </p>
                </div>
                <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-base font-black uppercase tracking-tight mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Moombahton', 'Hip Hop', 'R&B', 'Trap', 'EDM', 'Lo-Fi', 'House', 'Drill', 'Afrobeats', 'Reggaeton', 'Pop', 'Latin'].map(genre => (
                      <span key={genre} className="px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-bold text-white/50 uppercase tracking-wider">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills grid */}
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">What I Do</h2>
              <p className="text-white/30 text-sm mb-8">25 years old — making music since age 13</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {skills.map(skill => (
                  <div key={skill.title} className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:bg-white/[0.06]">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">{skill.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed">{skill.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4">
                <Link to="/catalogue" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition-all rounded-full">
                  Browse Catalogue
                </Link>
                <Link to="/shop/services" className="px-6 py-3 bg-white/[0.08] border border-white/[0.15] text-white font-black text-xs uppercase tracking-widest hover:bg-white/[0.15] transition-all rounded-full">
                  Book a Session
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── STREAMS TAB ── */}
        {activeTab === 'streams' && (
          <section className="px-4 md:px-8 lg:px-12 pt-10 pb-20 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">

              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-2 font-black">Listen</p>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Streams</h2>
              </div>

              {/* Compilations */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
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
                    <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">{comp.name}</h3>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider">{comp.type}</p>
                  </a>
                ))}
              </div>

              {/* Spotify carousel */}
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-base font-bold text-white">{spotifyPlaylists[currentPlaylist].name}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPlaylist(Math.max(0, currentPlaylist - 1))}
                      className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-all"
                      disabled={currentPlaylist === 0}
                    >
                      <ChevronLeft size={16} className={currentPlaylist === 0 ? 'text-white/10' : 'text-white/40'} />
                    </button>
                    <button
                      onClick={() => setCurrentPlaylist(Math.min(spotifyPlaylists.length - 1, currentPlaylist + 1))}
                      className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.06] transition-all"
                      disabled={currentPlaylist === spotifyPlaylists.length - 1}
                    >
                      <ChevronRight size={16} className={currentPlaylist === spotifyPlaylists.length - 1 ? 'text-white/10' : 'text-white/40'} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-5">
                  {spotifyPlaylists.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPlaylist(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPlaylist ? 'bg-red-500 w-5' : 'bg-white/10 w-1.5 hover:bg-white/20'}`}
                    />
                  ))}
                </div>

                <div className="rounded-2xl overflow-hidden relative">
                  {spotifyPlaylists.map((playlist, i) => (
                    <div key={i} className={`transition-opacity duration-500 ${i === currentPlaylist ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>
                      <iframe
                        style={{ borderRadius: '16px' }}
                        src={playlist.embedUrl}
                        width="100%"
                        height="380"
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
                  className="mt-6 w-full inline-block text-center py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] text-sm"
                >
                  Open in Spotify
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── COMMUNITY TAB ── */}
        {activeTab === 'community' && (
          <section className="px-4 md:px-8 lg:px-12 pt-10 pb-20 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">

              <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.4em] text-red-500 mb-2 font-black">Recognition</p>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Community</h2>
              </div>

              {/* MTV Feature */}
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

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { value: '1M+', label: 'Spotify Streams' },
                  { value: '100K+', label: 'YouTube Views' },
                  { value: '100+', label: 'Tracks Released' },
                  { value: '100+', label: 'Remixes & Edits' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                    <p className="text-3xl md:text-4xl font-black text-red-400 mb-1">{stat.value}</p>
                    <p className="text-white/30 text-xs uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Artist co-signs */}
              <h3 className="text-xl font-black uppercase tracking-tight mb-6">Artist Co-Signs & Support</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {supportMentions.filter(s => s.type === 'Artist').map(mention => (
                  <div
                    key={mention.name}
                    className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-white/60">{mention.name.charAt(0)}</span>
                      </div>
                      <h4 className="text-sm font-black text-white truncate">{mention.name}</h4>
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed">{mention.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
