import React, { useState, useEffect, useMemo } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Music, Disc3, Radio, Sliders, ChevronDown } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../hooks/useAuth';
import { useTrackDetail } from '../contexts/TrackDetailContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import LoadingSpinner from '../components/LoadingSpinner';
import { setCurrentTrack, getCurrentTrack } from '../components/GlobalAudioPlayer';
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
import { extractUniqueGenres } from '../lib/utils/genreExtractor';
import { trackService, settingsService, playlistService } from '../lib/firebase/services';
import { useCart } from '../hooks/useCart';
import { Playlist, Track as FirebaseTrack } from '../lib/firebase/types';

const tabs = [
  { id: 'tracks', label: 'Tracks', icon: Music },
  { id: 'remixes', label: 'Remixes', icon: Disc3 },
  { id: 'djsets', label: 'DJ Sets', icon: Radio },
];

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
  const { addTrackToCart, cartItems = [] } = useCart();
  const { tracks: firebaseTracks, loading: tracksLoading, error: tracksError } = useTracks({ status: 'published' });
  const { remixes: firebaseRemixes, loading: remixesLoading } = useRemixes({ status: 'published' });

  const [activeTab, setActiveTab] = useState('tracks');
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
  const [selectedTypeTab, setSelectedTypeTab] = useState<'Singles' | 'Albums & EPs' | 'All' | 'Custom 1' | 'Custom 2'>('All');
  const [trackSettings, setTrackSettings] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistDetailOpen, setIsPlaylistDetailOpen] = useState(false);
  const [playingDjSet, setPlayingDjSet] = useState<string | null>(null);

  const heroTitle = useCyberDecodeInView('CATALOGUE');

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
        return (selectedType === 'All' || t.type === selectedType) &&
          (selectedYear === 'All' || t.year === selectedYear) &&
          (selectedCollab === 'All' || t.collab === selectedCollab) &&
          genreMatches(t.genre, selectedGenre);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    setCurrentTrack(track, queue);
  };

  const handleBuyTrack = (track: Track) => {
    const ft = firebaseTracks.find(t => t.id === track.id);
    if (ft) addTrackToCart(ft);
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

  const matchesTypeTab = (track: Track) => {
    switch (selectedTypeTab) {
      case 'Singles': return !track.album && (track.type === 'Single' || track.type === 'Exclusive');
      case 'Albums & EPs': return track.type === 'Album' || track.type === 'EP';
      default: return true;
    }
  };

  const handleTrackClick = (track: Track) => { setSelectedTrack(track); setIsModalOpen(true); };

  const filteredTracks = demoTracks.filter(track => {
    return matchesTypeTab(track) &&
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

  useEffect(() => { setExpandedAlbums(new Set()); }, [selectedType, selectedYear, selectedGenre, selectedCollab]);

  useEffect(() => {
    settingsService.getTrackSettings().then(setTrackSettings).catch(() => {});
  }, []);

  const tabsList = ['Singles', 'Albums & EPs', 'All']
    .concat(trackSettings?.customTab1Enabled ? [trackSettings.customTab1Label || 'Custom 1'] : [])
    .concat(trackSettings?.customTab2Enabled ? [trackSettings.customTab2Label || 'Custom 2'] : []);

  return (
    <div className="min-h-screen text-white">
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />
      <Navigation isDarkOverlay={true} />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <TrackDetailModal
        track={selectedTrack}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPlaying={false}
        onPlay={handlePlayTrack}
        onBuy={handleBuyTrack}
        cartItems={cartItems}
        relatedTracks={useRelatedTracks(selectedTrack, [])}
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
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-1 gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRACKS TAB ── */}
      {activeTab === 'tracks' && (
        <>
          <section className="px-6 md:px-12 pt-6 pb-2">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                {/* Type sub-tabs */}
                <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-1 gap-1 flex-1 min-w-0">
                  {tabsList.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTypeTab(tab as any)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all truncate ${
                        selectedTypeTab === tab
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'text-white/50 hover:text-white/80'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    title="Filters"
                    className="flex items-center justify-center w-9 h-9 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
                  >
                    <Sliders size={15} />
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={() => setIsPlaylistModalOpen(true)}
                      title="Playlists"
                      className="flex items-center justify-center w-9 h-9 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
                    >
                      <Music size={15} />
                    </button>
                  )}
                </div>
              </div>

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
                  {Object.entries(groupedTracks)
                    .sort(([, a], [, b]) => {
                      if ((a.albumName && b.albumName) || (!a.albumName && !b.albumName)) {
                        return (b.displayTrack.sortOrder ?? b.displayTrack.createdAt) - (a.displayTrack.sortOrder ?? a.displayTrack.createdAt);
                      }
                      return a.albumName ? -1 : 1;
                    })
                    .map(([albumKey, group]) => {
                      const isAlbum = group.albumName && (group.type === 'Album' || group.type === 'EP');
                      const isExpanded = expandedAlbums.has(albumKey);
                      return isAlbum ? (
                        <div key={albumKey}>
                          <button
                            onClick={() => toggleAlbumExpand(albumKey)}
                            className="w-full px-6 py-4 flex items-center gap-4 border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all bg-white/[0.04] backdrop-blur-md group"
                          >
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedAlbum({ name: group.albumName, type: group.type, artwork: group.artwork, artist: group.displayTrack.artist, year: group.displayTrack.year, tracks: group.tracks }); }}
                              className="flex-shrink-0 hover:scale-110 transition-transform"
                            >
                              <img src={group.artwork} alt={group.albumName} loading="lazy" className="w-12 h-12 rounded object-cover" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{group.albumName}</p>
                              <p className="text-sm text-white/40">{group.tracks.length} track{group.tracks.length !== 1 ? 's' : ''}</p>
                            </div>
                            <span className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wider flex-shrink-0">{group.type}</span>
                            <ChevronDown size={18} className={`text-white/40 group-hover:text-white/60 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                              {group.tracks
                                .sort((a: Track, b: Track) => (a.trackNumber || 0) - (b.trackNumber || 0))
                                .map((track: Track, index: number) => (
                                  <div key={track.id} className="pl-6 md:pl-8">
                                    <TrackListItem
                                      track={track} onClickTrack={handleTrackClick} onPlay={handlePlayTrack}
                                      onTogglePlay={handleTogglePlayTrack} onBuy={handleBuyTrack}
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
                          onPlay={handlePlayTrack} onTogglePlay={handleTogglePlayTrack} onBuy={handleBuyTrack}
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

      {/* ── REMIXES TAB ── */}
      {activeTab === 'remixes' && (
        <>
          <section className="px-6 md:px-12 pt-6 pb-2">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  title="Filters"
                  className="flex items-center justify-center w-9 h-9 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
                >
                  <Sliders size={15} />
                </button>
              </div>
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

          {remixesLoading && (
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto"><LoadingSpinner text="Loading remixes..." /></div>
            </section>
          )}

          {!remixesLoading && (
            <section className="px-6 md:px-12 py-2 md:py-4">
              <div className="max-w-7xl mx-auto">
                <div className="space-y-3">
                  {remixTracks
                    .filter(t =>
                      (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                      (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                      (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                      genreMatches(t.genre, selectedRemixGenre)
                    )
                    .sort((a, b) => {
                      const aSort = a.sortOrder ?? Number.MAX_VALUE;
                      const bSort = b.sortOrder ?? Number.MAX_VALUE;
                      if (aSort !== bSort) return bSort - aSort;
                      return b.createdAt - a.createdAt;
                    })
                    .map(remix => (
                      <TrackListItem
                        key={remix.id} track={remix} onClickTrack={handleTrackClick}
                        onPlay={handlePlayTrack} onTogglePlay={handleTogglePlayTrack}
                        showType={false} showMetadata isPlaying={isPlaying}
                      />
                    ))}
                </div>
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
                  <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
                  <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">
                    {remixTracks.filter(t =>
                      (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                      (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                      (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                      genreMatches(t.genre, selectedRemixGenre)
                    ).length} Track{remixTracks.filter(t =>
                      (selectedRemixType === 'All' || t.remixType === selectedRemixType) &&
                      (selectedRemixYear === 'All' || t.year === selectedRemixYear) &&
                      (selectedRemixCollab === 'All' || t.collab === selectedRemixCollab) &&
                      genreMatches(t.genre, selectedRemixGenre)
                    ).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── DJ SETS TAB ── */}
      {activeTab === 'djsets' && (
        <section className="px-6 md:px-12 pt-6 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {djSetVideos.map(set => (
              <div
                key={set.id}
                className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                {playingDjSet === set.id ? (
                  <iframe
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${set.youtubeId}?autoplay=1`}
                    title={set.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <button
                    onClick={() => setPlayingDjSet(set.id)}
                    className="w-full relative aspect-video group"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${set.youtubeId}/maxresdefault.jpg`}
                      alt={set.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-red-600/40">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="font-bold text-white">{set.title}</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${set.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/40 hover:text-red-400 transition-colors uppercase tracking-wider"
                  >
                    YouTube ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
