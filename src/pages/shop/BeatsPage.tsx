import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Grid3x3, List, Play, Pause, ShoppingCart, X, Sliders, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Beat, BeatPack } from '../../lib/firebase/types';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useCyberDecodeInView } from '../../hooks/useCyberDecode';
import { useCart } from '../../hooks/useCart';
import { toDirectUrl } from '../../lib/utils/urlUtils';
import { getPlayButtonContainerClass, getPlayButtonSymbolClass, getRowHighlightClass } from '../../lib/utils/buttonStyles';
import { setCurrentTrack, getCurrentTrack, getIsPlaying } from '../../components/GlobalAudioPlayer';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import FilterModal from '../../components/FilterModal';
import BeatDetailModal from '../../components/BeatDetailModal';
import BeatPackDetailModal from '../../components/BeatPackDetailModal';
import { beatService, beatPackService } from '../../lib/firebase/services';
import { useScrollToTop } from '../../hooks/useScrollToTop';

const BeatsShop: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const { cartItems, addToCart } = useCart();
  const [filter, setFilter] = useState<{
    genre?: string;
    search?: string;
    sortBy: 'newest' | 'popular' | 'price_low' | 'price_high';
  }>({
    sortBy: 'newest',
  });
  const [dynamicGenres, setDynamicGenres] = useState<string[]>([]);
  const [beatPacks, setBeatPacks] = useState<BeatPack[]>([]);
  const [packIndex, setPackIndex] = useState(0);
  const [selectedPack, setSelectedPack] = useState<BeatPack | null>(null);

  const heroTitle = useCyberDecodeInView('BEATSTORE');

  useEffect(() => {
    const unsub = beatPackService.subscribeToPacks((packs) => {
      setBeatPacks(packs);
      setPackIndex((i) => Math.min(i, Math.max(0, packs.length - 1)));
    });
    return () => unsub();
  }, []);

  // Use same real-time Firebase listener as homepage BeatStore component
  useEffect(() => {
    setLoading(true);

    const beatsQuery = query(
      collection(db, 'beats'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      beatsQuery,
      (snapshot) => {
        const beatsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            audioUrl: toDirectUrl(data.audioUrl || ''),
            artworkUrl: toDirectUrl(data.artworkUrl || ''),
          } as Beat;
        });
        setBeats(beatsData);

        // Extract unique genres dynamically and split comma-separated genres
        const uniqueGenres = Array.from(new Set(
          beatsData
            .map(b => b.genre)
            .filter((g): g is string => !!g)
            .flatMap(g => g.split(',').map(genre => genre.trim()))
        )).sort();
        setDynamicGenres(uniqueGenres);

        setLoading(false);
      },
      (err) => {
        console.error('Firebase error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isCurrentBeatPlaying = (beatId: string) => {
    const currentTrack = getCurrentTrack();
    return currentTrack?.id === beatId;
  };

  const handlePlayBeat = async (beat: Beat) => {
    // Register play after 15 seconds of playback
    if (beat.id) {
      setTimeout(() => {
        beatService.incrementPlays(beat.id!).catch((error) => {
          console.error('Failed to increment beat plays:', error);
        });
      }, 15000);
    }

    // Convert beat to track format
    const trackBeat = {
      id: beat.id,
      title: beat.title,
      artist: beat.producer || 'Unknown',
      audioUrl: beat.audioUrl,
      coverArt: beat.artworkUrl,
      duration: '0:00',
      genre: beat.genre || '',
      type: 'Single' as const,
      year: new Date().getFullYear(),
      collab: 'Solo' as const,
      createdAt: beat.createdAt?.seconds ? beat.createdAt.seconds * 1000 : Date.now(),
      _isBeat: true, // Mark as beat for player
      _beatData: beat, // Store original beat data
    } as any;

    // Use global player
    setCurrentTrack(trackBeat, [trackBeat]);
  };


  const hasActiveFilters = !!(filter.genre || filter.search || filter.sortBy !== 'newest');

  // Apply client-side filtering and sorting
  const filteredBeats = (() => {
    let result = [...beats];

    if (filter.genre) {
      result = result.filter((b) => {
        if (!b.genre) return false;
        const genres = b.genre.split(',').map(g => g.trim());
        return genres.includes(filter.genre);
      });
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.artist.toLowerCase().includes(search) ||
          b.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    result.sort((a, b) => {
      switch (filter.sortBy) {
        case 'newest':
          // Sort by sortOrder first (if set in admin), then by createdAt
          const aSort = a.sortOrder ?? (a.createdAt?.toMillis?.() || 0);
          const bSort = b.sortOrder ?? (b.createdAt?.toMillis?.() || 0);
          if (aSort !== bSort) return bSort - aSort;
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        case 'popular':
          return b.plays - a.plays;
        case 'price_low':
          return (a.licenses.basic?.price || 0) - (b.licenses.basic?.price || 0);
        case 'price_high':
          return (b.licenses.basic?.price || 0) - (a.licenses.basic?.price || 0);
        default:
          return 0;
      }
    });

    return result;
  })();

  const featuredBeats = filteredBeats.filter(b => b.featured);
  const trendingBeats = filteredBeats.filter(b => b.trending);

  return (
    <div className="min-h-screen text-white">
      {/* Fixed Dark Overlay */}
      <div className="fixed inset-0 w-full h-screen -z-10 bg-black/20" />

      <Navigation isDarkOverlay={true} />

      {/* Hero Section - Centered Layout */}
      <section className="relative pt-40 px-6 md:px-12 pb-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h1 ref={heroTitle.ref as React.RefObject<HTMLHeadingElement>} style={{fontSize: 'clamp(1.875rem, 8vw, 10.2rem)'}} className="font-black uppercase leading-[0.85] tracking-tighter mb-8 text-center">
            {heroTitle.display}
          </h1>

          {/* Filter Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-lg text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
            >
              <Sliders size={16} />
              Filters
            </button>
          </div>
        </div>
      </section>

      {/* Filter Modal */}
      <section className="px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onReset={() => {
              setFilter({ sortBy: 'newest' });
            }}
            filters={[
              {
                label: 'Genre',
                options: ['All', ...dynamicGenres],
                value: filter.genre || 'All',
                onChange: (value) => setFilter({ ...filter, genre: value === 'All' ? undefined : (value as string) }),
              },
              {
                label: 'Sort',
                options: ['Newest', 'Popular', 'Price: Low', 'Price: High'],
                value: filter.sortBy === 'newest' ? 'Newest' : filter.sortBy === 'popular' ? 'Popular' : filter.sortBy === 'price_low' ? 'Price: Low' : 'Price: High',
                onChange: (value) => {
                  const sortMap: Record<string, typeof filter.sortBy> = {
                    'Newest': 'newest',
                    'Popular': 'popular',
                    'Price: Low': 'price_low',
                    'Price: High': 'price_high',
                  };
                  setFilter({ ...filter, sortBy: sortMap[value as string] || 'newest' });
                },
              },
            ]}
          />
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-6 md:px-12 py-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search beats..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-full text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 transition-all text-sm"
              />
            </div>

            {/* View Mode & Clear */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 bg-white/[0.06] border border-white/[0.08] rounded-full text-white/40 hover:text-white/70 hover:bg-white/[0.10] transition-all"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => setFilter({ sortBy: 'newest' })}
                  className="p-3 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 hover:bg-red-600/30 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Beat Detail Modal */}
      <BeatDetailModal
        beat={selectedBeat}
        isOpen={!!selectedBeat}
        onClose={() => setSelectedBeat(null)}
        onAddToCart={addToCart}
        isPlaying={selectedBeat ? getCurrentTrack()?.id === selectedBeat.id : false}
        onPlay={handlePlayBeat}
        cartCount={cartItems.length}
      />

      {/* Beat Pack Detail Modal */}
      <BeatPackDetailModal
        pack={selectedPack}
        isOpen={!!selectedPack}
        onClose={() => setSelectedPack(null)}
      />

      <div className={`max-w-7xl mx-auto px-6 md:px-12 ${beatPacks.length > 0 || trendingBeats.length > 0 ? 'py-12 md:py-16' : 'py-8 md:py-10'}`}>

        {/* Beat Packs Carousel */}
        {beatPacks.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3">
                <Package className="w-7 h-7 md:w-9 md:h-9 text-red-500" />
                Beat Packs
              </h2>
              {beatPacks.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPackIndex((i) => (i - 1 + beatPacks.length) % beatPacks.length)}
                    className="p-3 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                    aria-label="Previous pack"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs text-white/40 px-2">{packIndex + 1} / {beatPacks.length}</span>
                  <button
                    onClick={() => setPackIndex((i) => (i + 1) % beatPacks.length)}
                    className="p-3 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.12] transition-all"
                    aria-label="Next pack"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {beatPacks[packIndex] && (
              <button
                onClick={() => setSelectedPack(beatPacks[packIndex])}
                className="w-full text-left group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.06] hover:border-white/[0.15] transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                  <div className="md:col-span-2 relative aspect-square md:aspect-auto overflow-hidden">
                    <img
                      src={beatPacks[packIndex].coverUrl || '/JEIGHTENESIS.jpg'}
                      alt={beatPacks[packIndex].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 md:to-black/60" />
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 rounded-full text-xs font-bold uppercase shadow-lg flex items-center gap-1.5">
                      <Package size={12} /> Pack
                    </div>
                  </div>
                  <div className="md:col-span-3 p-6 md:p-10 flex flex-col justify-center">
                    <p className="text-xs uppercase tracking-widest text-red-400/80 font-bold mb-3">
                      {beatPacks[packIndex].beats.length} Beat{beatPacks[packIndex].beats.length !== 1 ? 's' : ''} · Beat Pack
                    </p>
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                      {beatPacks[packIndex].title}
                    </h3>
                    {beatPacks[packIndex].description && (
                      <p className="text-white/60 text-sm md:text-base mb-6 line-clamp-2">
                        {beatPacks[packIndex].description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/30">From</div>
                        <div className="text-3xl md:text-4xl font-black text-red-500">
                          &euro;{beatPacks[packIndex].price.toFixed(0)}
                        </div>
                      </div>
                      <span className="px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold uppercase tracking-wider transition-all group-hover:scale-105">
                        View Pack
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Trending Section */}
        {!loading && trendingBeats.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-8">Trending</h2>
            <div className="space-y-2">
              {trendingBeats.slice(0, 5).map((beat, index) => (
                <button
                  key={beat.id}
                  onClick={() => setSelectedBeat(beat)}
                  className="w-full flex items-center gap-3 md:gap-5 p-3 md:p-4 bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl group hover:bg-white/[0.06] transition-all text-left"
                >
                  <span className="text-2xl md:text-3xl font-black text-white/15 w-8 md:w-12 text-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    <img src={beat.artworkUrl || '/JEIGHTENESIS.jpg'} alt={beat.title} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.preventDefault(); handlePlayBeat(beat); }}
                      className={`absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ${getPlayButtonContainerClass(isCurrentBeatPlaying(beat.id))}`}
                    >
                      {isCurrentBeatPlaying(beat.id) ? (
                        <Pause className="w-5 h-5 text-red-500" fill="currentColor" />
                      ) : (
                        <Play className="w-5 h-5 text-gray-400 ml-0.5" fill="currentColor" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base truncate">{beat.title}</h3>
                    <p className="text-xs text-white/40 truncate">{beat.artist}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-white/30">
                    <span>{beat.plays.toLocaleString()} plays</span>
                    <span>{beat.genre}</span>
                    <span>{beat.bpm} BPM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base md:text-lg font-black text-red-500">
                      &euro;{beat.licenses.exclusive?.price.toFixed(0) || '0'}
                    </span>
                    <span className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs md:text-sm font-semibold transition-all">
                      View
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {!loading && (beatPacks.length > 0 || trendingBeats.length > 0) && (
          <div className="my-12 border-t border-white/[0.06]" />
        )}

        {/* All Beats Section */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">All Beats</h2>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-12 h-12 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
            <p className="text-sm text-white/30 uppercase tracking-widest">Loading beats...</p>
          </div>
        ) : filteredBeats.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl p-12 max-w-md mx-auto">
              <p className="text-xl font-bold mb-2">No beats found</p>
              <p className="text-white/40 text-sm">
                {hasActiveFilters ? 'Try adjusting your search filters' : 'Beats will appear here once published'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => setFilter({ sortBy: 'newest', search: undefined, genre: undefined })}
                  className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredBeats.map((beat) => (
              <button
                key={beat.id}
                onClick={() => setSelectedBeat(beat)}
                className="group text-left bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="relative aspect-square">
                  <img
                    src={beat.artworkUrl || '/JEIGHTENESIS.jpg'}
                    alt={beat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {beat.featured && (
                      <span className="px-2 py-0.5 bg-red-600 rounded-full text-[10px] font-bold uppercase shadow-lg">
                        Featured
                      </span>
                    )}
                    {beat.trending && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase">
                        Trending
                      </span>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={(e) => { e.preventDefault(); handlePlayBeat(beat); }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl hover:scale-110 transition-transform ${getPlayButtonContainerClass(isCurrentBeatPlaying(beat.id))}`}>
                      {isCurrentBeatPlaying(beat.id) ? (
                        <Pause className="w-5 h-5 md:w-6 md:h-6 text-red-500" fill="currentColor" />
                      ) : (
                        <Play className="w-5 h-5 md:w-6 md:h-6 text-gray-400 ml-0.5" fill="currentColor" />
                      )}
                    </div>
                  </button>

                  {/* Playing indicator */}
                  {isCurrentBeatPlaying(beat.id) && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-red-600/80 backdrop-blur-sm rounded-full">
                      <div className="flex gap-0.5 items-end h-3">
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{height: '40%', animationDelay: '0ms'}} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{height: '70%', animationDelay: '150ms'}} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{height: '50%', animationDelay: '300ms'}} />
                        <div className="w-0.5 bg-white rounded-full animate-pulse" style={{height: '80%', animationDelay: '100ms'}} />
                      </div>
                      <span className="text-xs font-medium">Playing</span>
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-4">
                  <h3 className="font-bold text-sm md:text-base truncate">{beat.title}</h3>
                  <p className="text-xs text-white/40 truncate mt-0.5">{beat.artist}</p>

                  <div className="flex gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-white/50">{beat.bpm} BPM</span>
                    <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-white/50">{beat.key}</span>
                    <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs text-white/50 hidden md:inline">{beat.genre}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                    <div>
                      <div className="text-[10px] text-white/25 uppercase tracking-wider">From</div>
                      <div className="text-base md:text-lg font-black text-red-500">
                        &euro;{beat.licenses.exclusive?.price.toFixed(0) || '0'}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all group-hover:scale-105">
                      View Beat
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-2">
            {filteredBeats.map((beat, index) => (
              <button
                key={beat.id}
                onClick={() => setSelectedBeat(beat)}
                className={`w-full text-left flex items-center gap-3 md:gap-5 p-3 md:p-4 bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-2xl group hover:bg-white/[0.06] transition-all ${getRowHighlightClass(isCurrentBeatPlaying(beat.id))}`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handlePlayBeat(beat); }}
                  className="flex-shrink-0 p-1.5 hover:bg-white/[0.1] rounded-lg transition-all"
                  title={isCurrentBeatPlaying(beat.id) && getIsPlaying() ? 'Pause' : 'Play'}
                >
                  {isCurrentBeatPlaying(beat.id) && getIsPlaying() ? (
                    <Pause size={16} className="text-red-600" fill="currentColor" />
                  ) : (
                    <Play size={16} className="text-white/60 hover:text-white" fill="currentColor" />
                  )}
                </button>

                <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <img src={beat.artworkUrl || '/JEIGHTENESIS.jpg'} alt={beat.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm md:text-base truncate">{beat.title}</h3>
                    {beat.featured && (
                      <span className="px-2 py-0.5 bg-red-600 rounded-full text-[10px] font-bold flex-shrink-0 uppercase">F</span>
                    )}
                    {beat.trending && (
                      <span className="px-2 py-0.5 bg-white/15 rounded-full text-[10px] font-bold flex-shrink-0 uppercase">T</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{beat.artist}</p>
                </div>

                <div className="hidden md:flex items-center gap-3 text-xs text-white/30 flex-shrink-0">
                  <span>{beat.genre}</span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>{beat.bpm} BPM</span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>{beat.key}</span>
                </div>

                <div className="hidden md:flex items-center gap-4 text-xs text-white/20 flex-shrink-0">
                  <span>{beat.plays.toLocaleString()} plays</span>
                  <span>{beat.likes.toLocaleString()} likes</span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-base md:text-lg font-black text-red-500">
                    &euro;{beat.licenses.exclusive?.price.toFixed(0) || '0'}
                  </span>
                  <span className="hidden md:block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-all group-hover:scale-105">
                    View
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredBeats.length > 0 && (
          <div className="mt-10 text-center">
            <span className="text-[10px] uppercase tracking-widest text-white/20">
              Showing {filteredBeats.length} beat{filteredBeats.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BeatsShop;
