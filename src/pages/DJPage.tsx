import React from 'react';
import { ExternalLink, Music, Globe, Zap, Users, Youtube, Play } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useScrollToTop } from '../hooks/useScrollToTop';

const STATS = [
  { value: '3M+', label: 'Spotify Streams' },
  { value: '750K+', label: 'YouTube Views' },
  { value: '200+', label: 'Released Tracks' },
  { value: '130–160', label: 'BPM Range' },
];

const PHOTOS = [
  { src: '/DJI_20251017150728_0019_D.JPG', alt: 'Jonna Rincon DJ set' },
  { src: '/DJI_20251115114029_0004_D.JPG', alt: 'Jonna Rincon live' },
  { src: '/DJ Screenshot 3-2-26.png', alt: 'Jonna Rincon performing' },
  { src: '/Maastricht Screenshot 15-12-25.png', alt: 'Jonna Rincon Maastricht' },
  { src: '/TN-DJSet.jpg', alt: 'DJ Set' },
  { src: '/Menu Foto 1.png', alt: 'Jonna Rincon' },
];

const TRACK_EXAMPLES = [
  { title: 'Binne Ben', type: 'Original Single' },
  { title: 'Club Jeighteen', type: 'Original Single' },
  { title: 'Make It Move', type: 'Original Single' },
  { title: 'JEIGHTENESIS', type: 'Album' },
];

const GENRES = [
  { name: 'EDM', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  { name: 'Urban / Moombahton', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  { name: 'Remixes & Edits', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
];

const REFERENCES = ['DJ Snake', 'Diplo', 'Major Lazer', 'Skrillex', 'Fred Again...'];

export default function DJPage() {
  useScrollToTop();

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      {/* Fixed background */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/DJI_20251017150728_0019_D.JPG"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/85" />
      </div>

      <main className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Jonna Rincon</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">
            DJ
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            High-energy sets built entirely from original music. Full sets with own singles, remixes
            and edits — energetic, artistic, and relentless.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-white/[0.05] border border-white/10 p-5 text-center">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/[0.04] border border-white/10 p-6 space-y-4">
            <p className="text-white/30 text-xs uppercase tracking-wider">Profile</p>
            {[
              ['Location', 'Netherlands'],
              ['Events', 'Clubs · Festivals'],
              ['Languages', 'Dutch · English'],
              ['Avg BPM', '145–155 BPM'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-baseline border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                <span className="text-white/30 text-xs uppercase tracking-wider">{k}</span>
                <span className="text-white text-sm font-medium">{v}</span>
              </div>
            ))}
            <p className="text-white/25 text-[11px] leading-relaxed">
              May use Low BPM's to build up the high energy (100–125 BPM)
            </p>
          </div>

          <div className="bg-white/[0.04] border border-white/10 p-6">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Genres</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GENRES.map(({ name, color }) => (
                <span
                  key={name}
                  className={`px-3 py-1.5 border rounded-full text-xs font-bold uppercase tracking-wider ${color}`}
                >
                  {name}
                </span>
              ))}
            </div>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Style</p>
            <div className="space-y-2">
              {[
                'Full sets with own Original Singles and Remixes/Edits',
                'Energetic and artistic performance style',
                'Multiple full sets available on YouTube',
              ].map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-white/60 text-sm">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referenced Artists */}
        <div className="bg-white/[0.04] border border-white/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-white/30" />
            <p className="text-white/30 text-xs uppercase tracking-wider">Sound References</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {REFERENCES.map((ref) => (
              <span key={ref} className="px-3 py-1.5 bg-white/[0.06] border border-white/10 text-white/70 text-xs font-medium uppercase tracking-wider">
                {ref}
              </span>
            ))}
          </div>
        </div>

        {/* Track examples */}
        <div className="bg-white/[0.04] border border-white/10 p-6 mb-8">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Featured Tracks</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRACK_EXAMPLES.map(({ title, type }) => (
              <div key={title} className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-colors">
                <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
                  <Play size={14} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-white/40 text-xs">{type}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/catalogue"
            className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-400 text-xs uppercase tracking-widest font-bold transition-colors"
          >
            Browse full catalogue <ExternalLink size={12} />
          </a>
        </div>

        {/* Photo grid */}
        <div className="mb-8">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Gallery</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PHOTOS.map(({ src, alt }) => (
              <div key={src} className="aspect-square overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>

        {/* YouTube + Booking CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://www.youtube.com/@jonnarincon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-4 bg-white/[0.05] border border-white/10 hover:border-red-600/50 text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:bg-white/10"
          >
            <Youtube size={18} className="text-red-500" />
            Watch Sets on YouTube
          </a>
          <a
            href="/contact"
            className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:scale-[1.01]"
          >
            <Globe size={18} />
            Book Jonna Rincon
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
