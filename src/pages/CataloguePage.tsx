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
import { useT } from '../contexts/LanguageContext';

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
  _isRemix?: boolean;
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
  const [catalogueFilter, setCatalogueFilter] = useState<'all' | 'albums' | 'singles' | 'remixes'>('all');
  const t = useT();

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
    _isRemix: false,
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
    _isRemix: true,
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
        acc[albumKey] = { albumName, type: track.type, artwork: track.coverArt, tracks: [], displayTrack: track, isRemix: false };
      }
      acc[albumKey].tracks.push(track);
    } else {
      const singleKey = `single:${track.id}`;
      acc[singleKey] = { albumName: null, type: track.type, artwork: track.coverArt, tracks: [track], displayTrack: track, isRemix: !!track._isRemix };
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedGroups = Object.entries(groupedTracks)
    .filter(([, group]) => {
      const isAlbumGroup = group.albumName && (group.type === 'Album' || group.type === 'EP');
      if (catalogueFilter === 'albums') return isAlbumGroup;
      if (catalogueFilter === 'singles') return !isAlbumGroup && !group.isRemix;
      if (catalogueFilter === 'remixes') return group.isRemix;
      return true;
    })
    .sort(([, a], [, b]) => getSortTime(b.displayTrack) - getSortTime(a.displayTrack));

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
  return (
    <div className="min-h-screen text-white">
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

      {/* Filter row */}
      <section className="px-6 md:px-12 pt-2 pb-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          {([
            { key: 'all', label: t('All', 'Alles') },
            { key: 'albums', label: t('Albums', 'Albums') },
            { key: 'singles', label: t('Singles', 'Singles') },
            { key: 'remixes', label: t('Remixes', 'Remixes') },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCatalogueFilter(opt.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                catalogueFilter === opt.key
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
