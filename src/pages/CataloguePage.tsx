import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
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
import FilterModal from '../components/FilterModal';
import TrackDetailModal from '../components/TrackDetailModal';
import AlbumModal from '../components/AlbumModal';
import LoginModal from '../components/LoginModal';
import PlaylistModal from '../components/PlaylistModal';
import PlaylistDetailView from '../components/PlaylistDetailView';
import CatalogueSidebar from '../components/CatalogueSidebar';
import { extractUniqueGenres } from '../lib/utils/genreExtractor';
import { trackService, playlistService } from '../lib/firebase/services';
import { Playlist, Track as FirebaseTrack } from '../lib/firebase/types';

// sidebar nav tabs defined in CatalogueSidebar

const djSetVideos = [
  {
    id: 'dj1',
    youtubeId: '_e51RSGz5Tw',
    title: 'DJ Set #1',
  },
  {
    id: 'dj2',
    youtubeId: 'RWG00_2ogJA',
    title: 'DJ Set #2',
  },
  {
    id: 'dj3',
    youtubeId: 'vHiwNyTBkN4',
    title: 'DJ Set #3',
  },
];

interface Track {
  id: string;
  artist: string;
  title: string;
  audioUrl?: string;
  coverArt?: string;
  createdAt: number;
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

export default function CataloguePage() {
  useScrollToTop();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tracks: firebaseTracks, loading: tracksLoading, error: tracksError } = useTracks({ status: 'published' });
  const { remixes: firebaseRemixes, loading: remixesLoading } = useRemixes({ status: 'published' });

  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState<'Album' | 'EP' | 'Single' | 'Exclusive' | 'All'>('All');
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
  const [selectedCollab, setSelectedCollab] = useState<'Solo' | 'Collab' | 'All'>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest'>('newest');
  const [selectedRemixType, setSelectedRemixType] = useState<'Remix' | 'Edit' | 'Bootleg' | 'All'>('All');
  const [selectedRemixYear, setSelectedRemixYear] = useState<number | 'All'>('All');
  const [selectedRemixCollab, setSelectedRemixCollab] = useState<'Solo' | 'Collab' | 'All'>('All');
  const [selectedRemixGenre, setSelectedRemixGenre] = useState<string>('All');
  const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { selectedTrack, setSelectedTrack, isModalOpen, setIsModalOpen } = useTrackDetail();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistDetailOpen, setIsPlaylistDetailOpen] = useState(false);
  const [playingDjSet, setPlayingDjSet] = useState<string | null>(null);

  const heroTitle = useCyberDecodeInView('CATALOGUE');
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

  const genreMatches = (genre: string | undefined, sel: string) => {
    if (sel === 'All') return true;
    if (!genre) return false;
    return genre.split(',').map(g => g.trim()).includes(sel);
  };

  const handlePlayTrack = async (track: Track) => {
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    if (track.id) {
      setTimeout(() => { trackService.incrementPlays(track.id!).catch(() => {}); }, 15000);
    }
    const queue = demoTracks
      .filter(t => {
        return getTabTypeFilter(t) &&
          (selectedType === 'All' || t.type === selectedType) &&
          (selectedYear === 'All' || t.year === selectedYear) &&
          (selectedCollab === 'All' || t.collab === selectedCollab) &&
          genreMatches(t.genre, selectedGenre);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
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

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsPlaylistDetailOpen(true);
  };

  const handlePlayPlaylistTracks = (playlistTracks: FirebaseTrack[], startIndex = 0) => {
    if (playlistTracks.length === 0) return;
    const tracksToPlay = playlistTracks.map(t => ({
      id: t.id, title: t.title, artist: t.artist, album: t.album,
      trackNumber: t.trackNumber, duration: t.duration || '0:00', genre: t.genre,
      bpm: t.bpm, key: t.key, year: t.year, type: t.type, collab: t.collab,
      audioUrl: t.audioUrl, coverArt: t.artworkUrl,
      createdAt: t.createdAt?.toMillis?.() || Date.now(), isFree: t.isFree, licenses: t.licenses,
    }));
    const trackToPlay = tracksToPlay[startIndex] || tracksToPlay[0];
    setCurrentTrack(trackToPlay, tracksToPlay);
    setIsPlaying(true);
  };

  const getTabTypeFilter = useCallback((track: Track) => {
    if (activeTab === 'albums') return track.type === 'Album' || track.type === 'EP';
    if (activeTab === 'singles') return track.type === 'Single';
    if (activeTab === 'tracks') return track.type !== 'Album' && track.type !== 'EP';
    return true; // 'all' shows everything
  }, [activeTab]);

  const shuffleArray = useCallback(<T,>(arr: T[], seed: number): T[] => {
    const a = [...arr];
    let s = seed || 1;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  const handleTrackClick = (track: Track) => {
    if (!isAuthenticated) { setIsLoginModalOpen(true); return; }
    handlePlayTrack(track);
    setPlayerDetailContext('track', track as any);
    openPlayerModal();
  };

  const filteredTracks = demoTracks.filter(track => {
    return getTabTypeFilter(track) &&
      (selectedType === 'All' || track.type === selectedType) &&
      (selectedYear === 'All' || track.year === selectedYear) &&
      (selectedCollab === 'All' || track.collab === selectedCollab) &&
      genreMatches(track.genre, selectedGenre);
  });

  const years = Array.from(new Set(demoTracks.map(t => t.year).filter(Boolean))).sort((a, b) => b - a) as number[];

  const trackGenres = useMemo(() => extractUniqueGenres(demoTracks, { sort: true }), [demoTracks]);
  const remixGenres = useMemo(() => extractUniqueGenres(remixTracks, { sort: true }), [remixTracks]);

  const groupedTracks = filteredTracks.reduce((acc, track) => {
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

  const toggleAlbumExpand = (albumKey: string) => {
    const next = new Set(expandedAlbums);
    next.has(albumKey) ? next.delete(albumKey) : next.add(albumKey);
    setExpandedAlbums(next);
  };

  useEffect(() => { setExpandedAlbums(new Set()); }, [selectedType, selectedYear, selectedGenre, selectedCollab, activeTab]);

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

  return (
    <div className="min-h-screen text-white">
      <Navigation isDarkOverlay={true} />

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

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onPlaylistSelect={handlePlaylistSelect}
      />

      {selectedPlaylist && (
        <PlaylistDetailView
          playlist={selectedPlaylist}
          isOpen={isPlaylistDetailOpen}
          onClose={() => { setIsPlaylistDetailOpen(false); setSelectedPlaylist(null); }}
          onPlayTracks={handlePlayPlaylistTracks}
          isPlaying={isPlaying}
        />
      )}

      {/* Hero */}
      <section className="relative pt-28 px-6 md:px-12 pb-2" />

      {/* Horizontal navigation bar */}
      <CatalogueSidebar
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setShuffle(false); }}
        onCreatePlaylist={() => setIsPlaylistModalOpen(true)}
        onPlaylistSelect={handlePlaylistSelect}
        onFilterClick={activeTab !== 'djsets' ? () => setIsFilterModalOpen(true) : undefined}
        onShuffleClick={activeTab !== 'djsets' ? () => { setShuffle(s => !s); setShuffleSeed(Date.now()); } : undefined}
        isShuffleActive={shuffle}
      />

      {/* ── TRACKS / ALL / ALBUMS / SINGLES TABS ── */}
      {(activeTab === 'all' || activeTab === 'tracks' || activeTab === 'albums' || activeTab === 'singles') && (
        <>
          <section className="px-6 md:px-12 pt-2 pb-2">
            <div className="max-w-7xl mx-auto">
              {tracksError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                  <p className="text-red-400 text-sm font-semibold">⚠️ {tracksError}</p>
                </div>
              )}

              <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onReset={() => {
                  setSelectedType('All'); setSelectedYear('All');
                  setSelectedCollab('All'); setSelectedGenre('All'); setSelectedSort('newest');
                }}
                filters={[
                  { label: 'Type', options: ['All', 'Album', 'EP', 'Single', 'Exclusive'], value: selectedType, onChange: v => setSelectedType(v as any) },
                  { label: 'Year', options: ['All', ...years], value: selectedYear, onChange: v => setSelectedYear(v as any) },
                  { label: 'Collab', options: ['All', 'Solo', 'Collab'], value: selectedCollab, onChange: v => setSelectedCollab(v as any) },
                  { label: 'Genre', options: ['All', ...trackGenres], value: selectedGenre, onChange: v => setSelectedGenre(v) },
                  { label: 'Sort', options: ['Newest', 'Oldest'], value: selectedSort === 'newest' ? 'Newest' : 'Oldest', onChange: v => setSelectedSort(v === 'Newest' ? 'newest' : 'oldest') },
                ]}
              />
            </div>
          </section>

          {tracksLoading && (
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto"><LoadingSpinner text="Loading tracks..." /></div>
            </section>
          )}

          {!tracksLoading && (
            <section className="px-6 md:px-12 py-2 md:py-4">
              <div className="max-w-7xl mx-auto">
                <div className="space-y-3">
                  {(shuffle
                    ? shuffleArray(Object.entries(groupedTracks), shuffleSeed)
                    : Object.entries(groupedTracks).sort(([, a], [, b]) => {
                        if ((a.albumName && b.albumName) || (!a.albumName && !b.albumName)) {
                          return (b.displayTrack.sortOrder ?? b.displayTrack.createdAt) - (a.displayTrack.sortOrder ?? a.displayTrack.createdAt);
                        }
                        return a.albumName ? -1 : 1;
                      })
                  )
                    .map(([albumKey, group]) => {
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
                  <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">{filteredTracks.length} Track{filteredTracks.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── REMIXES TAB (also shown appended in 'all') ── */}
      {(activeTab === 'remixes' || activeTab === 'all') && (
        <>
          {activeTab === 'remixes' && (
            <section className="px-6 md:px-12 pt-2 pb-2">
              <div className="max-w-7xl mx-auto">
                <FilterModal
                  isOpen={isFilterModalOpen}
                  onClose={() => setIsFilterModalOpen(false)}
                  onReset={() => { setSelectedRemixType('All'); setSelectedRemixYear('All'); setSelectedRemixCollab('All'); setSelectedRemixGenre('All'); }}
                  filters={[
                    { label: 'Type', options: ['All', 'Remix', 'Edit', 'Bootleg'], value: selectedRemixType, onChange: v => setSelectedRemixType(v as any) },
                    { label: 'Year', options: ['All', ...Array.from(new Set(remixTracks.map(t => t.year))).sort((a, b) => b - a)], value: selectedRemixYear, onChange: v => setSelectedRemixYear(v as any) },
                    { label: 'Collab', options: ['All', 'Solo', 'Collab'], value: selectedRemixCollab, onChange: v => setSelectedRemixCollab(v as any) },
                    { label: 'Genre', options: ['All', ...remixGenres], value: selectedRemixGenre, onChange: v => setSelectedRemixGenre(v as any) },
                  ]}
                />
              </div>
            </section>
          )}

          {remixesLoading && (
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto"><LoadingSpinner text="Loading remixes..." /></div>
            </section>
          )}

          {!remixesLoading && (
            <section className="px-6 md:px-12 py-2 md:py-4">
              <div className="max-w-7xl mx-auto">
                {activeTab === 'all' && remixTracks.length > 0 && (
                  <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Remixes / Edits / Bootlegs</p>
                  </div>
                )}
                <div className="space-y-3">
                  {(shuffle
                    ? shuffleArray(
                        remixTracks.filter(t =>
                          activeTab === 'all' || (
                            (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                            (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                            (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                            genreMatches(t.genre, selectedRemixGenre)
                          )
                        ),
                        shuffleSeed
                      )
                    : remixTracks
                        .filter(t =>
                          activeTab === 'all' || (
                            (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                            (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                            (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                            genreMatches(t.genre, selectedRemixGenre)
                          )
                        )
                        .sort((a, b) => {
                          const aSort = a.sortOrder ?? Number.MAX_VALUE;
                          const bSort = b.sortOrder ?? Number.MAX_VALUE;
                          if (aSort !== bSort) return bSort - aSort;
                          return b.createdAt - a.createdAt;
                        })
                  ).map(remix => (
                    <TrackListItem
                      key={remix.id} track={remix} onClickTrack={handleTrackClick}
                      onPlay={handlePlayTrack} onTogglePlay={handleTogglePlayTrack} onCoverClick={handleCoverClick}
                      showType={false} showMetadata isPlaying={isPlaying}
                      showDownload onDownload={(remix) => navigate(`/download/${remix.id}`)}
                    />
                  ))}
                </div>
                {activeTab === 'remixes' && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
                    <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
                    <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">
                      {remixTracks.filter(t =>
                        (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                        (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                        (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                        genreMatches(t.genre, selectedRemixGenre)
                      ).length} Remixes
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── DJ SETS TAB ── */}
      {activeTab === 'djsets' && (
        <section className="px-6 md:px-12 pt-6 pb-20">
          <div className="max-w-7xl mx-auto space-y-3">
            {djSetVideos.map(set => (
              <div
                key={set.id}
                className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-xl overflow-hidden"
              >
                {playingDjSet === set.id ? (
                  <iframe
                    width="100%"
                    height="280"
                    src={`https://www.youtube.com/embed/${set.youtubeId}?autoplay=1`}
                    title={set.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center gap-4 p-3">
                    <button
                      onClick={() => setPlayingDjSet(set.id)}
                      className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden group"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${set.youtubeId}/mqdefault.jpg`}
                        alt={set.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{set.title}</p>
                      <p className="text-white/30 text-xs mt-0.5">DJ Set</p>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${set.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/30 hover:text-red-400 transition-colors uppercase tracking-wider flex-shrink-0 pr-1"
                    >
                      YT ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
