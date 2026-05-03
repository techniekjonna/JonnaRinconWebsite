import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Play, ExternalLink, ChevronLeft, ChevronRight, Music, Headphones, Disc3, Radio, Award, Mic2, ChevronDown, Sliders } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../hooks/useAuth';
import { useTrackDetail } from '../contexts/TrackDetailContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { usePlayTracking } from '../hooks/usePlayTracking';
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

const buttons = [
  { id: 'tracks', label: 'Tracks', icon: Music },
  { id: 'remixes', label: 'Remixes', icon: Disc3 },
  { id: 'djsets', label: 'DJ Sets', icon: Radio },
  { id: 'productions', label: 'Productions', icon: Headphones },
  { id: 'spotify', label: 'Spotify', icon: Music },
  { id: 'support', label: 'Support', icon: Award },
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

// Track data structure
interface Track {
  id: string;
  artist: string;
  title: string;
  audioUrl?: string;
  coverArt?: string;
  createdAt: number;     // Timestamp for sorting
  type?: 'Album' | 'EP' | 'Single' | 'Exclusive';
  year?: number;
  collab?: 'Solo' | 'Collab';
  genre?: string;
  bpm?: number;
  key?: string;          // Musical key (e.g., C Major, A Minor)
  duration?: string;
  album?: string;        // Album name for grouping
  trackNumber?: number;  // Track position in album
  sortOrder?: number;    // Sort order for single tracks/beats/remixes
  isFree?: boolean;
  licenses?: { exclusive?: { price: number } };
}

// Remix Track Interface
interface RemixTrack extends Track {
  remixType?: 'Remix' | 'Edit' | 'Bootleg';
}

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

const stats = [
  { value: '1M+', label: 'Spotify Streams' },
  { value: '100K+', label: 'YouTube Views' },
  { value: '100+', label: 'Original Tracks' },
  { value: '100+', label: 'Remixes & Edits' },
  { value: '10+', label: 'Years Producing' },
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

export default function TracksPage() {
  useScrollToTop();
  const { isAuthenticated, isLoading } = useAuth();
  const { addTrackToCart, cartItems = [] } = useCart();
  const { tracks: firebaseTracks, loading: tracksLoading, error: tracksError } = useTracks({ status: 'published' });
  const { remixes: firebaseRemixes, loading: remixesLoading } = useRemixes({ status: 'published' });
  const [activeTab, setActiveTab] = useState('tracks');
  const [currentPlaylist, setCurrentPlaylist] = useState(0);
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
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [trackSettings, setTrackSettings] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistDetailOpen, setIsPlaylistDetailOpen] = useState(false);
  const heroTitle = useCyberDecodeInView('Music');

  // Convert Firebase tracks to local Track interface - Maps all track data including album field
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

  // Convert Firebase remixes to local RemixTrack interface
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

  // Helper function to check if a track/remix matches a genre
  const genreMatches = (genre: string | undefined, selectedGenre: string): boolean => {
    if (selectedGenre === 'All') return true;
    if (!genre) return false;
    // Split comma-separated genres and check if any match
    const genres = genre.split(',').map(g => g.trim());
    return genres.includes(selectedGenre);
  };

  const handlePlayTrack = async (track: Track) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    // Register play after 15 seconds of playback
    if (track.id) {
      setTimeout(() => {
        trackService.incrementPlays(track.id!).catch((error) => {
          console.error('Failed to increment track plays:', error);
        });
      }, 15000);
    }

    // Filter tracks matching current filters and create queue
    const queue = demoTracks
      .filter((t) => {
        const typeMatch = selectedType === 'All' || t.type === selectedType;
        const yearMatch = selectedYear === 'All' || t.year === selectedYear;
        const collabMatch = selectedCollab === 'All' || t.collab === selectedCollab;
        const genreMatch = genreMatches(t.genre, selectedGenre);
        return typeMatch && yearMatch && collabMatch && genreMatch;
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    setCurrentTrack(track, queue);
  };

  const handleBuyTrack = (track: Track) => {
    // Convert local Track to the firebase Track shape expected by addTrackToCart
    const firebaseTrack = firebaseTracks.find(t => t.id === track.id);
    if (firebaseTrack) {
      addTrackToCart(firebaseTrack);
    }
  };

  const handleAddToPlaylist = async (trackId: string, playlistId: string) => {
    try {
      await playlistService.addTrackToPlaylist(playlistId, trackId);
      // Show success feedback
      console.log('Track added to playlist');
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  const handleTogglePlayTrack = (track: Track) => {
    const currentTrack = getCurrentTrack();

    if (currentTrack?.id === track.id) {
      // If clicking the same track, toggle play/pause
      setIsPlaying(!isPlaying);
      // The actual play/pause would be handled by the global audio player
      // This just toggles the UI state
    } else {
      // If clicking a different track, play it
      handlePlayTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsPlaylistDetailOpen(true);
  };

  const handlePlayPlaylistTracks = (playlistTracks: FirebaseTrack[], startIndex: number = 0) => {
    if (playlistTracks.length === 0) return;

    // Convert Firebase tracks to local Track interface
    const tracksToPlay = playlistTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      trackNumber: t.trackNumber,
      duration: t.duration || '0:00',
      genre: t.genre,
      bpm: t.bpm,
      key: t.key,
      year: t.year,
      type: t.type,
      collab: t.collab,
      audioUrl: t.audioUrl,
      coverArt: t.artworkUrl,
      createdAt: t.createdAt?.toMillis?.() || Date.now(),
      isFree: t.isFree,
      licenses: t.licenses,
    }));

    if (tracksToPlay.length > 0) {
      const trackToPlay = tracksToPlay[startIndex] || tracksToPlay[0];
      setCurrentTrack(trackToPlay, tracksToPlay);
      setIsPlaying(true);
    }
  };

  const matchesTypeTab = (track: Track): boolean => {
    switch (selectedTypeTab) {
      case 'Singles':
        return !track.album && (track.type === 'Single' || track.type === 'Exclusive');
      case 'Albums & EPs':
        return track.type === 'Album' || track.type === 'EP';
      case 'All':
        return true;
      default:
        return false;
    }
  };

  // Handler to open track detail modal when clicking on a track
  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  };

  const isCustomTab = (
    (trackSettings?.customTab1Enabled && selectedTypeTab === (trackSettings.customTab1Label || 'Custom 1')) ||
    (trackSettings?.customTab2Enabled && selectedTypeTab === (trackSettings.customTab2Label || 'Custom 2'))
  );

  const getCustomTracksForTab = (): Track[] => {
    const isCustom1 = trackSettings?.customTab1Enabled &&
      selectedTypeTab === (trackSettings.customTab1Label || 'Custom 1');

    const button = isCustom1 ? trackSettings?.customButton1 : trackSettings?.customButton2;
    const trackIds: string[] = button?.trackIds || [];

    if (trackIds.length === 0) return [];
    return demoTracks.filter(track => trackIds.includes(track.id));
  };

  const filteredTracks = isCustomTab
    ? getCustomTracksForTab()
    : demoTracks.filter(track => {
      const tabMatch = matchesTypeTab(track);
      const typeMatch = selectedType === 'All' || track.type === selectedType;
      const yearMatch = selectedYear === 'All' || track.year === selectedYear;
      const collabMatch = selectedCollab === 'All' || track.collab === selectedCollab;
      const genreMatch = genreMatches(track.genre, selectedGenre);
      return tabMatch && typeMatch && yearMatch && collabMatch && genreMatch;
    });

  const years = Array.from(new Set(demoTracks.map(t => t.year).filter(Boolean))).sort((a, b) => b - a) as number[];

  // Extract dynamic genres for tracks
  const trackGenres = useMemo(() => {
    return extractUniqueGenres(demoTracks, { sort: true });
  }, [demoTracks]);

  // Extract dynamic genres for remixes
  const remixGenres = useMemo(() => {
    return extractUniqueGenres(remixTracks, { sort: true });
  }, [remixTracks]);

  // Group tracks by album for Album/EP types
  const groupedTracks = filteredTracks.reduce((acc, track) => {
    if (track.type === 'Album' || track.type === 'EP') {
      // Use album field, fallback to title for backward compatibility
      const albumName = track.album || track.title;
      const albumKey = `${track.type}:${albumName}`;

      if (!acc[albumKey]) {
        acc[albumKey] = {
          albumName: albumName,
          type: track.type,
          artwork: track.coverArt,
          tracks: [],
          displayTrack: track,
        };
      }
      acc[albumKey].tracks.push(track);
    } else {
      // Single tracks
      const singleKey = `single:${track.id}`;
      acc[singleKey] = {
        albumName: null,
        type: track.type,
        artwork: track.coverArt,
        tracks: [track],
        displayTrack: track,
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const toggleAlbumExpand = (albumKey: string) => {
    const newExpanded = new Set(expandedAlbums);
    if (newExpanded.has(albumKey)) {
      newExpanded.delete(albumKey);
    } else {
      newExpanded.add(albumKey);
    }
    setExpandedAlbums(newExpanded);
  };

  // Clear expanded albums when filters change
  useEffect(() => {
    setExpandedAlbums(new Set());
  }, [selectedType, selectedYear, selectedGenre, selectedCollab]);

  // Load shop settings for custom tabs
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [shopData, trackData] = await Promise.all([
          settingsService.getShopSettings(),
          settingsService.getTrackSettings(),
        ]);
        setShopSettings(shopData);
        setTrackSettings(trackData);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Show login modal if not authenticated
  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Login Modal for playing tracks */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Track Detail Modal */}
      <TrackDetailModal
        track={selectedTrack}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPlaying={selectedTrack ? false : false}
        onPlay={handlePlayTrack}
        onBuy={handleBuyTrack}
        cartItems={cartItems}
        relatedTracks={useRelatedTracks(selectedTrack, [])}
        onAddToPlaylist={handleAddToPlaylist}
      />

      {/* Album Modal */}
      <AlbumModal
        album={selectedAlbum}
        isOpen={!!selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onPlaylistSelect={handlePlaylistSelect}
      />

      {/* Playlist Detail View */}
      {selectedPlaylist && (
        <PlaylistDetailView
          playlist={selectedPlaylist}
          isOpen={isPlaylistDetailOpen}
          onClose={() => {
            setIsPlaylistDetailOpen(false);
            setSelectedPlaylist(null);
          }}
          onPlayTracks={handlePlayPlaylistTracks}
          isPlaying={isPlaying}
        />
      )}

      {/* Hero Section - Compact */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center">
            {heroTitle.display}
          </h1>

          {/* Page Title */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white whitespace-nowrap">
              {buttons.find(b => b.id === activeTab)?.label}
            </h2>

            {/* Filter & Playlist Buttons - Mobile only, conditional */}
            {(activeTab === 'tracks' || activeTab === 'remixes') && (
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                >
                  <Sliders size={16} />
                  Filters
                </button>
                {activeTab === 'tracks' && isAuthenticated && (
                  <button
                    onClick={() => setIsPlaylistModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                  >
                    <Music size={16} />
                    Playlists
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filter & Playlist Buttons - Desktop only, conditional */}
          {(activeTab === 'tracks' || activeTab === 'remixes') && (
            <div className="hidden md:flex justify-center gap-3 mb-8">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
              >
                <Sliders size={16} />
                Filters
              </button>
              {activeTab === 'tracks' && isAuthenticated && (
                <button
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                >
                  <Music size={16} />
                  Playlists
                </button>
              )}
            </div>
          )}

          {/* Type Filter Tabs - Mobile and Desktop */}
          {activeTab === 'tracks' && (() => {
            const tabsList = ['Singles', 'Albums & EPs', 'All']
              .concat(trackSettings?.customTab1Enabled ? [trackSettings.customTab1Label || 'Custom 1'] : [])
              .concat(trackSettings?.customTab2Enabled ? [trackSettings.customTab2Label || 'Custom 2'] : []);

            return (
              <div className="w-full">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tabsList.length}, 1fr)` }}>
                  {tabsList.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTypeTab(tab as any)}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                        selectedTypeTab === tab
                          ? 'bg-red-600 text-white border-red-500/50'
                          : 'bg-white/[0.06] text-white/60 border-white/[0.1] hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* === TRACKS TAB === */}
      {activeTab === 'tracks' && (
        <>
          {/* Track Content - No separate filter button */}
          <section className="px-6 md:px-12 py-4">
            <div className="max-w-7xl mx-auto">

              {/* Error Banner */}
              {tracksError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                  <p className="text-red-400 text-sm font-semibold">
                    ⚠️ {tracksError}
                  </p>
                </div>
              )}

              {/* Filter Modal */}
              <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onReset={() => {
                  setSelectedType('All');
                  setSelectedYear('All');
                  setSelectedCollab('All');
                  setSelectedGenre('All');
                  setSelectedSort('newest');
                }}
                filters={[
                  {
                    label: 'Type',
                    options: ['All', 'Album', 'EP', 'Single', 'Exclusive'],
                    value: selectedType,
                    onChange: (value) => setSelectedType(value as typeof selectedType),
                  },
                  {
                    label: 'Year',
                    options: ['All', ...years],
                    value: selectedYear,
                    onChange: (value) => setSelectedYear(value as typeof selectedYear),
                  },
                  {
                    label: 'Collab',
                    options: ['All', 'Solo', 'Collab'],
                    value: selectedCollab,
                    onChange: (value) => setSelectedCollab(value as typeof selectedCollab),
                  },
                  {
                    label: 'Genre',
                    options: ['All', ...trackGenres],
                    value: selectedGenre,
                    onChange: (value) => setSelectedGenre(value),
                  },
                  {
                    label: 'Sort',
                    options: ['Newest', 'Oldest'],
                    value: selectedSort === 'newest' ? 'Newest' : 'Oldest',
                    onChange: (value) => setSelectedSort(value === 'Newest' ? 'newest' : 'oldest'),
                  },
                ]}
              />
            </div>
          </section>


          {/* Loading Spinner */}
          {tracksLoading && (
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto">
                <LoadingSpinner text="Loading tracks..." />
              </div>
            </section>
          )}

          {/* Mixed Track List / Album Groups OR Year Groups */}
          {!tracksLoading && (
            <section className="px-6 md:px-12 py-2 md:py-4">
              <div className="max-w-7xl mx-auto">
                {/* Album/Type-based grouping for all types */}
                <div className="space-y-3">
                  {Object.entries(groupedTracks)
                    .sort(([, a], [, b]) => {
                      // Albums sorted by createdAt (newest first)
                      if ((a.albumName && b.albumName) || (!a.albumName && !b.albumName)) {
                        return (b.displayTrack.sortOrder ?? b.displayTrack.createdAt) - (a.displayTrack.sortOrder ?? a.displayTrack.createdAt);
                      }
                      // Albums appear before single tracks
                      return a.albumName ? -1 : 1;
                    })
                    .map(([albumKey, group]) => {
                      const isAlbum = group.albumName && (group.type === 'Album' || group.type === 'EP');
                      const isExpanded = expandedAlbums.has(albumKey);

                      return isAlbum ? (
                        <div key={albumKey}>
                          {/* Album Header - Compact Tab Style */}
                          <button
                            onClick={() => toggleAlbumExpand(albumKey)}
                            className="w-full px-6 py-4 flex items-center gap-4 border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all bg-white/[0.04] backdrop-blur-md group"
                          >
                            {/* Album Cover - Small - Clickable */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlbum({
                                  name: group.albumName,
                                  type: group.type,
                                  artwork: group.artwork,
                                  artist: group.displayTrack.artist,
                                  year: group.displayTrack.year,
                                  tracks: group.tracks,
                                });
                              }}
                              className="flex-shrink-0 hover:scale-110 transition-transform"
                              title="View album"
                            >
                              <img
                                src={group.artwork}
                                alt={group.albumName}
                                loading="lazy"
                                className="w-12 h-12 rounded object-cover"
                              />
                            </button>

                            {/* Album Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate">{group.albumName}</p>
                              <p className="text-sm text-white/40">{group.tracks.length} track{group.tracks.length !== 1 ? 's' : ''}</p>
                            </div>

                            {/* Type Badge */}
                            <span className="px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wider flex-shrink-0">
                              {group.type}
                            </span>

                            {/* Expand Icon */}
                            <ChevronDown
                              size={18}
                              className={`text-white/40 group-hover:text-white/60 transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Album Tracks - Expandible Content */}
                          {isExpanded && (
                            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
                              {group.tracks
                                .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
                                .map((track, index) => (
                                  <div key={track.id} className="pl-6 md:pl-8">
                                    <TrackListItem
                                      track={track}
                                      onClickTrack={handleTrackClick}
                                      onPlay={handlePlayTrack}
                                      onTogglePlay={handleTogglePlayTrack}
                                      onBuy={handleBuyTrack}
                                      showType={false}
                                      showMetadata={true}
                                      isAlbumTrack={true}
                                      trackNumber={index + 1}
                                      isPlaying={isPlaying}
                                    />
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Single Tracks
                        <TrackListItem
                          key={albumKey}
                          track={group.displayTrack}
                          onClickTrack={handleTrackClick}
                          onPlay={handlePlayTrack}
                          onTogglePlay={handleTogglePlayTrack}
                          onBuy={handleBuyTrack}
                          showType={true}
                          showMetadata={true}
                          isPlaying={isPlaying}
                        />
                      );
                    })}
              </div>

              {/* Discography Footer */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
                <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
                <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">
                  {filteredTracks.length} Track{filteredTracks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </section>
            )}

          {/* Stats - Compact, Centered */}
          <div className="flex justify-center gap-6 md:gap-8 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <p className="text-base md:text-lg font-black text-white">{stat.value}</p>
                <p className="text-[8px] md:text-[9px] text-white/40 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Skills & Roles */}
          <section className="px-6 md:px-12 py-16 md:py-24">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">What I Do</h2>
              <p className="text-white/25 text-sm mb-10">25 years old — making music since age 13-15 in FL Studio</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <div
                    key={skill.title}
                    className="group bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:bg-white/[0.06]"
                  >
                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">{skill.title}</h3>
                    <p className="text-white/30 text-xs leading-relaxed">{skill.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* === DJ SETS TAB === */}
      {activeTab === 'djsets' && (
        <section className="px-6 md:px-12 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">DJ Sets</h2>
            <p className="text-white/25 text-sm mb-10">Live mixes, festival recordings, and studio sessions</p>

            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-8">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <div
                  className="absolute inset-0 z-10 transition-opacity duration-500 group-[.playing]:opacity-0 group-[.playing]:pointer-events-none"
                  onClick={(e) => {
                    const container = e.currentTarget.closest('.relative');
                    container?.classList.add('playing');
                    const iframe = container?.querySelector('iframe') as HTMLIFrameElement;
                    if (iframe) {
                      const src = iframe.src;
                      iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
                    }
                  }}
                >
                  <img src="DJI_20251017150728_0019_D.JPG" alt="DJ Set thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <iframe
                  width="100%"
                  height="500"
                  src="https://www.youtube.com/embed/videoseries?si=-lcpC5aW0SSgSOXa&amp;list=PLgWPe6V88vwBmK5X5WCsj5kvvCb4IXjkM"
                  title="DJ Sets"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{ borderRadius: '16px' }}
                />
              </div>

              <a
                href="https://youtube.com/playlist?list=PLgWPe6V88vwBmK5X5WCsj5kvvCb4IXjkM"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full inline-block text-center py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02]"
              >
                Watch All DJ Sets on YouTube
              </a>
            </div>

            {/* DJ Set Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                <Mic2 size={24} className="text-red-500 mb-3" />
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Live Mixing</h3>
                <p className="text-white/30 text-sm">Real-time DJ performances blending moombahton, hip hop, EDM, and more into seamless sets.</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                <Radio size={24} className="text-red-500 mb-3" />
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Multi-Genre</h3>
                <p className="text-white/30 text-sm">From moombahton to trap, from R&B to house — every set is a journey through different worlds of sound.</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6">
                <Headphones size={24} className="text-red-500 mb-3" />
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Studio Sessions</h3>
                <p className="text-white/30 text-sm">Intimate studio recordings and production walkthroughs showing the creative process behind the music.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === REMIXES TAB === */}
      {activeTab === 'remixes' && (
        <>
          {/* Filter Modal */}
          <section className="px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
              <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onReset={() => {
                  setSelectedRemixType('All');
                  setSelectedRemixYear('All');
                  setSelectedRemixCollab('All');
                  setSelectedRemixGenre('All');
                }}
                filters={[
                  {
                    label: 'Type',
                    options: ['All', 'Remix', 'Edit', 'Bootleg'],
                    value: selectedRemixType,
                    onChange: (value) => setSelectedRemixType(value as typeof selectedRemixType),
                  },
                  {
                    label: 'Year',
                    options: ['All', ...Array.from(new Set(remixTracks.map(t => t.year))).sort((a, b) => b - a)],
                    value: selectedRemixYear,
                    onChange: (value) => setSelectedRemixYear(value as typeof selectedRemixYear),
                  },
                  {
                    label: 'Collab',
                    options: ['All', 'Solo', 'Collab'],
                    value: selectedRemixCollab,
                    onChange: (value) => setSelectedRemixCollab(value as typeof selectedRemixCollab),
                  },
                  {
                    label: 'Genre',
                    options: ['All', ...remixGenres],
                    value: selectedRemixGenre,
                    onChange: (value) => setSelectedRemixGenre(value as typeof selectedRemixGenre),
                  },
                ]}
              />
            </div>
          </section>

          {/* Loading Spinner */}
          {remixesLoading && (
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-7xl mx-auto">
                <LoadingSpinner text="Loading remixes..." />
              </div>
            </section>
          )}

          {/* Remix Tracks List */}
          {!remixesLoading && (
            <section className="px-6 md:px-12 py-2 md:py-4">
              <div className="max-w-7xl mx-auto">
                <div className="space-y-3">
                {remixTracks
                  .filter((t) => {
                    const typeMatch = selectedRemixType === 'All' || t.remixType === selectedRemixType;
                    const yearMatch = selectedRemixYear === 'All' || t.year === selectedRemixYear;
                    const collabMatch = selectedRemixCollab === 'All' || t.collab === selectedRemixCollab;
                    const genreMatch = genreMatches(t.genre, selectedRemixGenre);
                    return typeMatch && yearMatch && collabMatch && genreMatch;
                  })
                  .sort((a, b) => {
                    // Sort by sortOrder first (if set in admin), then by createdAt
                    const aSort = a.sortOrder ?? Number.MAX_VALUE;
                    const bSort = b.sortOrder ?? Number.MAX_VALUE;
                    if (aSort !== bSort) return bSort - aSort;
                    return b.createdAt - a.createdAt;
                  })
                  .map((remix) => (
                    <TrackListItem
                      key={remix.id}
                      track={remix}
                      onClickTrack={handleTrackClick}
                      onPlay={handlePlayTrack}
                      onTogglePlay={handleTogglePlayTrack}
                      showType={false}
                      showMetadata={true}
                      isPlaying={isPlaying}
                    />
                  ))}
              </div>

              {/* Discography Footer */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
                <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
                <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">
                  {remixTracks.filter((t) => {
                    const typeMatch = selectedRemixType === 'All' || t.remixType === selectedRemixType;
                    const yearMatch = selectedRemixYear === 'All' || t.year === selectedRemixYear;
                    const collabMatch = selectedRemixCollab === 'All' || t.collab === selectedRemixCollab;
                    const genreMatch = selectedRemixGenre === 'All' || t.genre === selectedRemixGenre;
                    return typeMatch && yearMatch && collabMatch && genreMatch;
                  }).length} Track{remixTracks.filter((t) => {
                    const typeMatch = selectedRemixType === 'All' || t.remixType === selectedRemixType;
                    const yearMatch = selectedRemixYear === 'All' || t.year === selectedRemixYear;
                    const collabMatch = selectedRemixCollab === 'All' || t.collab === selectedRemixCollab;
                    const genreMatch = selectedRemixGenre === 'All' || t.genre === selectedRemixGenre;
                    return typeMatch && yearMatch && collabMatch && genreMatch;
                  }).length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            </section>
          )}
        </>
      )}

      {/* === PRODUCTIONS TAB === */}
      {activeTab === 'productions' && (
        <section className="px-6 md:px-12 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">Productions</h2>
            <p className="text-white/25 text-sm mb-10">Original beats, collaborations, and commissioned work</p>

            {/* Mix & Master Showcase */}
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-3xl p-5 md:p-8 mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight mb-6">Mixed & Mastered by Jonna Rincon</h3>
              <div className="rounded-2xl overflow-hidden relative">
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

            {/* Production Process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {['Moombahton', 'Hip Hop', 'R&B', 'Trap', 'EDM', 'Lo-Fi', 'House', 'Drill', 'Afrobeats', 'Reggaeton', 'Pop', 'Latin'].map((genre) => (
                    <span key={genre} className="px-3 py-1.5 bg-white/[0.06] rounded-full text-xs font-bold text-white/50 uppercase tracking-wider">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === SPOTIFY TAB === */}
      {activeTab === 'spotify' && (
        <section className="px-6 md:px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">Spotify</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
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

            {/* Full Spotify Player with Arrows */}
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
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentPlaylist ? 'bg-red-500 w-6' : 'bg-white/10 w-1.5 hover:bg-white/20'
                      }`}
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

      {/* === SUPPORT TAB === */}
      {activeTab === 'support' && (
        <section className="px-6 md:px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">Support</h2>

            {/* Featured Support */}
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

            {/* Artist Support Grid */}
            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Artist Co-Signs & Support</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {supportMentions.filter(s => s.type === 'Artist').map((mention) => (
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

            {/* Streaming Stats */}
            <h3 className="text-xl font-black uppercase tracking-tight mb-6">Streaming Numbers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-red-400">1M+</p>
                <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Spotify Streams</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-red-400">100K+</p>
                <p className="text-white/30 text-xs uppercase tracking-wider mt-2">YouTube Views</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-red-400">100+</p>
                <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Tracks Released</p>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-red-400">100+</p>
                <p className="text-white/30 text-xs uppercase tracking-wider mt-2">Remixes & Edits</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">Want a Custom Beat?</h2>
          <p className="text-white/30 text-sm md:text-base mb-8 max-w-md mx-auto">
            Browse the beat store or get in touch for custom productions
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop/beats" className="px-8 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-white/90 transition-all hover:scale-105 rounded-2xl">
              Beat Store
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
