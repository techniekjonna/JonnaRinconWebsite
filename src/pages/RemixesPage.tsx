import { useState, useEffect, useMemo } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Sliders, Music } from 'lucide-react';
import { useCyberDecodeInView } from '../hooks/useCyberDecode';
import { useAuth } from '../hooks/useAuth';
import { useTrackDetail } from '../contexts/TrackDetailContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { setCurrentTrack, getCurrentTrack } from '../components/GlobalAudioPlayer';
import TrackListItem from '../components/TrackListItem';
import { useRemixes } from '../hooks/useRemixes';
import { useRelatedTracks } from '../hooks/useRelatedTracks';
import FilterModal from '../components/FilterModal';
import TrackDetailModal from '../components/TrackDetailModal';
import LoginModal from '../components/LoginModal';
import LoadingSpinner from '../components/LoadingSpinner';
import PlaylistModal from '../components/PlaylistModal';
import PlaylistDetailView from '../components/PlaylistDetailView';
import { extractUniqueGenres } from '../lib/utils/genreExtractor';
import { remixService, playlistService } from '../lib/firebase/services';
import { Playlist, Track as FirebaseTrack } from '../lib/firebase/types';

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
}

// Remix Track Interface
interface RemixTrack extends Track {
  remixType?: 'Remix' | 'Edit' | 'Bootleg';
  remixArtist?: string;
  coverArtUrl?: string;
}

export default function RemixesPage() {
  useScrollToTop();
  const { isAuthenticated, isLoading } = useAuth();
  const { remixes: firebaseRemixes, loading: remixesLoading } = useRemixes({ status: 'published' });
  const [selectedRemixType, setSelectedRemixType] = useState<'Remix' | 'Edit' | 'Bootleg' | 'All'>('All');
  const [selectedRemixYear, setSelectedRemixYear] = useState<number | 'All'>('All');
  const [selectedRemixCollab, setSelectedRemixCollab] = useState<'Solo' | 'Collab' | 'All'>('All');
  const [selectedRemixGenre, setSelectedRemixGenre] = useState<string>('All');
  const [selectedRemixSort, setSelectedRemixSort] = useState<'newest' | 'oldest'>('newest');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { selectedTrack, setSelectedTrack, isModalOpen, setIsModalOpen } = useTrackDetail() as any;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistDetailOpen, setIsPlaylistDetailOpen] = useState(false);
  const heroTitle = useCyberDecodeInView('REMIXES');

  // Convert Firebase remixes to local RemixTrack interface
  const remixTracks: RemixTrack[] = firebaseRemixes.map(r => ({
    id: r.id,
    title: r.title,
    artist: r.remixArtist,
    remixArtist: r.remixArtist,
    duration: r.duration || '0:00',
    genre: r.genre,
    bpm: r.bpm,
    key: r.key,
    year: r.year,
    collab: r.collab,
    remixType: r.remixType,
    sortOrder: r.sortOrder,
    audioUrl: r.audioUrl,
    coverArt: r.artworkUrl,
    coverArtUrl: r.artworkUrl,
    createdAt: r.createdAt?.toMillis?.() || Date.now(),
  }));

  // Helper function to check if a remix matches a genre (handles comma-separated)
  const genreMatches = (genre: string | undefined, selectedGenre: string): boolean => {
    if (selectedGenre === 'All') return true;
    if (!genre) return false;
    // Split comma-separated genres and check if any match
    const genres = genre.split(',').map(g => g.trim());
    return genres.includes(selectedGenre);
  };

  const handlePlayRemix = async (remix: RemixTrack) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    // Register play after 15 seconds of playback
    if (remix.id) {
      setTimeout(() => {
        remixService.incrementPlays(remix.id!).catch((error) => {
          console.error('Failed to increment remix plays:', error);
        });
      }, 15000);
    }

    // Filter remixes matching current filters and create queue
    const queue = remixTracks
      .filter((r) => {
        const typeMatch = selectedRemixType === 'All' || r.remixType === selectedRemixType;
        const yearMatch = selectedRemixYear === 'All' || r.year === selectedRemixYear;
        const collabMatch = selectedRemixCollab === 'All' || r.collab === selectedRemixCollab;
        const genreMatch = genreMatches(r.genre, selectedRemixGenre);
        return typeMatch && yearMatch && collabMatch && genreMatch;
      })
      .sort((a, b) => {
        if (selectedRemixSort === 'newest') {
          return b.createdAt - a.createdAt;
        } else {
          return a.createdAt - b.createdAt;
        }
      });

    setCurrentTrack(remix, queue);
  };

  const handleTogglePlayRemix = (remix: RemixTrack) => {
    const currentTrack = getCurrentTrack();

    if (currentTrack?.id === remix.id) {
      // If clicking the same track, toggle play/pause
      setIsPlaying(!isPlaying);
      // The actual play/pause would be handled by the global audio player
      // This just toggles the UI state
    } else {
      // If clicking a different track, play it
      handlePlayRemix(remix);
      setIsPlaying(true);
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsPlaylistDetailOpen(true);
  };

  const handleAddToPlaylist = async (trackId: string, playlistId: string) => {
    try {
      await playlistService.addTrackToPlaylist(playlistId, trackId);
      // Show success feedback
      console.log('Remix added to playlist');
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  const handlePlayPlaylistTracks = (playlistTracks: FirebaseTrack[], startIndex: number = 0) => {
    if (playlistTracks.length === 0) return;

    // Convert Firebase tracks/remixes to local RemixTrack interface
    const tracksToPlay = playlistTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      duration: t.duration || '0:00',
      genre: t.genre,
      bpm: t.bpm,
      key: t.key,
      year: t.year,
      collab: t.collab,
      audioUrl: t.audioUrl,
      coverArt: t.artworkUrl,
      createdAt: t.createdAt?.toMillis?.() || Date.now(),
      remixType: (t as any).remixType,
      remixArtist: (t as any).remixArtist || t.artist,
      sortOrder: (t as any).sortOrder,
    } as RemixTrack));

    if (tracksToPlay.length > 0) {
      const trackToPlay = tracksToPlay[startIndex] || tracksToPlay[0];
      setCurrentTrack(trackToPlay, tracksToPlay);
      setIsPlaying(true);
    }
  };

  const filteredRemixes = remixTracks.filter(remix => {
    const typeMatch = selectedRemixType === 'All' || remix.remixType === selectedRemixType;
    const yearMatch = selectedRemixYear === 'All' || remix.year === selectedRemixYear;
    const collabMatch = selectedRemixCollab === 'All' || remix.collab === selectedRemixCollab;
    const genreMatch = genreMatches(remix.genre, selectedRemixGenre);
    return typeMatch && yearMatch && collabMatch && genreMatch;
  });

  // Handler to open remix detail modal when clicking on a remix
  const handleRemixClick = (remix: RemixTrack) => {
    setSelectedTrack(remix as any);
    setIsModalOpen(true);
  };

  const years = Array.from(new Set(remixTracks.map(r => r.year).filter(Boolean))).sort((a, b) => b - a) as number[];

  // Extract dynamic genres for remixes
  const remixGenres = useMemo(() => {
    return extractUniqueGenres(remixTracks, { sort: true });
  }, [remixTracks]);

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} isLightMode={false} />

      {/* Login Modal for playing remixes */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Remix Detail Modal */}
      <TrackDetailModal
        track={selectedTrack}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isPlaying={selectedTrack ? false : false}
        onPlay={handlePlayRemix}
        relatedTracks={useRelatedTracks(selectedTrack, [])}
        onAddToPlaylist={handleAddToPlaylist}
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
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
              REMIXES, EDITS, BOOTLEGS
            </h2>

            {/* Filter & Playlist Buttons - Mobile only */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
              >
                <Sliders size={16} />
                Filters
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                >
                  <Music size={16} />
                  Playlists
                </button>
              )}
            </div>
          </div>

          {/* Filter & Playlist Buttons - Desktop only */}
          <div className="hidden md:flex justify-center gap-3 mb-8">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
            >
              <Sliders size={16} />
              Filters
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
              >
                <Music size={16} />
                Playlists
              </button>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-center text-white/50 text-sm md:text-base max-w-2xl mx-auto">
            Original remixes, edits, and bootleg versions of tracks across multiple genres. Discover reinterpretations and creative takes on popular music. All tracks are downloadable.
          </p>
        </div>
      </section>

      {/* Remix Content Section */}
      <section className="px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto">

          {/* Filter Modal */}
          <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onReset={() => {
              setSelectedRemixType('All');
              setSelectedRemixYear('All');
              setSelectedRemixCollab('All');
              setSelectedRemixGenre('All');
              setSelectedRemixSort('newest');
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
                options: ['All', ...years],
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
                onChange: (value) => setSelectedRemixGenre(value),
              },
              {
                label: 'Sort',
                options: ['Newest', 'Oldest'],
                value: selectedRemixSort === 'newest' ? 'Newest' : 'Oldest',
                onChange: (value) => setSelectedRemixSort(value === 'Newest' ? 'newest' : 'oldest'),
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
            {filteredRemixes
              .sort((a, b) => {
                // Sort by sortOrder first (if set in admin), then by createdAt
                const aSort = a.sortOrder ?? Number.MAX_VALUE;
                const bSort = b.sortOrder ?? Number.MAX_VALUE;
                if (aSort !== bSort) return bSort - aSort;

                if (selectedRemixSort === 'newest') {
                  return b.createdAt - a.createdAt;
                } else {
                  return a.createdAt - b.createdAt;
                }
              })
              .map((remix) => (
                <TrackListItem
                  key={remix.id}
                  track={remix}
                  onClickTrack={handleRemixClick}
                  onPlay={handlePlayRemix}
                  onTogglePlay={handleTogglePlayRemix}
                  showType={false}
                  showMetadata={true}
                  showDownload={true}
                  isPlaying={isPlaying}
                />
              ))}
          </div>

          {/* Discography Footer */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
            <p className="text-[10px] md:text-xs text-red-500/60 uppercase tracking-[0.4em]">Discography</p>
            <p className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">
              {filteredRemixes.length} Remix{filteredRemixes.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
