import { useState, useEffect } from 'react';
import { Search, Filter, Grid3x3, List, Play, Pause, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

// Firebase imports
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

interface Beat {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  genre: string;
  price: number;
  audio_url: string;
  artwork_url: string;
  tags: string[];
  license_basic: boolean;
  license_premium: boolean;
  license_exclusive: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface BeatStoreProps {
  onAddToCart: (beat: Beat, license: 'basic' | 'premium' | 'exclusive') => void;
}

export default function BeatStore({ onAddToCart }: BeatStoreProps) {
  // STATE - REAL DATA FROM FIREBASE
  const [beats, setBeats] = useState<Beat[]>([]);
  const [filteredBeats, setFilteredBeats] = useState<Beat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // FIREBASE REAL-TIME LISTENER
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Query Firestore beats collection
    const beatsQuery = query(
      collection(db, 'beats'),
      where('status', '==', 'published'), // Alleen gepubliceerde beats
      orderBy('createdAt', 'desc')
    );

    // Real-time listener
    const unsubscribe = onSnapshot(
      beatsQuery,
      (snapshot) => {
        const beatsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            price: data.licenses?.basic?.price || data.price || 29,
            created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            updated_at: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
          };
        }) as Beat[];

        setBeats(beatsData);
        setFilteredBeats(beatsData);
        setLoading(false);
      },
      (err) => {
        console.error('Firebase error:', err);
        setError('Failed to load beats. Please try again.');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Filter beats wanneer search/genre wijzigt
  useEffect(() => {
    filterBeats();
  }, [searchTerm, selectedGenre, beats]);

  // Reset page bij view mode wijziging
  useEffect(() => {
    setCurrentPage(0);
  }, [viewMode]);

  const filterBeats = () => {
    let filtered = [...beats];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(beat => 
        beat.title.toLowerCase().includes(term) ||
        beat.genre.toLowerCase().includes(term) ||
        beat.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (selectedGenre !== 'All') {
      filtered = filtered.filter(beat => beat.genre === selectedGenre);
    }

    setFilteredBeats(filtered);
    setCurrentPage(0);
  };

  // Extract genres from real data
  const genres = ['All', ...Array.from(new Set(beats.map(b => b.genre)))];

  // Pagination
  const getBeatsPerPage = () => {
    if (viewMode === 'grid') {
      return window.innerWidth < 768 ? 6 : 12;
    }
    return window.innerWidth < 768 ? 5 : 7;
  };
  const BEATS_PER_PAGE = getBeatsPerPage();

  const totalPages = Math.ceil(filteredBeats.length / BEATS_PER_PAGE);
  const currentBeats = filteredBeats.slice(
    currentPage * BEATS_PER_PAGE,
    (currentPage + 1) * BEATS_PER_PAGE
  );

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get featured beats
  const featuredBeats = beats.filter(beat => beat.featured).slice(0, 6);

  return (
    <section id="beats" className="min-h-screen py-24 px-4 bg-transparent flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-3xl md:text-6xl font-bold neon-glow">Beat Store</h2>
        </div>

        {/* Featured Beats Section */}
        {!loading && featuredBeats.length > 0 && (
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <h3 className="text-2xl md:text-3xl font-bold text-purple-400">Featured Beats</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {featuredBeats.map((beat) => (
                <div
                  key={beat.id}
                  className="glass rounded-xl overflow-hidden hover:scale-105 transition-all group flex flex-col relative neon-border"
                >
                  {/* Featured Badge */}
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    ⭐ FEATURED
                  </div>

                  <div className="relative aspect-square">
                    <img
                      src={beat.artwork_url}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {playingId === beat.id ? (
                        <Pause className="w-8 h-8 text-white" fill="currentColor" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                      )}
                    </button>
                  </div>

                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="text-sm md:text-base font-bold mb-1 truncate">{beat.title}</h3>
                    <p className="text-xs text-gray-400 mb-2 truncate">{beat.artist}</p>

                    <div className="flex gap-1 mb-2">
                      <span className="px-2 py-0.5 bg-purple-900/30 rounded text-xs">{beat.bpm}</span>
                      <span className="px-2 py-0.5 bg-purple-900/30 rounded text-xs">{beat.key}</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base md:text-lg font-black text-purple-400">
                        €{beat.price.toFixed(0)}
                      </span>
                      <button
                        onClick={() => onAddToCart(beat, 'basic')}
                        className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-all hover:scale-110"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-purple-900/50"></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl md:text-2xl font-bold text-white">All Beats</h3>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            <input
              type="text"
              placeholder="Search beats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-4 glass rounded-xl text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:neon-border transition-all"
            />
          </div>

          <div className="relative w-24 md:w-auto">
            <Filter className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full pl-7 md:pl-10 pr-2 md:pr-3 py-2.5 md:py-4 glass rounded-xl text-white text-xs md:text-sm focus:outline-none focus:neon-border transition-all appearance-none cursor-pointer"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre} className="bg-gray-900">
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2.5 md:p-4 glass rounded-xl text-white hover:bg-purple-600/30 transition-all neon-border-subtle"
          >
            {viewMode === 'list' ? (
              <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <List className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center items-center flex-1">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin neon-border"></div>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="text-center flex-1 flex items-center justify-center">
            <div className="glass p-8 rounded-xl neon-border max-w-md">
              <p className="text-2xl text-red-400 mb-4">⚠️ {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredBeats.length === 0 ? (
          /* NO RESULTS */
          <div className="text-center flex-1 flex items-center justify-center">
            <div className="glass p-8 rounded-xl neon-border max-w-md">
              <p className="text-2xl text-gray-400 mb-4">No beats found</p>
              {beats.length === 0 ? (
                <p className="text-gray-500">Add beats via the admin dashboard</p>
              ) : (
                <p className="text-gray-500">Try adjusting your search filters</p>
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <div className="space-y-1 md:space-y-2">
            {currentBeats.map((beat, index) => (
              <div
                key={beat.id}
                className="glass hover:bg-purple-900/20 rounded-xl p-2 md:p-4 transition-all hover:scale-[1.02] group"
              >
                <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                  <div className="col-span-1 text-gray-400 text-xs md:text-sm font-semibold">
                    {currentPage * BEATS_PER_PAGE + index + 1}
                  </div>

                  <div className="col-span-5 flex items-center gap-2 md:gap-4">
                    <div className="relative w-10 h-10 md:w-16 md:h-16 flex-shrink-0">
                      <img
                        src={beat.artwork_url}
                        alt={beat.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      >
                        {playingId === beat.id ? (
                          <Pause className="w-4 h-4 md:w-6 md:h-6 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-4 h-4 md:w-6 md:h-6 text-white ml-1" fill="currentColor" />
                        )}
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-xs md:text-base font-semibold truncate">{beat.title}</p>
                        {beat.featured && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0">
                            ⭐ FEATURED
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs md:text-sm truncate">{beat.artist}</p>
                    </div>
                  </div>

                  <div className="col-span-2 text-gray-400 text-xs md:text-sm truncate">
                    {beat.genre}
                  </div>

                  <div className="col-span-2 text-gray-400 text-xs md:text-sm">
                    {beat.bpm} BPM • {beat.key}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2 md:gap-3">
                    <span className="text-sm md:text-xl font-bold text-purple-400">
                      €{beat.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onAddToCart(beat, 'basic')}
                      className="p-1.5 md:p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-all hover:scale-110"
                    >
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-3">
            {currentBeats.map((beat) => (
              <div
                key={beat.id}
                className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all group flex flex-col"
                style={{ minHeight: window.innerWidth < 768 ? '130px' : '180px' }}
              >
                <div className="relative aspect-square">
                  <img
                    src={beat.artwork_url}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {playingId === beat.id ? (
                      <Pause className="w-5 h-5 md:w-8 md:h-8 text-white" fill="currentColor" />
                    ) : (
                      <Play className="w-5 h-5 md:w-8 md:h-8 text-white ml-1" fill="currentColor" />
                    )}
                  </button>
                  {beat.featured && (
                    <div className="absolute top-0.5 right-0.5 md:top-2 md:right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐
                    </div>
                  )}
                </div>

                <div className="p-1.5 md:p-3 flex-1 flex flex-col">
                  <h3 className="text-xs md:text-sm font-bold mb-0.5 md:mb-1 truncate leading-tight">{beat.title}</h3>
                  <p className="text-xs text-gray-400 mb-0.5 md:mb-2 truncate">{beat.genre}</p>

                  <div className="flex gap-0.5 md:gap-1 mb-0.5 md:mb-1">
                    <span className="px-1 md:px-2 py-0.5 bg-purple-900/30 rounded text-xs leading-none">{beat.bpm}</span>
                    <span className="px-1 md:px-2 py-0.5 bg-purple-900/30 rounded text-xs leading-none">{beat.key}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs md:text-base font-black text-purple-400">
                      €{beat.price.toFixed(0)}
                    </span>
                    <button
                      onClick={() => onAddToCart(beat, 'basic')}
                      className="p-1.5 md:p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-all hover:scale-110"
                    >
                      <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredBeats.length > BEATS_PER_PAGE && (
          <div className="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="p-2 md:p-3 glass rounded-xl hover:bg-purple-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <span className="text-xl md:text-2xl font-bold text-purple-400 px-3 md:px-4 min-w-[40px] md:min-w-[50px] text-center">
              {currentPage + 1}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="p-2 md:p-3 glass rounded-xl hover:bg-purple-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}