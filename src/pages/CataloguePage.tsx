import React, { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import Footer from '../components/Footer';
import { ChevronDown, Music } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../hooks/useAuth';
import { useTrackDetail } from '../contexts/TrackDetailContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import LoadingSpinner from '../components/LoadingSpinner';
import { setCurrentTrack, getCurrentTrack, openPlayerModal, setPlayerDetailContext, registerAlbumDetailOpener } from '../components/GlobalAudioPlayer';
import TrackListItem from '../components/TrackListItem';
import { useTracks } from '../hooks/useTracks';
import { useRemixes } from '../hooks/useRemixes';
import { useRelatedTracks } from '../hooks/useRelatedTracks';
import TrackDetailModal from '../components/TrackDetailModal';
import AlbumModal from '../components/AlbumModal';
import LoginModal from '../components/LoginModal';
import { trackService, playlistService } from '../lib/firebase/services';

interface Track {
  id: string;
  artist: string;
  title: string;
  audioUrl?: string;
  coverArt?: string;
  createdAt: number;
  releaseDate?: Timestamp;
  type?: 'Album' | 'EP' | 'Single' | 'Exclusive';
  year?: number;
  collab?: 'Solo' | 'Collab';
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: string;
  album?: string;
  trackNumber?: number;
  sortOrder?: number;
  isFree?: boolean;
  licenses?: { exclusive?: { price: number } };
}

interface RemixTrack extends Track {
  remixType?: 'Remix' | 'Edit' | 'Bootleg';
}

// Newest-first sort key: an explicit release date wins, otherwise fall back
// to Jan 1 of the given year, otherwise the record's creation time.
const getSortTime = (t: { releaseDate?: Timestamp; year?: number; createdAt: number }): number => {
  if (t.releaseDate) return t.releaseDate.toMillis();
  if (t.year) return new Date(t.year, 0, 1).getTime();
  return t.createdAt;
};

export default function CataloguePage() {
  useScrollToTop();
  const { isAuthenticated } = useAuth();
  const { tracks: firebaseTracks, loading: tracksLoading, error: tracksError } = useTracks({ status: 'published' });
  const { remixes: firebaseRemixes, loading: remixesLoading } = useRemixes({ status: 'published' });

  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
  const { selectedTrack, setSelectedTrack, isModalOpen, setIsModalOpen } = useTrackDetail();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  const heroTitle = useCyberDecodeInView('MUSIC');
  const relatedTracks = useRelatedTracks(selectedTrack, []);

  const demoTracks: Track[] = firebaseTracks.map(t => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    trackNumber: t.trackNumber,
    sortOrder: t.sortOrder,
    duration: t.duration || '0:00',
    genre: t.genre,
    bpm: t.bpm,
    key: t.key,
    year: t.year,
    releaseDate: t.releaseDate,
    type: t.type,
    collab: t.collab,
    audioUrl: t.audioUrl,
    coverArt: t.artworkUrl,
    coverArtUrl: t.artworkUrl,
    createdAt: t.createdAt?.toMillis?.() || Date.now(),
    isFree: t.isFree,
    licenses: t.licenses,
  }));

  const remixTracks: RemixTrack[] = firebaseRemixes.map(r => ({
    id: r.id,
    title: r.title,
    artist: r.remixArtist,
    duration: r.duration || '0:00',
    genre: r.genre,
    bpm: r.bpm,
    year: r.year,
    collab: r.collab,
    remixType: r.remixType,
    sortOrder: r.sortOrder,
    audioUrl: r.audioUrl,
    coverArt: r.artworkUrl,
    coverArtUrl: r.artworkUrl,
    createdAt: r.createdAt.toMillis?.() || Date.now(),
  }));

  const handlePlayTrack = async (track: Track) => {
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    if (track.id) {
      setTimeout(() => { trackService.incrementPlays(track.id!).catch(() => {}); }, 15000);
    }
    const queue = [...demoTracks, ...remixTracks].sort((a, b) => getSortTime(b) - getSortTime(a));
    setCurrentTrack(track, queue);
  };

  const handleAddToPlaylist = async (trackId: string, playlistId: string) => {
    try { await playlistService.addTrackToPlaylist(playlistId, trackId); } catch {}
  };

  const handleTogglePlayTrack = (track: Track) => {
    const current = getCurrentTrack();
    if (current?.id === track.id) { setIsPlaying(!isPlaying); }
    else { handlePlayTrack(track); setIsPlaying(true); }
  };

  const handleTrackClick = (track: Track) => {
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    handlePlayTrack(track);
    setPlayerDetailContext('track', track as any);
  };

  const displayItems: Track[] = [...demoTracks, ...remixTracks];

  const groupedTracks = displayItems.reduce((acc, track) => {
    if (track.type === 'Album' || track.type === 'EP') {
      const albumName = track.album || track.title;
      const albumKey = `${track.type}:${albumName}`;
      if (!acc[albumKey]) {
        acc[albumKey] = { albumName, type: track.type, artwork: track.coverArt, tracks: [], displayTrack: track };
      }
      acc[albumKey].tracks.push(track);
    } else {
      const singleKey = `single:${track.id}`;
      acc[singleKey] = { albumName: null, type: track.type, artwork: track.coverArt, tracks: [track], displayTrack: track };
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedGroups = Object.entries(groupedTracks).sort(
    ([, a], [, b]) => getSortTime(b.displayTrack) - getSortTime(a.displayTrack)
  );

  const toggleAlbumExpand = (albumKey: string) => {
    const next = new Set(expandedAlbums);
    next.has(albumKey) ? next.delete(albumKey) : next.add(albumKey);
    setExpandedAlbums(next);
  };

  useEffect(() => {
    registerAlbumDetailOpener((album) => setSelectedAlbum(album));
  }, []);

  const handleCoverClick = useCallback((track: Track) => {
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    handlePlayTrack(track);
    setPlayerDetailContext('track', track as any);
    openPlayerModal();
  }, [isAuthenticated, handlePlayTrack]);

  const handleAlbumCoverClick = useCallback((group: any) => {
    const sorted = [...group.tracks].sort((a: Track, b: Track) => (a.trackNumber || 0) - (b.trackNumber || 0));
    const firstTrack = sorted[0];
    if (!firstTrack) return;
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    handlePlayTrack(firstTrack);
    setPlayerDetailContext('album', {
      name: group.albumName,
      type: group.type,
      artwork: group.artwork,
      artist: group.displayTrack.artist,
      year: group.displayTrack.year,
      tracks: group.tracks,
    });
    openPlayerModal();
  }, [isAuthenticated, handlePlayTrack]);

  const isLoading = tracksLoading || remixesLoading;
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const splashStartRef = useState(() => Date.now())[0];

  useEffect(() => {
    if (!isLoading && !splashDone) {
      const elapsed = Date.now() - splashStartRef;
      const remaining = Math.max(0, 1500 - elapsed);
      const t = setTimeout(() => {
        setSplashFading(true);
        setTimeout(() => setSplashDone(true), 600);
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [isLoading, splashDone]);

  return (
    <div className="min-h-screen text-white">
      {/* Welcome loading splash */}
      {!splashDone && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{
            backdropFilter: 'blur(32px) saturate(140%)',
            WebkitBackdropFilter: 'blur(32px) saturate(140%)',
            background: 'rgba(0,0,0,0.12)',
            opacity: splashFading ? 0 : 1,
            transition: 'opacity 0.6s ease',
            pointerEvents: splashFading ? 'none' : 'auto',
          }}
        >
          <div className="flex flex-col items-center max-w-md text-center px-8 py-10 rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl">
            {/* Waveform loader */}
            <div className="flex items-end gap-[3px] h-8 mb-7">
              {[10, 18, 24, 14, 28, 16, 22, 12].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-red-500 animate-waveform-bar"
                  style={{
                    height: `${h}px`,
                    boxShadow: '0 0 6px rgba(239,68,68,0.6)',
                    animationDuration: '0.9s',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
            <p className="text-white/70 text-xs md:text-sm font-light tracking-wider mb-3">
              Welcome to my catalogue, this is not fast food music.<br />
              Take your time and have a listen.
            </p>
            <p className="text-white/30 text-xs tracking-widest uppercase">— Jonathan (Jonna Rincon)</p>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <TrackDetailModal
        track={selectedTrack}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPlaying={false}
        onPlay={handlePlayTrack}
        relatedTracks={relatedTracks}
        onAddToPlaylist={handleAddToPlaylist}
      />

      <AlbumModal album={selectedAlbum} isOpen={!!selectedAlbum} onClose={() => setSelectedAlbum(null)} />

      {/* Page heading */}
      <section className="relative pt-24 md:pt-32 px-6 md:px-12 pb-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-red-500 mb-3">Discography</p>
        <h1
          ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>}
          style={{ fontSize: 'clamp(2.2rem, 7vw, 5rem)' }}
          className="font-black uppercase leading-[0.9] tracking-tighter text-white"
        >
          {heroTitle.display}
        </h1>
      </section>

      <section className="px-6 md:px-12 pt-2 pb-2">
        <div className="max-w-7xl mx-auto">
          {tracksError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <p className="text-red-400 text-sm font-semibold">⚠️ {tracksError}</p>
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-7xl mx-auto"><LoadingSpinner text="Loading tracks..." /></div>
        </section>
      ) : (
        <section className="px-6 md:px-12 py-2 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-3">
              {sortedGroups.map(([albumKey, group]) => {
                const isAlbum = group.albumName && (group.type === 'Album' || group.type === 'EP');
                const isExpanded = expandedAlbums.has(albumKey);
                return isAlbum ? (
                  <div key={albumKey}>
                    {/* Album row — same compact style as track rows */}
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${isExpanded ? 'bg-white/[0.06]' : 'hover:bg-white/[0.05]'}`}>
                      {/* Spacer to align with TrackListItem rows that have a w-7 track number column */}
                      <div className="w-7 flex-shrink-0" />
                      {/* Cover — click opens PlayerModal */}
                      <div
                        className="relative flex-shrink-0 w-10 h-10 rounded bg-white/[0.08] overflow-hidden cursor-pointer"
                        onClick={() => handleAlbumCoverClick(group)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Music size={16} className="text-white/30" />
                        </div>
                        {group.artwork && (
                          <img
                            src={group.artwork}
                            alt={group.albumName}
                            loading="lazy"
                            onLoad={e => (e.currentTarget.style.opacity = '1')}
                            className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
                          />
                        )}
                      </div>
                      {/* Title + track count — click expands */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleAlbumExpand(albumKey)}>
                        <p className="text-sm font-semibold truncate leading-tight text-white">{group.albumName}</p>
                        <p className="text-xs text-white/40 truncate leading-tight mt-0.5">{group.tracks.length} track{group.tracks.length !== 1 ? 's' : ''}</p>
                      </div>
                      {/* Type badge + chevron */}
                      <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => toggleAlbumExpand(albumKey)}>
                        <span className="text-[10px] uppercase font-bold text-white/30 hidden md:inline">{group.type}</span>
                        <ChevronDown size={16} className={`text-white/40 group-hover:text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                        {group.tracks
                          .sort((a: Track, b: Track) => (a.trackNumber || 0) - (b.trackNumber || 0))
                          .map((track: Track, index: number) => (
                            <div key={track.id} className="pl-6 md:pl-8">
                              <TrackListItem
                                track={track} onClickTrack={handleTrackClick} onPlay={handlePlayTrack}
                                onTogglePlay={handleTogglePlayTrack} onCoverClick={handleCoverClick}
                                showType={false} showMetadata isAlbumTrack trackNumber={index + 1} isPlaying={isPlaying}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <TrackListItem
                    key={albumKey} track={group.displayTrack} onClickTrack={handleTrackClick}
                    onPlay={handlePlayTrack} onTogglePlay={handleTogglePlayTrack} onCoverClick={handleCoverClick}
                    showType showMetadata isPlaying={isPlaying}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
              <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
              <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">{displayItems.length} Track{displayItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
